-- CreateTable
CREATE TABLE "funnel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "funnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funnel_step" (
    "id" TEXT NOT NULL,
    "funnelId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "eventName" TEXT,
    "eventCode" TEXT,
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnel_step_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "funnel_projectId_idx" ON "funnel"("projectId");

-- CreateIndex
CREATE INDEX "funnel_createdAt_idx" ON "funnel"("createdAt");

-- CreateIndex
CREATE INDEX "funnel_step_funnelId_idx" ON "funnel_step"("funnelId");

-- CreateIndex
CREATE INDEX "funnel_step_funnelId_stepOrder_idx" ON "funnel_step"("funnelId", "stepOrder");

-- AddForeignKey
ALTER TABLE "funnel" ADD CONSTRAINT "funnel_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funnel_step" ADD CONSTRAINT "funnel_step_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "funnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

