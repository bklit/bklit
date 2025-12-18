import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export function analyticsEnv() {
  return createEnv({
    server: {
      CLICKHOUSE_HOST: z.string().url(),
      CLICKHOUSE_USERNAME: z.string().min(1),
      CLICKHOUSE_PASSWORD: z.string().min(1),
    },
    runtimeEnv: {
      CLICKHOUSE_HOST: process.env.CLICKHOUSE_HOST,
      CLICKHOUSE_USERNAME: process.env.CLICKHOUSE_USERNAME,
      CLICKHOUSE_PASSWORD: process.env.CLICKHOUSE_PASSWORD,
    },
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });
}
