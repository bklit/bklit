import { prisma } from "@bklit/db/client";
import { verifyToken } from "@bklit/utils/tokens";

interface TokenValidationResult {
  valid: boolean;
  error?: string;
  tokenId?: string;
  organizationId?: string;
}

/**
 * Validates an API token and checks if it's assigned to the given project
 * @param token - The raw token string (e.g., "bk_live_abc123...")
 * @param projectId - The project ID to check token assignment for
 * @returns Validation result with success status and optional error message
 */
export async function validateApiToken(
  token: string,
  projectId: string,
): Promise<TokenValidationResult> {
  try {
    if (!token) {
      return {
        valid: false,
        error: "Token is required",
      };
    }

    // Find token by trying to match against stored hashes
    // Since we can't query by the plain token, we need to fetch all tokens
    // and verify each one (this is acceptable for now, but could be optimized
    // by storing a prefix lookup or using a different approach)
    const tokens = await prisma.apiToken.findMany({
      where: {
        tokenPrefix: token.substring(0, 8), // Use prefix to narrow search
      },
      include: {
        projects: true,
      },
    });

    if (tokens.length === 0) {
      return {
        valid: false,
        error: "Invalid token",
      };
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
      (tp) => tp.projectId === projectId,
    );

    if (!isAssignedToProject) {
      return {
        valid: false,
        error: "Token is not authorized for this project",
      };
    }

    // Update lastUsedAt
    await prisma.apiToken.update({
      where: { id: matchedToken.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      valid: true,
      tokenId: matchedToken.id,
      organizationId: matchedToken.organizationId,
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
  authHeader: string | null,
): string | null {
  if (!authHeader) {
    return null;
  }

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7).trim();
}
