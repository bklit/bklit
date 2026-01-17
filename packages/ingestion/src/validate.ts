import { scrypt } from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "@bklit/db/client";

const scryptAsync = promisify(scrypt);

async function verifyToken(token: string, hash: string): Promise<boolean> {
  const [salt, storedHash] = hash.split(":");
  if (!(salt && storedHash)) return false;

  const derivedHash = await scryptAsync(token, salt, 64);
  return (derivedHash as Buffer).toString("hex") === storedHash;
}

const tokenCache = new Map<
  string,
  {
    valid: boolean;
    organizationId: string;
    allowedDomains: string[] | null;
    expiresAt: number;
  }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function validateApiToken(
  token: string,
  projectId: string
): Promise<{
  valid: boolean;
  organizationId?: string;
  allowedDomains?: string[] | null;
}> {
  const cacheKey = `${token}:${projectId}`;
  const cached = tokenCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return {
      valid: cached.valid,
      organizationId: cached.organizationId,
      allowedDomains: cached.allowedDomains,
    };
  }

  try {
    // Use tokenPrefix to narrow search
    const tokenPrefix = token.substring(0, 8);
    const tokens = await prisma.apiToken.findMany({
      where: { tokenPrefix },
      include: { projects: true },
    });

    if (tokens.length === 0) {
      return { valid: false };
    }

    // Find matching token by verifying hash
    let matchedToken = null;
    for (const apiToken of tokens) {
      const isValid = await verifyToken(token, apiToken.tokenHash);
      if (isValid) {
        matchedToken = apiToken;
        break;
      }
    }

    if (!matchedToken) {
      return { valid: false };
    }

    // Check if token has expired
    if (matchedToken.expiresAt && matchedToken.expiresAt < new Date()) {
      return { valid: false };
    }

    // Check if token is assigned to the project
    const isAssignedToProject = matchedToken.projects.some(
      (tp) => tp.projectId === projectId
    );

    if (!isAssignedToProject) {
      return { valid: false };
    }

    // Cache the result
    tokenCache.set(cacheKey, {
      valid: true,
      organizationId: matchedToken.organizationId,
      allowedDomains: matchedToken.allowedDomains,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return {
      valid: true,
      organizationId: matchedToken.organizationId,
      allowedDomains: matchedToken.allowedDomains,
    };
  } catch (error) {
    console.error("Token validation error:", error);
    return { valid: false };
  }
}
