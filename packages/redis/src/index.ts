// Initialize Redis on import (server startup)
import "./init";

export {
  checkRedisHealth,
  closeRedis,
  createRedisClient,
  getRedisClient,
  isRedisAvailable,
  type RedisConfig,
  waitForRedisReady,
} from "./client";
export * from "./debug";
export * from "./live-sessions";
export * from "./pubsub";
export * from "./queue";
export * from "./types";
