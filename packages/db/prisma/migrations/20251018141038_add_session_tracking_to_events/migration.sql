-- AlterTable
ALTER TABLE "public"."TrackedEvent" ADD COLUMN     "sessionId" TEXT;

-- CreateIndex
CREATE INDEX "TrackedEvent_sessionId_idx" ON "public"."TrackedEvent"("sessionId");

-- AddForeignKey
ALTER TABLE "public"."TrackedEvent" ADD CONSTRAINT "TrackedEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."TrackedSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
