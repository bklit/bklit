// packages/bklit-sdk/src/config.ts

export interface BklitConfig {
  apiHost: string;
  environment: "development" | "production";
  debug: boolean;
}

// Get dashboard URL from environment and construct API endpoint
const getDefaultApiHost = (env: "development" | "production"): string => {
  // Get dashboard URL from NEXT_PUBLIC_APP_URL
  const dashboardUrl =
    typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_URL;

  if (dashboardUrl) {
    // Remove trailing slash and append /api/track
    return `${dashboardUrl.replace(/\/$/, "")}/api/track`;
  }

  // No dashboard URL configured
  if (env === "production") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL environment variable is required for production builds.",
    );
  }

  // Development fallback
  console.warn(
    "NEXT_PUBLIC_APP_URL not set, using default: http://localhost:3000/api/track",
  );
  return "http://localhost:3000/api/track";
};

/**
 * Get default configuration based on environment
 */
export function getDefaultConfig(environment?: string): BklitConfig {
  const env = environment || "production";

  // Get API host from dashboard URL
  const apiHost = getDefaultApiHost(env as "development" | "production");

  // Debug mode enabled in development
  const debug = env === "development";

  return {
    apiHost,
    environment: env as "development" | "production",
    debug,
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: Partial<BklitConfig>): void {
  if (config.apiHost && !isValidUrl(config.apiHost)) {
    throw new Error(`Invalid API host URL: ${config.apiHost}`);
  }

  if (
    config.environment &&
    !["development", "production"].includes(config.environment)
  ) {
    throw new Error(
      `Invalid environment: ${config.environment}. Must be one of: development, production`,
    );
  }
}

/**
 * Simple URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get configuration for build-time environment variables
 */
export function getBuildTimeConfig(): BklitConfig {
  return getDefaultConfig();
}
