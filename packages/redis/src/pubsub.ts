import { getRedisClient, isRedisAvailable } from "./client";
import { LIVE_EVENTS_CHANNEL, type LiveEvent } from "./types";

export async function publishLiveEvent(event: LiveEvent): Promise<void> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pubsub.ts:4',message:'publishLiveEvent called',data:{eventType:event.type,projectId:event.projectId,hasTimestamp:!!event.timestamp},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
  // #endregion
  
  const client = getRedisClient();
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pubsub.ts:8',message:'Redis client status',data:{hasClient:!!client,isAvailable:isRedisAvailable(),redisUrl:process.env.REDIS_URL?.substring(0,20)+'...'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2'})}).catch(()=>{});
  // #endregion

  if (!(client && isRedisAvailable())) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pubsub.ts:12',message:'Early exit - Redis not available',data:{hasClient:!!client,isAvailable:isRedisAvailable()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    return;
  }

  try {
    const message = JSON.stringify({
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pubsub.ts:24',message:'About to publish to Redis',data:{channel:LIVE_EVENTS_CHANNEL,messageLength:message.length,eventType:event.type},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3,H5'})}).catch(()=>{});
    // #endregion

    await client.publish(LIVE_EVENTS_CHANNEL, message);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pubsub.ts:28',message:'Successfully published to Redis',data:{channel:LIVE_EVENTS_CHANNEL,eventType:event.type},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pubsub.ts:32',message:'Redis publish error',data:{error:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
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
