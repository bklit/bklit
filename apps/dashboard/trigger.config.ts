import type { TriggerConfig } from "@trigger.dev/sdk/v3";

export const config: TriggerConfig = {
  project: "proj_oeyxdyreaapbclbrvgnc",
  logLevel: "log",
  maxDuration: 300, // 5 minutes in seconds
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
    },
  },
  dirs: ["./trigger"],
  // Environment detection - will use "development" or "production" based on NODE_ENV
  // In production deployments, Trigger.dev will automatically use the production environment
};
