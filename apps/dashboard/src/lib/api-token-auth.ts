import { prisma } from "@bklit/db/client";
import { createTokenLookup, verifyToken } from "@bklit/utils/tokens";

interface TokenValidationResult {
  valid: boolean;
  error?: string;
  tokenId?: string;
  organizationId?: string;
  allowedDomains?: string[];
}

/**
 * Validates an API token and checks if it's assigned to the given project
 * Uses SHA256 fast-lookup hash for O(1) database queries (no expensive scrypt!)
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

    // Create SHA256 lookup hash - this is O(1) and fast
    const tokenLookup = createTokenLookup(token);

    // Try fast path: direct lookup by tokenLookup (new tokens)
    let matchedToken = await prisma.apiToken.findUnique({
      where: { tokenLookup },
      include: { projects: true },
    });

    // Fallback for legacy tokens without tokenLookup: use slower scrypt verification
    if (!matchedToken) {
      const tokenPrefix = token.substring(0, 8);
      const tokens = await prisma.apiToken.findMany({
        where: { tokenPrefix },
        include: { projects: true },
      });

      for (const apiToken of tokens) {
        const isValid = await verifyToken(token, apiToken.tokenHash);
        if (isValid) {
          matchedToken = apiToken;
          // Migrate this token to fast lookup (one-time)
          prisma.apiToken
            .update({
              where: { id: apiToken.id },
              data: { tokenLookup },
            })
            .catch((err) =>
              console.error("Failed to migrate token to fast lookup:", err)
            );
          break;
        }
      }
    }

    if (!matchedToken) {
      return {
        valid: false,
        error: "Invalid token",
      };
    }

    // Check if token has expired
    if (matchedToken.expiresAt && matchedToken.expiresAt < new Date()) {
      return {
        valid: false,
        error: "Token has expired",
      };
    }

    // Check if token is assigned to the project
    const isAssignedToProject = matchedToken.projects.some(
      (tp) => tp.projectId === projectId
    );

    if (!isAssignedToProject) {
      return {
        valid: false,
        error: `Token is not authorized for project ${projectId}`,
      };
    }

    // Update lastUsedAt asynchronously (don't block the response)
    prisma.apiToken
      .update({
        where: { id: matchedToken.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err) => console.error("Failed to update lastUsedAt:", err));

    return {
      valid: true,
      tokenId: matchedToken.id,
      organizationId: matchedToken.organizationId,
      allowedDomains: matchedToken.allowedDomains,
    };
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
