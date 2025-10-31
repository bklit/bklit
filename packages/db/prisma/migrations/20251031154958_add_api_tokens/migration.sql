-- CreateTable
CREATE TABLE "api_token" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tokenHash" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "api_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_token_project" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "api_token_project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_token_tokenHash_key" ON "api_token"("tokenHash");

-- CreateIndex
CREATE INDEX "api_token_tokenHash_idx" ON "api_token"("tokenHash");

-- CreateIndex
CREATE INDEX "api_token_organizationId_idx" ON "api_token"("organizationId");

-- CreateIndex
CREATE INDEX "api_token_project_tokenId_idx" ON "api_token_project"("tokenId");

-- CreateIndex
CREATE INDEX "api_token_project_projectId_idx" ON "api_token_project"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "api_token_project_tokenId_projectId_key" ON "api_token_project"("tokenId", "projectId");

-- AddForeignKey
ALTER TABLE "api_token" ADD CONSTRAINT "api_token_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_token_project" ADD CONSTRAINT "api_token_project_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "api_token"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_token_project" ADD CONSTRAINT "api_token_project_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
