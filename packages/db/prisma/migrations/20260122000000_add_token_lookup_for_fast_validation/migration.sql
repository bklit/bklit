-- AlterTable
ALTER TABLE "api_token" ADD COLUMN "tokenLookup" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "api_token_tokenLookup_key" ON "api_token"("tokenLookup");

-- CreateIndex
CREATE INDEX "api_token_tokenLookup_idx" ON "api_token"("tokenLookup");
