import { createRedisClient } from "./client";

// Initialize Redis client eagerly on server startup
if (process.env.REDIS_URL) {
  createRedisClient();
}

// Export a dummy to ensure this file is imported
export const redisInitialized = true;
