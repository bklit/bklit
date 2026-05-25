import Redis from "ioredis";

let redisClient: Redis | null = null;
let healthCheckInterval: ReturnType<typeof setInterval> | null = null;

export interface RedisConfig {
  url?: string;
  maxRetries?: number;
}

function syncAvailabilityFromStatus(): boolean {
  return redisClient?.status === "ready";
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
        enableOfflineQueue: false,
        connectTimeout: 10_000,
        keepAlive: 30_000,
        retryStrategy: (times) => Math.min(times * 500, 30_000),
        lazyConnect: false,
        enableReadyCheck: true,
        ...(url.startsWith("rediss://") ? { tls: {} } : {}),
      });

      redisClient.on("connect", () => {
        console.log("✅ Redis connected");
      });

      redisClient.on("ready", () => {
        console.log("✅ Redis ready");
      });

      redisClient.on("reconnecting", () => {
        console.warn("⚠️ Redis reconnecting...");
      });

      redisClient.on("error", (err) => {
        console.error("❌ Redis error:", err.message);
      });

      redisClient.on("close", () => {
        console.warn("⚠️ Redis connection closed — reconnecting");
      });

      if (!healthCheckInterval && process.env.NODE_ENV !== "test") {
        healthCheckInterval = setInterval(async () => {
          const client = redisClient;
          if (!client || client.status !== "ready") {
            return;
          }

          try {
            await client.ping();
          } catch (error) {
            console.error(
              "❌ Redis health ping failed:",
              error instanceof Error ? error.message : error
            );
          }
        }, 60_000);
        healthCheckInterval.unref?.();
      }
    } catch (error) {
      console.error("Failed to initialize Redis:", error);
      return null;
    }
  }

  return redisClient;
}

export function getRedisClient(): Redis | null {
  if (!redisClient && process.env.REDIS_URL) {
    return createRedisClient();
  }

  if (!redisClient) {
    return createRedisClient();
  }
  return redisClient;
}

export function isRedisAvailable(): boolean {
  return syncAvailabilityFromStatus();
}

export async function checkRedisHealth(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  if (client.status !== "ready") {
    return false;
  }

  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

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
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }

  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
