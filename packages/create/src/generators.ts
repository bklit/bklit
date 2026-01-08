import crypto from "node:crypto";

/**
 * Generate secure random secrets
 */

export function generateSecret(length = 32): string {
  return crypto.randomBytes(length).toString("base64url");
}

export function generateSecrets() {
  return {
    AUTH_SECRET: generateSecret(32),
    HEALTH_CHECK_SECRET: generateSecret(16),
    POLAR_WEBHOOK_SECRET: generateSecret(24), // In case they add Polar later
  };
}

export function generateDatabasePassword(): string {
  // Safe for shell/docker-compose
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(crypto.randomBytes(16))
    .map((byte) => chars[byte % chars.length])
    .join("");
}
