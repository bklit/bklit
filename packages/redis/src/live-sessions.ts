import { getRedisClient, isRedisAvailable } from "./client";

const SESSIONS_ZSET_PREFIX = "live:sessions:";

/**
 * Track session start in Redis sorted set
 * WebSocket disconnect will trigger trackSessionEnd for instant removal
 */
export async function trackSessionStart(
  projectId: string,
  sessionId: string
): Promise<void> {
  if (!isRedisAvailable()) {
    console.log("⚠️ [trackSessionStart] Redis not available");
    return;
  }

  const client = getRedisClient();
  if (!client) {
    console.log("⚠️ [trackSessionStart] No Redis client");
    return;
  }

  try {
    const sessionsKey = `${SESSIONS_ZSET_PREFIX}${projectId}`;
    const now = Date.now();

    console.log(
      `✅ [trackSessionStart] Tracking session: ${sessionId} in ${sessionsKey}, timestamp: ${now}`
    );

    // Add or update session in sorted set with current timestamp as score
    await client.zadd(sessionsKey, now, sessionId);

    // Verify it was added
    const count = await client.zcard(sessionsKey);
    console.log(
      `✅ [trackSessionStart] Session added. Total sessions in ${sessionsKey}: ${count}`
    );
  } catch (error) {
    console.error(
      "❌ [trackSessionStart] Redis session tracking error:",
      error
    );
  }
}

/**
 * Remove session from Redis when WebSocket disconnects
 */
export async function trackSessionEnd(
  projectId: string,
  sessionId: string
): Promise<void> {
  if (!isRedisAvailable()) {
    return;
  }

  const client = getRedisClient();
  if (!client) {
    return;
  }

  try {
    const sessionsKey = `${SESSIONS_ZSET_PREFIX}${projectId}`;

    // Remove session from sorted set
    await client.zrem(sessionsKey, sessionId);

    console.log(
      `✅ [trackSessionEnd] Session ${sessionId} removed from ${sessionsKey}`
    );
  } catch (error) {
    console.error("Redis session end error:", error);
  }
}

/**
 * Get count of live sessions for a project
 * Sessions are removed instantly when WebSocket disconnects
 */
export async function getLiveUserCount(
  projectId: string
): Promise<number | null> {
  if (!isRedisAvailable()) {
    return null; // Signal to use ClickHouse fallback
  }

  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const sessionsKey = `${SESSIONS_ZSET_PREFIX}${projectId}`;

    // Count active sessions (no expiry needed - WebSocket disconnect removes them)
    const count = await client.zcard(sessionsKey);

    return Math.max(0, count); // Ensure never negative
  } catch (error) {
    console.error("Redis get count error:", error);
    return null;
  }
}
