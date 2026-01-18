// packages/bklit-sdk/src/config.ts

export interface BklitConfig {
  wsHost: string;
  environment: "development" | "production";
  debug: boolean;
}

/**
 * Get default WebSocket host based on environment
 */
const getDefaultWsHost = (env: "development" | "production"): string => {
  // Production: Use WebSocket server on bklit.ws
  if (env === "production") {
    return "wss://bklit.ws:8080";
  }

  // Development: Use local WebSocket server
  return "ws://localhost:8080";
};

/**
 * Get default configuration based on environment
 */
export function getDefaultConfig(environment?: string): BklitConfig {
  const env = environment || "production";

  // Get WebSocket host
  const wsHost = getDefaultWsHost(env as "development" | "production");

  // Debug mode enabled in development
  const debug = env === "development";

  return {
    wsHost,
    environment: env as "development" | "production",
    debug,
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: Partial<BklitConfig>): void {
  if (config.wsHost && !isValidWsUrl(config.wsHost)) {
    throw new Error(`Invalid WebSocket host URL: ${config.wsHost}`);
  }

  if (
    config.environment &&
    !["development", "production"].includes(config.environment)
  ) {
    throw new Error(
      `Invalid environment: ${config.environment}. Must be one of: development, production`
    );
  }
}

/**
 * Simple WebSocket URL validation
 */
function isValidWsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "ws:" || parsed.protocol === "wss:";
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
