import { dbEnv } from "@bklit/db/env";
import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod/v4";

export const env = createEnv({
  extends: [dbEnv(), vercel()],
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
    /**
     * BetterAuth
     */
    AUTH_GITHUB_ID: z.string().min(1),
    AUTH_GITHUB_SECRET: z.string().min(1),
    AUTH_GOOGLE_ID: z.string().min(1).optional(),
    AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
    AUTH_SECRET: z.string().min(1),

    /**
     * Polar
     */
    POLAR_SERVER_MODE: z.string().min(1),
    POLAR_ACCESS_TOKEN: z.string().min(1),
    POLAR_WEBHOOK_SECRET: z.string().min(1),

    /**
     * Trigger.dev
     */
    TRIGGER_SECRET_KEY: z.string().optional(),
    TRIGGER_API_KEY: z.string().optional(),
    TRIGGER_API_URL: z.string().url().optional(),

    /**
     * API Health Monitoring
     */
    ALERT_EMAIL: z.string().email().min(1),
    HEALTH_CHECK_SECRET: z.string().min(1),
  },

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
  skipValidation:
    !!process.env.CI ||
    process.env.npm_lifecycle_event === "lint" ||
    !!process.env.TRIGGER_BUILD ||
    process.env.NODE_ENV === "test" ||
    // Skip validation during Trigger.dev task indexing/build phase
    // Check if required env vars are missing (they won't be available during indexing)
    !process.env.AUTH_GITHUB_ID ||
    !process.env.AUTH_SECRET ||
    !process.env.POLAR_SERVER_MODE,
});
