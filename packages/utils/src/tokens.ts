import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

/**
 * Generate a new API token with the format: bk_live_<32 random hex chars>
 * Returns the full token and the prefix for display purposes
 */
export function generateToken(): { token: string; prefix: string } {
  const randomPart = randomBytes(32).toString("hex");
  const token = `bk_live_${randomPart}`;
  const prefix = "bk_live_";

  return { token, prefix };
}

/**
 * Hash a token using scrypt with a random salt
 * Returns the hash in the format: "salt:hash"
 */
export async function hashToken(token: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(token, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

/**
 * Verify a token against a stored hash
 * Returns true if the token matches the hash, false otherwise
 */
export async function verifyToken(
  token: string,
  storedHash: string
): Promise<boolean> {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!(salt && hash)) {
      return false;
    }

    const hashBuffer = (await scryptAsync(token, salt, 64)) as Buffer;
    return hashBuffer.toString("hex") === hash;
  } catch {
    return false;
  }
}
