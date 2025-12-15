import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export function authEnv() {
  const isDev = process.env.NODE_ENV === "development";
  
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
      DEV_BKLIT_DEFAULT_PROJECT: z.string().optional(), // Optional - Local dev demo project

      NODE_ENV: z.enum(["development", "production", "test"]).optional(),
    },
    experimental__runtimeEnv: {
      // Use DEV_BKLIT_DEFAULT_PROJECT in development
      BKLIT_DEFAULT_PROJECT: isDev && process.env.DEV_BKLIT_DEFAULT_PROJECT
        ? process.env.DEV_BKLIT_DEFAULT_PROJECT
        : process.env.BKLIT_DEFAULT_PROJECT,
    },
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });
}
