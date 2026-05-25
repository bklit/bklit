import { createServer } from "node:http";
import { AnalyticsService } from "@bklit/analytics";
import {
  ackClaimed,
  claimFromQueue,
  getTotalQueueDepth,
  isRedisAvailable,
  publishDebugLog,
  recoverProcessingQueue,
  requeueClaimed,
  waitForRedisReady,
} from "@bklit/redis";
import { config } from "dotenv";
import {
  createProcessorState,
  processQueuedEvents,
} from "./process-queued-events";
import {
  getWorkerHealthSnapshot,
  recordWorkerBatch,
  recordWorkerIdle,
  startRuntimeGuards,
} from "./runtime-guards";

config();

const WORKER_HEALTH_PORT = Number(process.env.WORKER_HEALTH_PORT) || 8081;

console.log("[Worker] Environment check:", {
  NODE_ENV: process.env.NODE_ENV,
  DEV_CLICKHOUSE_HOST: process.env.DEV_CLICKHOUSE_HOST,
  CLICKHOUSE_HOST: process.env.CLICKHOUSE_HOST?.slice(0, 30),
});

const POLL_INTERVAL_MS = 1000;
const BATCH_SIZE = 100;

const processorState = createProcessorState();

let isProcessing = false;

startRuntimeGuards({
  serviceName: "bklit-worker",
  onHeartbeat: async () => {
    try {
      const queueDepth = await getTotalQueueDepth();
      recordWorkerIdle(queueDepth);
    } catch {
      recordWorkerIdle(0);
    }

    const health = getWorkerHealthSnapshot("bklit-worker");
    console.log(
      `[heartbeat] worker alive — processed ${health.totalProcessed} total, queue ${health.lastQueueDepth}`
    );
  },
});

const healthServer = createServer((req, res) => {
  if (req.method === "GET" && req.url?.split("?")[0] === "/health") {
    const health = getWorkerHealthSnapshot("bklit-worker");
    res.writeHead(health.ok ? 200 : 503, {
      "Content-Type": "application/json",
    });
    res.end(JSON.stringify(health));
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

healthServer.listen(WORKER_HEALTH_PORT, () => {
  console.log(
    `[Worker] Health endpoint listening on http://127.0.0.1:${WORKER_HEALTH_PORT}/health`
  );
});

async function startWorker() {
  try {
    await waitForRedisReady();
    await recoverProcessingQueue();
  } catch (error) {
    console.warn(
      "[Worker] Redis not ready on startup — will retry in process loop:",
      error instanceof Error ? error.message : error
    );
  }
}

void startWorker();

async function processBatch() {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  try {
    if (!isRedisAvailable()) {
      try {
        await waitForRedisReady(8000);
      } catch {
        console.warn(
          "[Worker] Redis not ready (Upstash/TLS); skipping batch — will retry next tick"
        );
        isProcessing = false;
        return;
      }
    }

    const queueDepth = await getTotalQueueDepth();
    recordWorkerIdle(queueDepth);

    if (queueDepth === 0) {
      isProcessing = false;
      return;
    }

    await publishDebugLog({
      timestamp: new Date().toISOString(),
      stage: "worker",
      level: "info",
      message: "Starting batch processing",
      data: { queueDepth, batchSize: BATCH_SIZE },
    });

    const claimed = await claimFromQueue(BATCH_SIZE);

    if (claimed.length === 0) {
      isProcessing = false;
      return;
    }

    const startTime = Date.now();
    const analytics = new AnalyticsService();
    let batchProcessed = 0;
    let batchErrors = 0;

    for (const item of claimed) {
      const { processed, errors } = await processQueuedEvents(
        [item.event],
        analytics,
        processorState,
        { skipVerification: false }
      );

      if (processed === 1) {
        await ackClaimed(item.raw);
        batchProcessed++;
      } else if (errors === 1) {
        await requeueClaimed(item.raw);
        batchErrors++;
      } else {
        // Non-retriable skip (e.g. missing event definition)
        await ackClaimed(item.raw);
      }
    }

    const remainingInQueue = await getTotalQueueDepth();
    recordWorkerBatch(batchProcessed, batchErrors, remainingInQueue);

    const duration = Date.now() - startTime;
    const avgDuration = duration / claimed.length;

    await publishDebugLog({
      timestamp: new Date().toISOString(),
      stage: "worker",
      level: "info",
      message: "Batch processing completed",
      data: {
        claimed: claimed.length,
        processed: batchProcessed,
        requeued: batchErrors,
        duration,
        avgDuration,
        totalProcessed: getWorkerHealthSnapshot("bklit-worker").totalProcessed,
        totalErrors: getWorkerHealthSnapshot("bklit-worker").totalErrors,
        remainingInQueue,
      },
    });

    console.log(
      `✅ Processed ${batchProcessed} events in ${duration}ms (${batchErrors} requeued, avg: ${avgDuration.toFixed(2)}ms/event)`
    );
  } catch (error) {
    await publishDebugLog({
      timestamp: new Date().toISOString(),
      stage: "worker",
      level: "error",
      message: "Batch processing error",
      data: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    console.error("Batch processing error:", error);
  } finally {
    isProcessing = false;
  }
}

setInterval(processBatch, POLL_INTERVAL_MS);

console.log(
  `🔄 Background worker started (polling every ${POLL_INTERVAL_MS}ms, batch size: ${BATCH_SIZE})`
);
console.log("📊 Stats will be logged to debug-logs channel");

process.on("SIGTERM", () => {
  console.log("[SHUTDOWN] SIGTERM received");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[SHUTDOWN] SIGINT received");
  process.exit(0);
});
