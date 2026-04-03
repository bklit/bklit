import { AnalyticsService } from "@bklit/analytics";
import {
  getQueueDepth,
  isRedisAvailable,
  popFromQueue,
  publishDebugLog,
  waitForRedisReady,
} from "@bklit/redis";
import { config } from "dotenv";
import {
  createProcessorState,
  processQueuedEvents,
} from "./process-queued-events";

config();

console.log("[Worker] Environment check:", {
  NODE_ENV: process.env.NODE_ENV,
  DEV_CLICKHOUSE_HOST: process.env.DEV_CLICKHOUSE_HOST,
  CLICKHOUSE_HOST: process.env.CLICKHOUSE_HOST?.slice(0, 30),
});

const POLL_INTERVAL_MS = 1000;
const BATCH_SIZE = 100;

const processorState = createProcessorState();

let isProcessing = false;
let totalProcessed = 0;
let totalErrors = 0;

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

    const queueDepth = await getQueueDepth();

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

    const events = await popFromQueue(BATCH_SIZE);

    if (events.length === 0) {
      isProcessing = false;
      return;
    }

    const startTime = Date.now();
    const analytics = new AnalyticsService();

    const { processed, errors } = await processQueuedEvents(
      events,
      analytics,
      processorState,
      { skipVerification: false }
    );

    totalProcessed += processed;
    totalErrors += errors;

    const duration = Date.now() - startTime;
    const avgDuration = duration / events.length;

    await publishDebugLog({
      timestamp: new Date().toISOString(),
      stage: "worker",
      level: "info",
      message: "Batch processing completed",
      data: {
        processed: events.length,
        duration,
        avgDuration,
        totalProcessed,
        totalErrors,
        remainingInQueue: await getQueueDepth(),
      },
    });

    console.log(
      `✅ Processed ${events.length} events in ${duration}ms (avg: ${avgDuration.toFixed(2)}ms/event)`
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
