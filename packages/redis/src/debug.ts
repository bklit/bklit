import { getRedisClient, isRedisAvailable } from "./client";

export type DebugStage =
  | "ingestion"
  | "queue"
  | "worker"
  | "clickhouse"
  | "pubsub"
  | "websocket";

export type DebugLevel = "info" | "warn" | "error";

export interface DebugLog {
  timestamp: string;
  stage: DebugStage;
  level: DebugLevel;
  message: string;
  data: Record<string, unknown>;
  eventId?: string; // Track specific event through entire pipeline
  projectId?: string;
  duration?: number; // For tracking stage latency
}

const DEBUG_CHANNEL = "debug-logs";

export async function publishDebugLog(log: DebugLog): Promise<void> {
  if (!isRedisAvailable()) {
    // Fallback to console if Redis unavailable
    console.log(`[${log.stage}] ${log.message}`, log.data);
    return;
  }

  const client = getRedisClient();
  if (!client) {
    console.log(`[${log.stage}] ${log.message}`, log.data);
    return;
  }

  try {
    const enrichedLog: DebugLog = {
      ...log,
      timestamp: log.timestamp || new Date().toISOString(),
    };

    await client.publish(DEBUG_CHANNEL, JSON.stringify(enrichedLog));
  } catch (error) {
    // Don't throw - debug logging is optional
    console.error("Failed to publish debug log:", error);
  }
}

export function createDebugSubscriber(
  onMessage: (log: DebugLog) => void,
  onError?: (error: Error) => void
) {
  const client = getRedisClient();
  if (!client) {
    throw new Error("Redis client not available");
  }

  const subscriber = client.duplicate();

  subscriber.subscribe(DEBUG_CHANNEL, (err) => {
    if (err) {
      console.error("Failed to subscribe to debug logs:", err);
      onError?.(err);
    } else {
      console.log(`✅ Subscribed to ${DEBUG_CHANNEL}`);
    }
  });

  subscriber.on("message", (channel, message) => {
    if (channel !== DEBUG_CHANNEL) return;

    try {
      const log = JSON.parse(message) as DebugLog;
      onMessage(log);
    } catch (error) {
      console.error("Failed to parse debug log:", error);
      onError?.(error as Error);
    }
  });

  return {
    unsubscribe: async () => {
      await subscriber.unsubscribe(DEBUG_CHANNEL);
      await subscriber.quit();
    },
  };
}

export const DEBUG_LOGS_CHANNEL = DEBUG_CHANNEL;

