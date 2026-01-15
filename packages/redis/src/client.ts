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
  fetch('http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:12',message:'createRedisClient called',data:{hasConfigUrl:!!config?.url,hasEnvUrl:!!process.env.REDIS_URL,urlPrefix:url?.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion

  if (!url) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:16',message:'No Redis URL - returning null',data:{hasConfigUrl:!!config?.url,hasEnvUrl:!!process.env.REDIS_URL},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
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
        fetch('http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:38',message:'Redis connect event fired',data:{isAvailable:true},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
      });

      redisClient.on("error", (err) => {
        console.error("❌ Redis error:", err.message);
        isAvailable = false;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:46',message:'Redis error event',data:{errorMessage:err.message,isAvailable:false},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
      });

      redisClient.on("close", () => {
        console.warn("⚠️ Redis closed - falling back to polling");
        isAvailable = false;
      });

      // Connection happens automatically with lazyConnect: false
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:57',message:'Redis client created',data:{isAvailableNow:isAvailable},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      console.error("Failed to initialize Redis:", error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:62',message:'Redis initialization error',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2'})}).catch(()=>{});
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
