-- CreateIndex
CREATE UNIQUE INDEX "api_health_check_endpoint_timestamp_key" ON "api_health_check"("endpoint", "timestamp");

