/**
 * One-shot: drain analytics:queue into ClickHouse using the same logic as the worker.
 *
 * Safer than hand-writing SQL. Events are already removed from Redis by popFromQueue
 * when processed — if the script crashes mid-batch, those pops are not rolled back,
 * so prefer running when traffic is low or stop the PM2 worker first.
 *
 * Usage (from repo root):
 *   pnpm --filter=@bklit/worker drain-queue
 *
 * Optional env:
 *   DRAIN_BATCH_SIZE=500   (default 500)
 *   DRAIN_MAX_BATCHES=     (omit = run until queue empty)
 */
import { AnalyticsService } from "@bklit/analytics";
import { getQueueDepth, popFromQueue, waitForRedisReady } from "@bklit/redis";
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
  console.log("[drain-queue] Starting", {
    BATCH_SIZE,
    MAX_BATCHES: Number.isFinite(MAX_BATCHES) ? MAX_BATCHES : "unlimited",
  });

  const analytics = new AnalyticsService();
  const state = createProcessorState();
  let batchIndex = 0;
  let totalOk = 0;
  let totalErr = 0;

  const initialDepth = await getQueueDepth();
  console.log(`[drain-queue] Queue depth before drain: ${initialDepth}`);

  while (batchIndex < MAX_BATCHES) {
    const depthBefore = await getQueueDepth();
    if (depthBefore === 0) {
      console.log("[drain-queue] Queue empty. Done.");
      break;
    }

    const events = await popFromQueue(BATCH_SIZE);
    if (events.length === 0) {
      console.log("[drain-queue] No events popped (race or empty). Done.");
      break;
    }

    console.log(
      `[drain-queue] Inserting ${events.length} events (ClickHouse is remote — first batch may take a few minutes)…`
    );

    const { processed, errors } = await processQueuedEvents(
      events,
      analytics,
      state,
      { skipVerification: true, quiet: true }
    );

    totalOk += processed;
    totalErr += errors;
    batchIndex++;

    const depthAfter = await getQueueDepth();
    console.log(
      `[drain-queue] batch ${batchIndex}: popped ${events.length}, ok ${processed}, err ${errors}, queue ~${depthAfter}`
    );
  }

  console.log("[drain-queue] Finished", {
    batches: batchIndex,
    totalOk,
    totalErr,
    remaining: await getQueueDepth(),
  });
}

main().catch((e) => {
  console.error("[drain-queue] Fatal:", e);
  process.exit(1);
});
