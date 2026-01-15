import Redis from "ioredis";

let redisClient: Redis | null = null;
let isAvailable = false;

export interface RedisConfig {
  url?: string;
  maxRetries?: number;
}

export function createRedisClient(config?: RedisConfig): Redis | null {
  const url = config?.url || process.env.REDIS_URL;
  
  // #region agent log
  console.log('[DEBUG H1] createRedisClient called:', { hasConfigUrl: !!config?.url, hasEnvUrl: !!process.env.REDIS_URL, urlPrefix: url?.substring(0, 30) });
  // #endregion

  if (!url) {
    // #region agent log
    console.log('[DEBUG H1] No Redis URL - returning null:', { hasConfigUrl: !!config?.url, hasEnvUrl: !!process.env.REDIS_URL });
    // #endregion
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(url, {
        maxRetriesPerRequest: config?.maxRetries ?? 3,
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn("Redis connection failed - using polling fallback");
            return null;
          }
          return Math.min(times * 100, 2000);
        },
        lazyConnect: false, // Connect immediately, not on first command
      });

      redisClient.on("connect", () => {
        console.log("✅ Redis connected - real-time enabled");
        isAvailable = true;
        // #region agent log
        console.log('[DEBUG H2] Redis connect event fired:', { isAvailable: true });
        // #endregion
      });

      redisClient.on("error", (err) => {
        console.error("❌ Redis error:", err.message);
        isAvailable = false;
        // #region agent log
        console.error('[DEBUG H2] Redis error event:', { errorMessage: err.message, isAvailable: false });
        // #endregion
      });

      redisClient.on("close", () => {
        console.warn("⚠️ Redis closed - falling back to polling");
        isAvailable = false;
      });

      // Connection happens automatically with lazyConnect: false
      // #region agent log
      console.log('[DEBUG H2] Redis client created:', { isAvailableNow: isAvailable });
      // #endregion
    } catch (error) {
      console.error("Failed to initialize Redis:", error);
      // #region agent log
      console.error('[DEBUG H1,H2] Redis initialization error:', { error: error instanceof Error ? error.message : String(error) });
      // #endregion
      return null;
    }
  }

  return redisClient;
}

export function getRedisClient(): Redis | null {
  // Force recreation if URL is now available but client is null
  if (!redisClient && process.env.REDIS_URL) {
    return createRedisClient();
  }

  if (!redisClient) {
    return createRedisClient();
  }
  return redisClient;
}

export function isRedisAvailable(): boolean {
  return isAvailable;
}

export async function checkRedisHealth(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isAvailable = false;
  }
}
