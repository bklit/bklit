import { getRedisClient, isRedisAvailable } from "./client";

const SESSION_TTL = 30 * 60; // 30 minutes in seconds
const COUNT_KEY_PREFIX = "live:project:";
const SESSION_KEY_PREFIX = "live:session:";

export async function trackSessionStart(
  projectId: string,
  sessionId: string
): Promise<void> {
  if (!isRedisAvailable()) return;

  const client = getRedisClient();
  if (!client) return;

  try {
    const sessionKey = `${SESSION_KEY_PREFIX}${sessionId}`;
    const countKey = `${COUNT_KEY_PREFIX}${projectId}:count`;

    // Check if session already tracked
    const exists = await client.exists(sessionKey);

    if (exists) {
      // Existing session - just refresh TTL
      await client.expire(sessionKey, SESSION_TTL);
    } else {
      // New session - increment count and set session key
      await Promise.all([
        client.incr(countKey),
        client.setex(sessionKey, SESSION_TTL, projectId),
      ]);
    }
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
    const sessionKey = `${SESSION_KEY_PREFIX}${sessionId}`;
    const countKey = `${COUNT_KEY_PREFIX}${projectId}:count`;

    // Check if session exists before decrementing
    const exists = await client.exists(sessionKey);

    if (exists) {
      // Decrement count, ensuring it never goes below 0
      const currentCount = await client.get(countKey);
      const count = currentCount ? Number.parseInt(currentCount, 10) : 0;

      if (count > 0) {
        await Promise.all([client.decr(countKey), client.del(sessionKey)]);
      } else {
        // Just delete the session key if count is already 0
        await client.del(sessionKey);
      }
    }
  } catch (error) {
    console.error("Redis session end error:", error);
    // If there's an error (like corrupted key), try to reset the count
    try {
      const countKey = `${COUNT_KEY_PREFIX}${projectId}:count`;
      await client.del(countKey); // Delete corrupted key
    } catch {
      // Silently fail - ClickHouse fallback will handle it
    }
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
    const countKey = `${COUNT_KEY_PREFIX}${projectId}:count`;
    const count = await client.get(countKey);

    const numCount = count ? Number.parseInt(count, 10) : 0;
    return Math.max(0, numCount); // Ensure never negative
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
