import { z } from "zod/v4";

const envSchema = z.object({
  CLICKHOUSE_HOST: z.string().url(),
  CLICKHOUSE_USERNAME: z.string().min(1),
  CLICKHOUSE_PASSWORD: z.string().min(1),
});

let cachedEnv: z.infer<typeof envSchema> | null = null;

export function analyticsEnv() {
  if (cachedEnv) return cachedEnv;

  // Read env vars at runtime, not build time
  const env = {
    CLICKHOUSE_HOST: process.env.CLICKHOUSE_HOST!,
    CLICKHOUSE_USERNAME: process.env.CLICKHOUSE_USERNAME!,
    CLICKHOUSE_PASSWORD: process.env.CLICKHOUSE_PASSWORD!,
  };

  // Validate at runtime (skip during build)
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    cachedEnv = envSchema.parse(env);
  } else {
    cachedEnv = env as z.infer<typeof envSchema>;
  }

  return cachedEnv;
}
