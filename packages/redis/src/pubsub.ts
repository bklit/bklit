import { getRedisClient, isRedisAvailable } from "./client";
import { LIVE_EVENTS_CHANNEL, type LiveEvent } from "./types";

export async function publishLiveEvent(event: LiveEvent): Promise<void> {
  const client = getRedisClient();

  if (!(client && isRedisAvailable())) {
    return;
  }

  try {
    const message = JSON.stringify({
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    });

    // Add timeout to prevent hanging
    const publishPromise = client.publish(LIVE_EVENTS_CHANNEL, message);
    const timeoutPromise = new Promise<number>((_, reject) =>
      setTimeout(() => reject(new Error("Publish timeout after 5000ms")), 5000)
    );

    await Promise.race([publishPromise, timeoutPromise]);
  } catch (error) {
    // Don't throw - real-time is optional enhancement
    console.error("Failed to publish event:", error);
  }
}

export function createLiveEventSubscriber(
  onMessage: (event: LiveEvent) => void,
  onError?: (error: Error) => void
) {
  const client = getRedisClient();
  if (!client) {
    throw new Error("Redis client not available");
  }

  const subscriber = client.duplicate();

  subscriber.subscribe(LIVE_EVENTS_CHANNEL, (err) => {
    if (err) {
      console.error("Failed to subscribe:", err);
      onError?.(err);
    } else {
      console.log(`✅ Subscribed to ${LIVE_EVENTS_CHANNEL}`);
    }
  });

  subscriber.on("message", (channel, message) => {
    if (channel !== LIVE_EVENTS_CHANNEL) return;

    try {
      const event = JSON.parse(message) as LiveEvent;
      onMessage(event);
    } catch (error) {
      console.error("Failed to parse event:", error);
      onError?.(error as Error);
    }
  });

  return {
    unsubscribe: async () => {
      await subscriber.unsubscribe(LIVE_EVENTS_CHANNEL);
      await subscriber.quit();
    },
  };
}
