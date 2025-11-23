-- Add allowedDomains array column to api_token table
ALTER TABLE "api_token" ADD COLUMN IF NOT EXISTS "allowedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[];

