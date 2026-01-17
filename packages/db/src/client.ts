import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "./generated/prisma/client";

export type * from "./generated/prisma/client";

// Override DATABASE_URL with DEV_DATABASE_URL in development before Prisma initializes
const isDevelopment = process.env.NODE_ENV === "development";
if (isDevelopment && process.env.DEV_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DEV_DATABASE_URL;
  console.log(
    "[Prisma Client] Using DEV database:",
    process.env.DATABASE_URL.substring(0, 40)
  );
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const baseClient = new PrismaClient({
  log:
    process.env.PRISMA_VERBOSE === "true"
      ? ["query", "info", "warn", "error"]
      : ["warn", "error"],
});

// In development, NEVER use Accelerate extension (even if DEV_DATABASE_URL has prisma+postgres prefix for local proxy)
// In production, use Accelerate if DATABASE_URL starts with prisma+postgres
const shouldUseAccelerate =
  !isDevelopment && process.env.DATABASE_URL?.startsWith("prisma+postgres");

console.log("[Prisma Client] Config:", {
  isDevelopment,
  shouldUseAccelerate,
  urlPrefix: process.env.DATABASE_URL?.substring(0, 30),
});

export const prisma =
  globalForPrisma.prisma ||
  (shouldUseAccelerate ? baseClient.$extends(withAccelerate()) : baseClient);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma as any;
}
