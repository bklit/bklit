-- This migration resolves drift by creating tables/columns that already exist in the database
-- These changes were applied directly to the database but weren't tracked in migrations

-- Create notification_preference table if it doesn't exist
CREATE TABLE IF NOT EXISTS "notification_preference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "liveVisitorToasts" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preference_pkey" PRIMARY KEY ("id")
);

-- Add indexes to notification_preference if they don't exist
CREATE INDEX IF NOT EXISTS "notification_preference_userId_idx" ON "notification_preference"("userId");
CREATE INDEX IF NOT EXISTS "notification_preference_projectId_idx" ON "notification_preference"("projectId");
CREATE UNIQUE INDEX IF NOT EXISTS "notification_preference_userId_projectId_key" ON "notification_preference"("userId", "projectId");

-- Add columns to PageViewEvent if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PageViewEvent' AND column_name='referrer') THEN
        ALTER TABLE "PageViewEvent" ADD COLUMN "referrer" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PageViewEvent' AND column_name='utmSource') THEN
        ALTER TABLE "PageViewEvent" ADD COLUMN "utmSource" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PageViewEvent' AND column_name='utmMedium') THEN
        ALTER TABLE "PageViewEvent" ADD COLUMN "utmMedium" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PageViewEvent' AND column_name='utmCampaign') THEN
        ALTER TABLE "PageViewEvent" ADD COLUMN "utmCampaign" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PageViewEvent' AND column_name='utmTerm') THEN
        ALTER TABLE "PageViewEvent" ADD COLUMN "utmTerm" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PageViewEvent' AND column_name='utmContent') THEN
        ALTER TABLE "PageViewEvent" ADD COLUMN "utmContent" TEXT;
    END IF;
END $$;

-- Add indexes to PageViewEvent if they don't exist
CREATE INDEX IF NOT EXISTS "PageViewEvent_referrer_idx" ON "PageViewEvent"("referrer");
CREATE INDEX IF NOT EXISTS "PageViewEvent_utmSource_idx" ON "PageViewEvent"("utmSource");

-- Add columns to organization if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organization' AND column_name='plan') THEN
        ALTER TABLE "organization" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organization' AND column_name='theme') THEN
        ALTER TABLE "organization" ADD COLUMN "theme" TEXT;
    END IF;
END $$;

-- Add index to organization if it doesn't exist
CREATE INDEX IF NOT EXISTS "organization_plan_idx" ON "organization"("plan");

