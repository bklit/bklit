import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export function emailEnv() {
  return createEnv({
    server: {
      RESEND_API_KEY: z.string().min(1).optional(),
    },
    experimental__runtimeEnv: {},
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });
}
