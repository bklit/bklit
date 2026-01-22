import { prisma } from "@bklit/db/client";
import { verifyToken } from "@bklit/utils/tokens";

interface TokenValidationResult {
  valid: boolean;
  error?: string;
  tokenId?: string;
  organizationId?: string;
  allowedDomains?: string[];
}

// In-memory cache for validated tokens (5 minute TTL)
// Key: "token:projectId", Value: { result, expiresAt }
const tokenCache = new Map<
  string,
  { result: TokenValidationResult; expiresAt: number }
>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Validates an API token and checks if it's assigned to the given project
 * Uses in-memory caching to avoid expensive scrypt verification on every request
 * @param token - The raw token string (e.g., "bk_live_abc123...")
 * @param projectId - The project ID to check token assignment for
 * @returns Validation result with success status and optional error message
 */
export async function validateApiToken(
  token: string,
  projectId: string
): Promise<TokenValidationResult> {
  try {
    if (!token) {
      return {
        valid: false,
        error: "Token is required",
      };
    }

    // Check cache first (avoids expensive scrypt on every request)
    const cacheKey = `${token}:${projectId}`;
    const cached = tokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    // Find token by trying to match against stored hashes
    const tokenPrefix = token.substring(0, 8);
    const tokens = await prisma.apiToken.findMany({
      where: {
        tokenPrefix,
      },
      include: {
        projects: true,
      },
    });

    if (tokens.length === 0) {
      const result = {
        valid: false,
        error: "Invalid token: No token found with this prefix",
      };
      // Cache negative results for shorter time (1 minute)
      tokenCache.set(cacheKey, { result, expiresAt: Date.now() + 60_000 });
      return result;
    }

    // Try to find matching token by verifying hash
    let matchedToken = null;
    for (const apiToken of tokens) {
      const isValid = await verifyToken(token, apiToken.tokenHash);
      if (isValid) {
        matchedToken = apiToken;
        break;
      }
    }

    if (!matchedToken) {
      const result = {
        valid: false,
        error: "Invalid token: Token hash does not match",
      };
      tokenCache.set(cacheKey, { result, expiresAt: Date.now() + 60_000 });
      return result;
    }

    // Check if token has expired
    if (matchedToken.expiresAt && matchedToken.expiresAt < new Date()) {
      const result = {
        valid: false,
        error: "Token has expired",
      };
      tokenCache.set(cacheKey, { result, expiresAt: Date.now() + 60_000 });
      return result;
    }

    // Check if token is assigned to the project
    const isAssignedToProject = matchedToken.projects.some(
      (tp) => tp.projectId === projectId
    );

    if (!isAssignedToProject) {
      const result = {
        valid: false,
        error: `Token is not authorized for project ${projectId}. Token is assigned to: ${matchedToken.projects.map((p) => p.projectId).join(", ") || "no projects"}`,
      };
      tokenCache.set(cacheKey, { result, expiresAt: Date.now() + 60_000 });
      return result;
    }

    // Update lastUsedAt asynchronously (don't block the response)
    prisma.apiToken
      .update({
        where: { id: matchedToken.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err) => console.error("Failed to update lastUsedAt:", err));

    const result: TokenValidationResult = {
      valid: true,
      tokenId: matchedToken.id,
      organizationId: matchedToken.organizationId,
      allowedDomains: matchedToken.allowedDomains,
    };

    // Cache successful validation
    tokenCache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });

    return result;
  } catch (error) {
    console.error("Error validating API token:", error);
    return {
      valid: false,
      error: "Token validation failed",
    };
  }
}

/**
 * Extracts token from Authorization header
 * @param authHeader - The Authorization header value (e.g., "Bearer bk_live_abc123...")
 * @returns The token string or null if invalid format
 */
export function extractTokenFromHeader(
  authHeader: string | null
): string | null {
  if (!authHeader) {
    return null;
  }

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7).trim();
}
