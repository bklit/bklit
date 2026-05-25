/**
 * One-shot: drain analytics:queue into ClickHouse using the same logic as the worker.
 *
 * Uses claim/ack — events remain in Redis until ClickHouse insert succeeds.
 *
 * Usage (from repo root):
 *   pnpm --filter=@bklit/worker drain-queue
 *
 * Optional env:
 *   DRAIN_BATCH_SIZE=500   (default 500)
 *   DRAIN_MAX_BATCHES=     (omit = run until queue empty)
 */
import { AnalyticsService } from "@bklit/analytics";
import {
  ackClaimed,
  claimFromQueue,
  getTotalQueueDepth,
  recoverProcessingQueue,
  requeueClaimed,
  waitForRedisReady,
} from "@bklit/redis";
import { config } from "dotenv";
import {
  createProcessorState,
  processQueuedEvents,
} from "./process-queued-events";

config();

const BATCH_SIZE = Number(process.env.DRAIN_BATCH_SIZE) || 500;
const MAX_BATCHES = process.env.DRAIN_MAX_BATCHES
  ? Number(process.env.DRAIN_MAX_BATCHES)
  : Number.POSITIVE_INFINITY;

function logRedisTarget() {
  const raw = process.env.REDIS_URL;
  if (!raw) {
    console.log("[drain-queue] REDIS_URL is not set");
    return;
  }
  try {
    const u = new URL(raw);
    console.log(
      "[drain-queue] Redis host:",
      u.hostname,
      "(must match prod Upstash to drain prod backlog)"
    );
  } catch {
    console.log("[drain-queue] REDIS_URL set (unparseable URL for logging)");
  }
}

async function main() {
  logRedisTarget();
  console.log("[drain-queue] Waiting for Redis (TLS can take a moment)…");
  await waitForRedisReady();
  await recoverProcessingQueue();
  console.log("[drain-queue] Starting", {
    BATCH_SIZE,
    MAX_BATCHES: Number.isFinite(MAX_BATCHES) ? MAX_BATCHES : "unlimited",
  });

  const analytics = new AnalyticsService();
  const state = createProcessorState();
  let batchIndex = 0;
  let totalOk = 0;
  let totalErr = 0;

  const initialDepth = await getTotalQueueDepth();
  console.log(`[drain-queue] Queue depth before drain: ${initialDepth}`);

  while (batchIndex < MAX_BATCHES) {
    const depthBefore = await getTotalQueueDepth();
    if (depthBefore === 0) {
      console.log("[drain-queue] Queue empty. Done.");
      break;
    }

    const claimed = await claimFromQueue(BATCH_SIZE);
    if (claimed.length === 0) {
      console.log("[drain-queue] No events claimed (race or empty). Done.");
      break;
    }

    console.log(
      `[drain-queue] Inserting ${claimed.length} events (ClickHouse is remote — first batch may take a few minutes)…`
    );

    let batchOk = 0;
    let batchErr = 0;

    for (const item of claimed) {
      const { processed, errors } = await processQueuedEvents(
        [item.event],
        analytics,
        state,
        { skipVerification: true, quiet: true }
      );

      if (processed === 1) {
        await ackClaimed(item.raw);
        batchOk++;
      } else if (errors === 1) {
        await requeueClaimed(item.raw);
        batchErr++;
      } else {
        await ackClaimed(item.raw);
      }
    }

    totalOk += batchOk;
    totalErr += batchErr;
    batchIndex++;

    const depthAfter = await getTotalQueueDepth();
    console.log(
      `[drain-queue] batch ${batchIndex}: claimed ${claimed.length}, ok ${batchOk}, requeued ${batchErr}, queue ~${depthAfter}`
    );
  }

  console.log("[drain-queue] Finished", {
    batches: batchIndex,
    totalOk,
    totalErr,
    remaining: await getTotalQueueDepth(),
  });
}

main().catch((e) => {
  console.error("[drain-queue] Fatal:", e);
  process.exit(1);
});
