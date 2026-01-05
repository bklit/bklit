import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export function authEnv() {
  const isDev = process.env.NODE_ENV === "development";

  return createEnv({
    server: {
      // Required - must be at least 32 characters
      AUTH_SECRET: z.string().min(32),

      // OAuth providers - OPTIONAL
      AUTH_GITHUB_ID: z.string().min(1).optional(),
      AUTH_GITHUB_SECRET: z.string().min(1).optional(),
      AUTH_GOOGLE_ID: z.string().min(1).optional(),
      AUTH_GOOGLE_SECRET: z.string().min(1).optional(),

      // Polar billing - OPTIONAL (but if set, webhook secret and org ID are required)
      POLAR_ACCESS_TOKEN: z.string().min(1).optional(),
      POLAR_SERVER_MODE: z
        .enum(["sandbox", "production"])
        .optional()
        .default("sandbox"),
      POLAR_WEBHOOK_SECRET: z.string().min(1).optional(),
      POLAR_ORGANIZATION_ID: z.string().min(1).optional(),
      POLAR_METER_ID_EVENTS: z.string().optional(),

      // Email - OPTIONAL (will use console logs in dev)
      RESEND_API_KEY: z.string().min(1).optional(),

      BKLIT_DEFAULT_PROJECT: z.string().optional(), // Optional - Auto-invite new users to the organization of this project
      DEV_BKLIT_DEFAULT_PROJECT: z.string().optional(), // Optional - Local dev demo project

      NODE_ENV: z.enum(["development", "production", "test"]).optional(),
    },
    experimental__runtimeEnv: {
      // Use DEV_BKLIT_DEFAULT_PROJECT in development
      BKLIT_DEFAULT_PROJECT:
        isDev && process.env.DEV_BKLIT_DEFAULT_PROJECT
          ? process.env.DEV_BKLIT_DEFAULT_PROJECT
          : process.env.BKLIT_DEFAULT_PROJECT,
    },
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });
}
