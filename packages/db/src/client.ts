import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "./generated/prisma/client";

export type * from "./generated/prisma/client";

// Override DATABASE_URL with DEV_DATABASE_URL in development before Prisma initializes
if (process.env.NODE_ENV === "development" && process.env.DEV_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DEV_DATABASE_URL;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.PRISMA_VERBOSE === "true"
        ? ["query", "info", "warn", "error"]
        : ["warn", "error"],
  }).$extends(withAccelerate());

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma as any;
}
