import { analyticsEnv } from "@bklit/analytics/env";
import { dbEnv } from "@bklit/db/env";
import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod/v4";

export const env = createEnv({
  extends: [dbEnv(), analyticsEnv(), vercel()],
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

    /**
     * Polar - Billing (OPTIONAL)
     */
    POLAR_SERVER_MODE: z.string().min(1).optional(),
    POLAR_ACCESS_TOKEN: z.string().min(1).optional(),
    POLAR_WEBHOOK_SECRET: z.string().min(1).optional(),
  },

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    /**
     * Bklit Website API Token
     */
    NEXT_PUBLIC_BKLIT_WEBSITE_API_TOKEN: z.string().min(1),
    /**
     * Optional API Host override (for development with ngrok)
     */
    NEXT_PUBLIC_BKLIT_API_HOST: z.string().url().optional(),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_BKLIT_WEBSITE_API_TOKEN:
      process.env.NEXT_PUBLIC_BKLIT_WEBSITE_API_TOKEN,
    NEXT_PUBLIC_BKLIT_API_HOST: process.env.NEXT_PUBLIC_BKLIT_API_HOST,
  },
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
