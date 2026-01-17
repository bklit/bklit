import { getRedisClient, isRedisAvailable } from "./client";

const SESSION_TTL = 30 * 60; // 30 minutes in seconds
const SESSION_TTL_MS = SESSION_TTL * 1000; // in milliseconds
const COUNT_KEY_PREFIX = "live:project:";
const SESSION_KEY_PREFIX = "live:session:";
const SESSIONS_ZSET_PREFIX = "live:sessions:";

export async function trackSessionStart(
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
    const now = Date.now();

    // Add or update session in sorted set with current timestamp as score
    await client.zadd(sessionsKey, now, sessionId);

    // Set TTL on the sorted set itself (1 hour) to eventually clean up empty sets
    await client.expire(sessionsKey, SESSION_TTL * 2);

    // Clean up expired sessions (older than 30 minutes)
    await client.zremrangebyscore(sessionsKey, "-inf", now - SESSION_TTL_MS);
  } catch (error) {
    console.error("Redis session tracking error:", error);
  }
}

export async function trackSessionEnd(
  projectId: string,
  sessionId: string
): Promise<void> {
  if (!isRedisAvailable()) return;

  const client = getRedisClient();
  if (!client) return;

  try {
    const sessionsKey = `${SESSIONS_ZSET_PREFIX}${projectId}`;

    // Remove session from sorted set
    await client.zrem(sessionsKey, sessionId);

    console.log("[DEBUG] Session ended and removed from sorted set:", {
      projectId,
      sessionId,
    });
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
  if (!client) return null;

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
