-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "activeOrganizationId" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT,
    "theme" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "inviterId" TEXT NOT NULL,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageViewEvent" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "city" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "ip" TEXT,
    "isp" TEXT,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "mobile" BOOLEAN,
    "region" TEXT,
    "regionName" TEXT,
    "timezone" TEXT,
    "zip" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "projectId" TEXT NOT NULL,
    "referrer" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmMedium" TEXT,
    "utmSource" TEXT,
    "utmTerm" TEXT,

    CONSTRAINT "PageViewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trackingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "EventDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackedEvent" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventDefinitionId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sessionId" TEXT,

    CONSTRAINT "TrackedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackedSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "didBounce" BOOLEAN NOT NULL DEFAULT false,
    "visitorId" TEXT,
    "entryPage" TEXT NOT NULL,
    "exitPage" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "TrackedSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "liveVisitorToasts" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preference_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE INDEX "organization_plan_idx" ON "organization"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "Project_domain_key" ON "Project"("domain");

-- CreateIndex
CREATE INDEX "Project_organizationId_idx" ON "Project"("organizationId");

-- CreateIndex
CREATE INDEX "PageViewEvent_projectId_timestamp_idx" ON "PageViewEvent"("projectId", "timestamp");

-- CreateIndex
CREATE INDEX "PageViewEvent_createdAt_idx" ON "PageViewEvent"("createdAt");

-- CreateIndex
CREATE INDEX "PageViewEvent_country_idx" ON "PageViewEvent"("country");

-- CreateIndex
CREATE INDEX "PageViewEvent_city_idx" ON "PageViewEvent"("city");

-- CreateIndex
CREATE INDEX "PageViewEvent_sessionId_idx" ON "PageViewEvent"("sessionId");

-- CreateIndex
CREATE INDEX "PageViewEvent_referrer_idx" ON "PageViewEvent"("referrer");

-- CreateIndex
CREATE INDEX "PageViewEvent_utmSource_idx" ON "PageViewEvent"("utmSource");

-- CreateIndex
CREATE INDEX "EventDefinition_projectId_idx" ON "EventDefinition"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "EventDefinition_projectId_trackingId_key" ON "EventDefinition"("projectId", "trackingId");

-- CreateIndex
CREATE UNIQUE INDEX "EventDefinition_projectId_name_key" ON "EventDefinition"("projectId", "name");

-- CreateIndex
CREATE INDEX "TrackedEvent_eventDefinitionId_idx" ON "TrackedEvent"("eventDefinitionId");

-- CreateIndex
CREATE INDEX "TrackedEvent_projectId_timestamp_idx" ON "TrackedEvent"("projectId", "timestamp");

-- CreateIndex
CREATE INDEX "TrackedEvent_projectId_createdAt_idx" ON "TrackedEvent"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "TrackedEvent_sessionId_idx" ON "TrackedEvent"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedSession_sessionId_key" ON "TrackedSession"("sessionId");

-- CreateIndex
CREATE INDEX "TrackedSession_projectId_startedAt_idx" ON "TrackedSession"("projectId", "startedAt");

-- CreateIndex
CREATE INDEX "TrackedSession_projectId_didBounce_idx" ON "TrackedSession"("projectId", "didBounce");

-- CreateIndex
CREATE INDEX "TrackedSession_visitorId_idx" ON "TrackedSession"("visitorId");

-- CreateIndex
CREATE INDEX "notification_preference_userId_idx" ON "notification_preference"("userId");

-- CreateIndex
CREATE INDEX "notification_preference_projectId_idx" ON "notification_preference"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preference_userId_projectId_key" ON "notification_preference"("userId", "projectId");

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

-- CreateIndex
CREATE INDEX "api_health_check_endpoint_idx" ON "api_health_check"("endpoint");

-- CreateIndex
CREATE INDEX "api_health_check_timestamp_idx" ON "api_health_check"("timestamp");

-- CreateIndex
CREATE INDEX "api_health_check_isHealthy_idx" ON "api_health_check"("isHealthy");

-- CreateIndex
CREATE INDEX "api_health_check_endpoint_timestamp_idx" ON "api_health_check"("endpoint", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "api_health_check_endpoint_timestamp_key" ON "api_health_check"("endpoint", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "api_health_alert_state_endpoint_key" ON "api_health_alert_state"("endpoint");

-- CreateIndex
CREATE INDEX "api_health_alert_state_endpoint_idx" ON "api_health_alert_state"("endpoint");

-- CreateIndex
CREATE INDEX "api_health_alert_state_isInAlertState_idx" ON "api_health_alert_state"("isInAlertState");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageViewEvent" ADD CONSTRAINT "PageViewEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageViewEvent" ADD CONSTRAINT "PageViewEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrackedSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDefinition" ADD CONSTRAINT "EventDefinition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedEvent" ADD CONSTRAINT "TrackedEvent_eventDefinitionId_fkey" FOREIGN KEY ("eventDefinitionId") REFERENCES "EventDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedEvent" ADD CONSTRAINT "TrackedEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedEvent" ADD CONSTRAINT "TrackedEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrackedSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedSession" ADD CONSTRAINT "TrackedSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_token" ADD CONSTRAINT "api_token_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_token_project" ADD CONSTRAINT "api_token_project_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "api_token"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_token_project" ADD CONSTRAINT "api_token_project_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

