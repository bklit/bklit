import { getRedisClient, isRedisAvailable } from "./client";

const SESSION_TTL = 2 * 60; // 2 minutes in seconds (for "live" indicator)
const SESSION_TTL_MS = SESSION_TTL * 1000; // in milliseconds
const COUNT_KEY_PREFIX = "live:project:";
const SESSION_KEY_PREFIX = "live:session:";
const SESSIONS_ZSET_PREFIX = "live:sessions:";

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

    console.log(`✅ [trackSessionStart] Tracking session: ${sessionId} in ${sessionsKey}, timestamp: ${now}`);

    // Add or update session in sorted set with current timestamp as score
    await client.zadd(sessionsKey, now, sessionId);

    // Set TTL on the sorted set itself (4 minutes) to eventually clean up empty sets
    await client.expire(sessionsKey, SESSION_TTL * 2);

    // Clean up expired sessions (older than 2 minutes)
    await client.zremrangebyscore(sessionsKey, "-inf", now - SESSION_TTL_MS);

    // Verify it was added
    const count = await client.zcard(sessionsKey);
    console.log(`✅ [trackSessionStart] Session added. Total sessions in ${sessionsKey}: ${count}`);
  } catch (error) {
    console.error("❌ [trackSessionStart] Redis session tracking error:", error);
  }
}

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
  } catch (error) {
    console.error("Redis session end error:", error);
  }
}

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
    // Use sorted set approach - automatically removes expired sessions
    const sessionsKey = `${SESSIONS_ZSET_PREFIX}${projectId}`;
    const now = Date.now();

    // Remove sessions that expired (score < now - SESSION_TTL_MS)
    await client.zremrangebyscore(sessionsKey, "-inf", now - SESSION_TTL_MS);

    // Count remaining active sessions
    const count = await client.zcard(sessionsKey);

    return Math.max(0, count); // Ensure never negative
  } catch (error) {
    console.error("Redis get count error:", error);
    return null;
  }
}

// Get expired sessions for a project (sessions with no activity in SESSION_TTL * 2)
export async function getExpiredSessions(
  projectId: string
): Promise<string[]> {
  if (!isRedisAvailable()) return [];

  const client = getRedisClient();
  if (!client) return [];

  try {
    const sessionsKey = `${SESSIONS_ZSET_PREFIX}${projectId}`;
    const now = Date.now();
    // Use the same TTL as set in trackSessionStart (SESSION_TTL * 2)
    const expiredThreshold = now - (SESSION_TTL * 2 * 1000);

    // Get all sessions that expired (score < now - (SESSION_TTL * 2 * 1000))
    const expiredSessions = await client.zrangebyscore(
      sessionsKey,
      "-inf",
      expiredThreshold
    );

    return expiredSessions;
  } catch (error) {
    console.error("Redis get expired sessions error:", error);
    return [];
  }
}

// Cleanup stale counts (optional maintenance task)
export async function cleanupStaleCounts(): Promise<void> {
  if (!isRedisAvailable()) return;

  const client = getRedisClient();
  if (!client) return;

  try {
    // Get all count keys
    const keys = await client.keys(`${COUNT_KEY_PREFIX}*:count`);

    for (const key of keys) {
      // Reset to 0 - sessions will re-increment if still active
      await client.set(key, "0");
    }
  } catch (error) {
    console.error("Redis cleanup error:", error);
  }
}
