import { getRedisClient, isRedisAvailable } from "./client";

const SESSION_TTL = 30 * 60; // 30 minutes in seconds
const COUNT_KEY_PREFIX = "live:project:";
const SESSION_KEY_PREFIX = "live:session:";

export async function trackSessionStart(
  projectId: string,
  sessionId: string
): Promise<void> {
  // #region agent log
  console.log('[DEBUG H4] trackSessionStart called:', { projectId: projectId, sessionId: sessionId, isAvailable: isRedisAvailable() });
  // #endregion
  
  if (!isRedisAvailable()) {
    // #region agent log
    console.log('[DEBUG H4] trackSessionStart - Redis not available');
    // #endregion
    return;
  }

  const client = getRedisClient();
  if (!client) {
    return;
  }

  try {
    const sessionKey = `${SESSION_KEY_PREFIX}${sessionId}`;
    const countKey = `${COUNT_KEY_PREFIX}${projectId}:count`;

    // Check if session already tracked
    const exists = await client.exists(sessionKey);
    
    // #region agent log
    console.log('[DEBUG H4] Session existence check:', { sessionKey: sessionKey, exists: exists, countKey: countKey });
    // #endregion

    if (exists) {
      // Existing session - just refresh TTL
      await client.expire(sessionKey, SESSION_TTL);
      // #region agent log
      console.log('[DEBUG H4] Existing session - refreshed TTL:', { sessionKey: sessionKey, ttl: SESSION_TTL });
      // #endregion
    } else {
      // New session - increment count and set session key
      // First ensure the count key exists as an integer
      const currentCount = await client.get(countKey);
      if (currentCount && isNaN(Number.parseInt(currentCount, 10))) {
        await client.del(countKey);
      }

      await Promise.all([
        client.incr(countKey),
        client.setex(sessionKey, SESSION_TTL, projectId),
      ]);
      
      const newCount = await client.get(countKey);
      // #region agent log
      console.log('[DEBUG H4] New session - incremented count:', { sessionKey: sessionKey, countKey: countKey, currentCount: currentCount, newCount: newCount });
      // #endregion
    }
  } catch (error) {
    console.error("Redis session tracking error:", error);
    // #region agent log
    console.error('[DEBUG H4] trackSessionStart error:', { error: error instanceof Error ? error.message : String(error) });
    // #endregion
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
      // Safely decrement count
      try {
        const currentCount = await client.get(countKey);

        // If value is not a valid integer, reset it to 0
        if (currentCount && isNaN(Number.parseInt(currentCount, 10))) {
          await client.set(countKey, "0");
          await client.del(sessionKey);
          return;
        }

        const count = currentCount ? Number.parseInt(currentCount, 10) : 0;

        if (count > 0) {
          await client.decr(countKey);
        }

        await client.del(sessionKey);
      } catch (decrError) {
        console.error("Redis session end error:", decrError);
        // Reset the corrupted key
        await client.del(countKey);
        await client.del(sessionKey);
      }
    }
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
    const countKey = `${COUNT_KEY_PREFIX}${projectId}:count`;
    const count = await client.get(countKey);

    // If value is not a valid integer string, reset it
    if (count && isNaN(Number.parseInt(count, 10))) {
      await client.del(countKey);
      return 0;
    }

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
