-- CreateTable
CREATE TABLE "api_health_alert_state" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "isInAlertState" BOOLEAN NOT NULL DEFAULT false,
    "lastAlertSentAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_health_alert_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_health_alert_state_endpoint_key" ON "api_health_alert_state"("endpoint");

-- CreateIndex
CREATE INDEX "api_health_alert_state_endpoint_idx" ON "api_health_alert_state"("endpoint");

-- CreateIndex
CREATE INDEX "api_health_alert_state_isInAlertState_idx" ON "api_health_alert_state"("isInAlertState");

