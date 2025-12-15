import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export function dbEnv() {
  const isDev = process.env.NODE_ENV === "development";
  
  return createEnv({
    server: {
      DATABASE_URL: z.string().min(1),
      DEV_DATABASE_URL: z.string().min(1).optional(),
    },
    experimental__runtimeEnv: {
      DATABASE_URL: isDev && process.env.DEV_DATABASE_URL 
        ? process.env.DEV_DATABASE_URL 
        : process.env.DATABASE_URL,
    },
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });
}
