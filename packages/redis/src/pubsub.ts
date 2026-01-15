import { getRedisClient, isRedisAvailable } from "./client";
import { LIVE_EVENTS_CHANNEL, type LiveEvent } from "./types";

export async function publishLiveEvent(event: LiveEvent): Promise<void> {
  // #region agent log
  console.log('[DEBUG H5] publishLiveEvent called:', { eventType: event.type, projectId: event.projectId, hasTimestamp: !!event.timestamp });
  // #endregion
  
  const client = getRedisClient();
  
  // #region agent log
  console.log('[DEBUG H1,H2] Redis client status:', { hasClient: !!client, isAvailable: isRedisAvailable(), redisUrl: process.env.REDIS_URL?.substring(0, 30) + '...' });
  // #endregion

  if (!(client && isRedisAvailable())) {
    // #region agent log
    console.log('[DEBUG H2] Early exit - Redis not available:', { hasClient: !!client, isAvailable: isRedisAvailable() });
    // #endregion
    return;
  }

  try {
    const message = JSON.stringify({
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    });
    
    // #region agent log
    console.log('[DEBUG H3,H5] About to publish to Redis:', { channel: LIVE_EVENTS_CHANNEL, messageLength: message.length, eventType: event.type });
    // #endregion

    // Verify client is actually ready before publishing
    const status = client.status;
    // #region agent log
    console.log('[DEBUG H6] Redis client status before publish:', { status: status, isReady: status === 'ready', isConnecting: status === 'connecting' });
    // #endregion

    // Add timeout wrapper to prevent hanging - increase to 5 seconds for Upstash latency
    const publishPromise = client.publish(LIVE_EVENTS_CHANNEL, message);
    const timeoutPromise = new Promise<number>((_, reject) => 
      setTimeout(() => reject(new Error('Publish timeout after 5000ms')), 5000)
    );
    
    const subscriberCount = await Promise.race([publishPromise, timeoutPromise]);
    
    // #region agent log
    console.log('[DEBUG H3] Successfully published to Redis:', { channel: LIVE_EVENTS_CHANNEL, eventType: event.type, subscriberCount: subscriberCount });
    // #endregion
  } catch (error) {
    // #region agent log
    console.error('[DEBUG H3] Redis publish error:', { error: error instanceof Error ? error.message : String(error), errorStack: error instanceof Error ? error.stack : undefined });
    // #endregion
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
