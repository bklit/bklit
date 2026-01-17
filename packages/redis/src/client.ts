import Redis from "ioredis";

let redisClient: Redis | null = null;
let isAvailable = false;

export interface RedisConfig {
  url?: string;
  maxRetries?: number;
}

export function createRedisClient(config?: RedisConfig): Redis | null {
  const url = config?.url || process.env.REDIS_URL;

  if (!url) {
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(url, {
        maxRetriesPerRequest: config?.maxRetries ?? 3,
        enableOfflineQueue: false, // Critical for serverless - don't queue commands if disconnected
        connectTimeout: 5000, // 5 second connection timeout
        keepAlive: 30000, // Keep connection alive for 30 seconds
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn("Redis connection failed - using polling fallback");
            return null;
          }
          return Math.min(times * 100, 2000);
        },
        lazyConnect: false, // Connect immediately, not on first command
        enableReadyCheck: true, // Wait for ready state before marking as connected
      });

      redisClient.on("connect", () => {
        console.log("✅ Redis connected - real-time enabled");
        isAvailable = true;
      });

      redisClient.on("error", (err) => {
        console.error("❌ Redis error:", err.message);
        isAvailable = false;
      });

      redisClient.on("close", () => {
        console.warn("⚠️ Redis closed - falling back to polling");
        isAvailable = false;
      });

      // Connection happens automatically with lazyConnect: false
    } catch (error) {
      console.error("Failed to initialize Redis:", error);
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
