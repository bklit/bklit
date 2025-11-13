-- CreateTable
CREATE TABLE "api_health_check" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "isHealthy" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_health_check_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "api_health_check_endpoint_idx" ON "api_health_check"("endpoint");

-- CreateIndex
CREATE INDEX "api_health_check_timestamp_idx" ON "api_health_check"("timestamp");

-- CreateIndex
CREATE INDEX "api_health_check_isHealthy_idx" ON "api_health_check"("isHealthy");

-- CreateIndex
CREATE INDEX "api_health_check_endpoint_timestamp_idx" ON "api_health_check"("endpoint", "timestamp");

