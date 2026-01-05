import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export function analyticsEnv() {
  const isDev = process.env.NODE_ENV === "development";

  return createEnv({
    server: {
      CLICKHOUSE_HOST: z.string().url(),
      CLICKHOUSE_USERNAME: z.string().min(1),
      CLICKHOUSE_PASSWORD: z.string(), // Allow empty string for local Docker
      DEV_CLICKHOUSE_HOST: z.string().url().optional(),
      DEV_CLICKHOUSE_USERNAME: z.string().min(1).optional(),
      DEV_CLICKHOUSE_PASSWORD: z.string().optional(), // Allow empty string for local Docker
    },
    experimental__runtimeEnv: {
      CLICKHOUSE_HOST:
        isDev && process.env.DEV_CLICKHOUSE_HOST
          ? process.env.DEV_CLICKHOUSE_HOST
          : process.env.CLICKHOUSE_HOST,
      CLICKHOUSE_USERNAME:
        isDev && process.env.DEV_CLICKHOUSE_USERNAME
          ? process.env.DEV_CLICKHOUSE_USERNAME
          : process.env.CLICKHOUSE_USERNAME,
      CLICKHOUSE_PASSWORD:
        isDev && process.env.DEV_CLICKHOUSE_PASSWORD
          ? process.env.DEV_CLICKHOUSE_PASSWORD
          : process.env.CLICKHOUSE_PASSWORD,
    },
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });
}
