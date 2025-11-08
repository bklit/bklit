import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export function authEnv() {
  return createEnv({
    server: {
      AUTH_GITHUB_ID: z.string().min(1),
      AUTH_GITHUB_SECRET: z.string().min(1),
      AUTH_SECRET:
        process.env.NODE_ENV === "production"
          ? z.string().min(1)
          : z.string().min(1).optional(),

      POLAR_ACCESS_TOKEN: z.string().min(1),
      POLAR_SERVER_MODE: z
        .enum(["sandbox", "production"])
        .optional()
        .default("sandbox"),
      POLAR_WEBHOOK_SECRET: z.string().min(1),
      POLAR_ORGANIZATION_ID: z.string().min(1),
      POLAR_FREE_PRODUCT_ID: z.string().optional(), // Optional - Free plan may not exist in Polar
      POLAR_PRO_PRODUCT_ID: z.string().min(1),

      BKLIT_DEFAULT_PROJECT: z.string().optional(), // Optional - Auto-invite new users to the organization of this project

      NODE_ENV: z.enum(["development", "production", "test"]).optional(),
    },
    experimental__runtimeEnv: {},
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });
}
