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
        connectTimeout: 10_000, // TLS to Upstash can be slow from some regions
        keepAlive: 30_000, // Keep connection alive for 30 seconds
        // Never return null: returning null stops reconnects forever and stranding long-lived
        // workers (PM2) with isAvailable=false while the WebSocket still LPUSHes — queue grows,
        // ClickHouse goes stale (see analytics:queue backlog).
        retryStrategy: (times) => Math.min(times * 500, 30_000),
        lazyConnect: false, // Connect immediately, not on first command
        enableReadyCheck: true, // Wait for ready state before marking as connected
      });

      redisClient.on("connect", () => {
        console.log("✅ Redis connected - real-time enabled");
        isAvailable = true;
      });

      redisClient.on("ready", () => {
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
  if (!client) {
    return false;
  }

  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait until ioredis is ready to accept commands. Use before queue reads on startup:
 * `isRedisAvailable()` stays false until the `connect` handler runs, so getQueueDepth()
 * can incorrectly return 0 if called too early.
 */
export function waitForRedisReady(timeoutMs = 30_000): Promise<void> {
  const client = getRedisClient();
  if (!client) {
    return Promise.reject(
      new Error("Redis client not initialized (REDIS_URL missing?)")
    );
  }

  if (client.status === "ready") {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          `Redis not ready after ${timeoutMs}ms (status: ${client.status})`
        )
      );
    }, timeoutMs);

    const onReady = () => {
      clearTimeout(timer);
      cleanup();
      resolve();
    };

    const onError = (err: Error) => {
      clearTimeout(timer);
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      client.removeListener("ready", onReady);
      client.removeListener("error", onError);
    };

    client.once("ready", onReady);
    client.once("error", onError);
  });
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isAvailable = false;
  }
}
