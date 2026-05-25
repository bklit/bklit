import { getRedisClient, isRedisAvailable } from "./client";
import { publishDebugLog } from "./debug";

const QUEUE_KEY = "analytics:queue";
const PROCESSING_KEY = "analytics:queue:processing";
const FAILED_QUEUE_KEY = "analytics:queue:failed";

export interface QueuedEvent {
  id: string;
  type: "pageview" | "event";
  payload: Record<string, unknown>;
  queuedAt: string;
  projectId: string;
}

export interface ClaimedQueueEvent {
  raw: string;
  event: QueuedEvent;
}

export async function pushToQueue(event: QueuedEvent): Promise<void> {
  if (!isRedisAvailable()) {
    throw new Error("Redis not available - cannot queue event");
  }

  const client = getRedisClient();
  if (!client) {
    throw new Error("Redis client not available");
  }

  try {
    const startTime = Date.now();
    await client.lpush(QUEUE_KEY, JSON.stringify(event));
    const duration = Date.now() - startTime;

    await publishDebugLog({
      timestamp: new Date().toISOString(),
      stage: "queue",
      level: "info",
      message: "Event queued",
      data: { queueKey: QUEUE_KEY, eventType: event.type },
      eventId: event.id,
      projectId: event.projectId,
      duration,
    });
  } catch (error) {
    await publishDebugLog({
      timestamp: new Date().toISOString(),
      stage: "queue",
      level: "error",
      message: "Failed to queue event",
      data: {
        error: error instanceof Error ? error.message : String(error),
      },
      eventId: event.id,
      projectId: event.projectId,
    });
    throw error;
  }
}

/**
 * Atomically move events from the main queue to a processing list.
 * Events stay in Redis until ackClaimed() or requeueClaimed().
 */
export async function claimFromQueue(
  count = 100
): Promise<ClaimedQueueEvent[]> {
  if (!isRedisAvailable()) {
    return [];
  }

  const client = getRedisClient();
  if (!client) {
    return [];
  }

  try {
    const claimed: ClaimedQueueEvent[] = [];

    for (let i = 0; i < count; i++) {
      const raw = await client.rpoplpush(QUEUE_KEY, PROCESSING_KEY);
      if (!raw) {
        break;
      }

      try {
        claimed.push({ raw, event: JSON.parse(raw) as QueuedEvent });
      } catch (error) {
        console.error("Failed to parse queued event:", error);
        await client.lrem(PROCESSING_KEY, 1, raw);
        await client.lpush(FAILED_QUEUE_KEY, raw);
      }
    }

    if (claimed.length > 0) {
      await publishDebugLog({
        timestamp: new Date().toISOString(),
        stage: "queue",
        level: "info",
        message: "Batch claimed from queue",
        data: { count: claimed.length, requestedCount: count },
      });
    }

    return claimed;
  } catch (error) {
    console.error("Failed to claim from queue:", error);
    return [];
  }
}

export async function ackClaimed(raw: string): Promise<void> {
  const client = getRedisClient();
  if (!client) {
    return;
  }

  await client.lrem(PROCESSING_KEY, 1, raw);
}

export async function requeueClaimed(raw: string): Promise<void> {
  const client = getRedisClient();
  if (!client) {
    return;
  }

  await client.lrem(PROCESSING_KEY, 1, raw);
  await client.rpush(QUEUE_KEY, raw);

  await publishDebugLog({
    timestamp: new Date().toISOString(),
    stage: "queue",
    level: "warn",
    message: "Event requeued after processing failure",
    data: { queueKey: QUEUE_KEY },
  });
}

/** Move in-flight items back to the main queue (worker startup recovery). */
export async function recoverProcessingQueue(): Promise<number> {
  const client = getRedisClient();
  if (!client) {
    return 0;
  }

  let recovered = 0;

  while (true) {
    const raw = await client.rpoplpush(PROCESSING_KEY, QUEUE_KEY);
    if (!raw) {
      break;
    }
    recovered++;
  }

  if (recovered > 0) {
    console.log(
      `[queue] Recovered ${recovered} in-flight event(s) from processing list`
    );
  }

  return recovered;
}

/** @deprecated Use claimFromQueue + ackClaimed for reliable processing. */
export async function popFromQueue(count = 100): Promise<QueuedEvent[]> {
  const claimed = await claimFromQueue(count);
  const events = claimed.map((item) => item.event);

  for (const item of claimed) {
    await ackClaimed(item.raw);
  }

  return events;
}

export async function getQueueDepth(): Promise<number> {
  if (!isRedisAvailable()) {
    return 0;
  }

  const client = getRedisClient();
  if (!client) {
    return 0;
  }

  try {
    return await client.llen(QUEUE_KEY);
  } catch (error) {
    console.error("Failed to get queue depth:", error);
    return 0;
  }
}

export async function getProcessingQueueDepth(): Promise<number> {
  if (!isRedisAvailable()) {
    return 0;
  }

  const client = getRedisClient();
  if (!client) {
    return 0;
  }

  try {
    return await client.llen(PROCESSING_KEY);
  } catch (error) {
    console.error("Failed to get processing queue depth:", error);
    return 0;
  }
}

export async function getTotalQueueDepth(): Promise<number> {
  const [queued, processing] = await Promise.all([
    getQueueDepth(),
    getProcessingQueueDepth(),
  ]);
  return queued + processing;
}

export async function getFailedQueueDepth(): Promise<number> {
  if (!isRedisAvailable()) {
    return 0;
  }

  const client = getRedisClient();
  if (!client) {
    return 0;
  }

  try {
    return await client.llen(FAILED_QUEUE_KEY);
  } catch (error) {
    return 0;
  }
}
