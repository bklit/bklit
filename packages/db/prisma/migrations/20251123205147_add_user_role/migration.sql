-- Remove drift columns from organization
ALTER TABLE "organization" DROP COLUMN IF EXISTS "prismaAccessToken";
ALTER TABLE "organization" DROP COLUMN IF EXISTS "prismaRefreshToken";
ALTER TABLE "organization" DROP COLUMN IF EXISTS "prismaTokenExpiresAt";

-- Add role to user
ALTER TABLE "user" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';

