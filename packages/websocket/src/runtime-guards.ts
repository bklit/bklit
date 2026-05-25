interface RuntimeGuardOptions {
  serviceName: string;
  heartbeatIntervalMs?: number;
  maxEventLoopLagMs?: number;
  onHeartbeat?: () => void;
}

interface HealthSnapshot {
  service: string;
  ok: boolean;
  uptimeSeconds: number;
  startedAt: string;
  lastHeartbeatAt: string;
  lastActivityAt: string;
  eventLoopLagMs: number;
}

const startedAt = Date.now();
let lastHeartbeatAt = Date.now();
let lastActivityAt = Date.now();
let lastEventLoopCheckAt = Date.now();
let eventLoopLagMs = 0;

export function touchActivity(): void {
  lastActivityAt = Date.now();
}

export function getHealthSnapshot(serviceName: string): HealthSnapshot {
  const now = Date.now();
  return {
    service: serviceName,
    ok: now - lastHeartbeatAt < 120_000,
    uptimeSeconds: Math.floor((now - startedAt) / 1000),
    startedAt: new Date(startedAt).toISOString(),
    lastHeartbeatAt: new Date(lastHeartbeatAt).toISOString(),
    lastActivityAt: new Date(lastActivityAt).toISOString(),
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

    lastHeartbeatAt = now;
    onHeartbeat?.();
  }, heartbeatIntervalMs).unref?.();

  console.log(`[runtime] ${serviceName} guards enabled`);
}
