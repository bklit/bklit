interface RuntimeGuardOptions {
  serviceName: string;
  heartbeatIntervalMs?: number;
  maxEventLoopLagMs?: number;
  onHeartbeat?: () => void;
}

interface WorkerHealthSnapshot {
  service: string;
  ok: boolean;
  uptimeSeconds: number;
  startedAt: string;
  lastHeartbeatAt: string;
  lastBatchAt: string;
  lastQueueDepth: number;
  totalProcessed: number;
  totalErrors: number;
  eventLoopLagMs: number;
}

const startedAt = Date.now();
let lastHeartbeatAt = Date.now();
let lastBatchAt = Date.now();
let lastEventLoopCheckAt = Date.now();
let eventLoopLagMs = 0;
let lastQueueDepth = 0;
let totalProcessed = 0;
let totalErrors = 0;

export function recordWorkerBatch(
  processed: number,
  errors: number,
  queueDepth: number
): void {
  lastBatchAt = Date.now();
  lastQueueDepth = queueDepth;
  totalProcessed += processed;
  totalErrors += errors;
}

export function recordWorkerIdle(queueDepth: number): void {
  lastQueueDepth = queueDepth;
}

export function getWorkerHealthSnapshot(
  serviceName: string
): WorkerHealthSnapshot {
  const now = Date.now();
  const queueBacklogged = lastQueueDepth > 0;
  const batchStale = queueBacklogged && now - lastBatchAt > 300_000;

  return {
    service: serviceName,
    ok: now - lastHeartbeatAt < 120_000 && !batchStale,
    uptimeSeconds: Math.floor((now - startedAt) / 1000),
    startedAt: new Date(startedAt).toISOString(),
    lastHeartbeatAt: new Date(lastHeartbeatAt).toISOString(),
    lastBatchAt: new Date(lastBatchAt).toISOString(),
    lastQueueDepth,
    totalProcessed,
    totalErrors,
    eventLoopLagMs,
  };
}

export function startRuntimeGuards(options: RuntimeGuardOptions): void {
  const {
    serviceName,
    heartbeatIntervalMs = 30_000,
    maxEventLoopLagMs = 120_000,
    onHeartbeat,
  } = options;

  const fatalExit = (reason: string, detail?: unknown) => {
    console.error(`[FATAL][${serviceName}] ${reason}`, detail ?? "");
    process.exit(1);
  };

  process.on("uncaughtException", (error) => {
    fatalExit("uncaughtException", error);
  });

  process.on("unhandledRejection", (reason) => {
    fatalExit("unhandledRejection", reason);
  });

  setInterval(() => {
    const now = Date.now();
    const expectedInterval = heartbeatIntervalMs;
    const lag = now - lastEventLoopCheckAt - expectedInterval;
    lastEventLoopCheckAt = now;
    eventLoopLagMs = Math.max(0, lag);

    if (lag > maxEventLoopLagMs) {
      fatalExit(`event loop blocked for ${lag}ms`);
    }

    if (lastQueueDepth > 0 && now - lastBatchAt > 300_000) {
      fatalExit(
        `queue backlog ${lastQueueDepth} with no batch for ${now - lastBatchAt}ms`
      );
    }

    lastHeartbeatAt = now;
    onHeartbeat?.();
  }, heartbeatIntervalMs).unref?.();

  console.log(`[runtime] ${serviceName} guards enabled`);
}
