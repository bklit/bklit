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
     * BetterAuth - Required
     */
    AUTH_SECRET: z.string().min(32),

    /**
     * BetterAuth - OAuth Providers (OPTIONAL)
     */
    AUTH_GITHUB_ID: z.string().min(1).optional(),
    AUTH_GITHUB_SECRET: z.string().min(1).optional(),
    AUTH_GOOGLE_ID: z.string().min(1).optional(),
    AUTH_GOOGLE_SECRET: z.string().min(1).optional(),

    /**
     * Polar - Billing (OPTIONAL)
     */
    POLAR_SERVER_MODE: z.string().min(1).optional(),
    POLAR_ACCESS_TOKEN: z.string().min(1).optional(),
    POLAR_WEBHOOK_SECRET: z.string().min(1).optional(),

    /**
     * Trigger.dev - Background Jobs (OPTIONAL)
     */
    TRIGGER_SECRET_KEY: z.string().optional(),
    TRIGGER_API_KEY: z.string().optional(),
    TRIGGER_API_URL: z.string().url().optional(),

    /**
     * Email - Resend (OPTIONAL)
     */
    RESEND_API_KEY: z.string().optional(),

    /**
     * API Health Monitoring (OPTIONAL)
     */
    ALERT_EMAIL: z.string().email().optional(),
    HEALTH_CHECK_SECRET: z.string().min(1),
  },

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    /**
     * Mapbox - Maps (OPTIONAL - will fallback to list view)
     */
    NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1).optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  skipValidation:
    !!process.env.CI ||
    process.env.npm_lifecycle_event === "lint" ||
    !!process.env.TRIGGER_BUILD ||
    process.env.NODE_ENV === "test",
});
