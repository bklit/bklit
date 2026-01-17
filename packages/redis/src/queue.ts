import { getRedisClient, isRedisAvailable } from "./client";
import { publishDebugLog } from "./debug";

const QUEUE_KEY = "analytics:queue";
const FAILED_QUEUE_KEY = "analytics:queue:failed";

export interface QueuedEvent {
  id: string;
  type: "pageview" | "event";
  payload: Record<string, unknown>;
  queuedAt: string;
  projectId: string;
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

export async function popFromQueue(count = 100): Promise<QueuedEvent[]> {
  if (!isRedisAvailable()) {
    return [];
  }

  const client = getRedisClient();
  if (!client) {
    return [];
  }

  try {
    const events: QueuedEvent[] = [];

    // Pop multiple items from queue
    for (let i = 0; i < count; i++) {
      const item = await client.rpop(QUEUE_KEY);
      if (!item) break;

      try {
        events.push(JSON.parse(item));
      } catch (error) {
        console.error("Failed to parse queued event:", error);
        // Move to failed queue
        await client.lpush(FAILED_QUEUE_KEY, item);
      }
    }

    if (events.length > 0) {
      await publishDebugLog({
        timestamp: new Date().toISOString(),
        stage: "queue",
        level: "info",
        message: "Batch popped from queue",
        data: { count: events.length, requestedCount: count },
      });
    }

    return events;
  } catch (error) {
    console.error("Failed to pop from queue:", error);
    return [];
  }
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
