---
title: Environment Variables Analysis
description: Analysis of environment variable usage across the Bklit monorepo
---

# Environment Variables Analysis

This document summarizes the analysis of all environment variables across the Bklit monorepo.

## Summary

All environment variables are actively used in the codebase. No unused variables were identified.

## Variable Usage Details

### Dashboard App (`apps/dashboard/src/env.ts`)
- ✅ `AUTH_GITHUB_ID` - Used in auth server setup
- ✅ `AUTH_GITHUB_SECRET` - Used in auth server setup
- ✅ `AUTH_GOOGLE_ID` - Optional, used in auth server setup
- ✅ `AUTH_GOOGLE_SECRET` - Optional, used in auth server setup
- ✅ `AUTH_SECRET` - Used for Better Auth session encryption
- ✅ `POLAR_SERVER_MODE` - Used for Polar client configuration
- ✅ `POLAR_ACCESS_TOKEN` - Used for Polar API access
- ✅ `POLAR_WEBHOOK_SECRET` - Used for Polar webhook verification
- ✅ `TRIGGER_SECRET_KEY` - Optional, used for Trigger.dev cloud execution
- ✅ `TRIGGER_API_KEY` - Optional, used for Trigger.dev API access
- ✅ `TRIGGER_API_URL` - Optional, used for Trigger.dev API endpoint
- ✅ `ALERT_EMAIL` - Used for health check email alerts
- ✅ `HEALTH_CHECK_SECRET` - Used for health check endpoint authentication
- ✅ `NEXT_PUBLIC_MAPBOX_TOKEN` - Used in live map component

### Website App (`apps/website/src/env.ts`)
- ✅ `AUTH_GITHUB_ID` - Used in auth server setup
- ✅ `AUTH_GITHUB_SECRET` - Used in auth server setup
- ✅ `AUTH_SECRET` - Used for Better Auth session encryption
- ✅ `POLAR_SERVER_MODE` - Used for Polar client configuration
- ✅ `POLAR_ACCESS_TOKEN` - Used for Polar API access
- ✅ `POLAR_WEBHOOK_SECRET` - Used for Polar webhook verification
- ✅ `NEXT_PUBLIC_BKLIT_WEBSITE_API_TOKEN` - Used for website tracking
- ✅ `NEXT_PUBLIC_BKLIT_API_HOST` - Optional, used to override API host

### Auth Package (`packages/auth/env.ts`)
- ✅ `POLAR_ORGANIZATION_ID` - Used for Polar organization context
- ✅ `POLAR_FREE_PRODUCT_ID` - Optional, used for free plan configuration
- ✅ `POLAR_PRO_PRODUCT_ID` - Required, used for Pro plan configuration (server-side)
- ✅ `BKLIT_DEFAULT_PROJECT` - Optional, used for auto-inviting new users

### Analytics Package (`packages/analytics/env.ts`)
- ✅ `CLICKHOUSE_HOST` - Used for ClickHouse database connection
- ✅ `CLICKHOUSE_USERNAME` - Used for ClickHouse authentication
- ✅ `CLICKHOUSE_PASSWORD` - Used for ClickHouse authentication

### Email Package (`packages/email/env.ts`)
- ✅ `RESEND_API_KEY` - Used for Resend email service (optional but recommended)

### DB Package (`packages/db/env.ts`)
- ✅ `DATABASE_URL` - Used for PostgreSQL database connection

## Notes on Variable Naming

### Polar Product IDs
- `POLAR_PRO_PRODUCT_ID` - Server-side variable used in auth package
- `NEXT_PUBLIC_POLAR_PRO_PLAN_PRODUCT_ID` - Client-side variable used in website app for pricing display
- Both are needed: server-side for subscription management, client-side for UI display

### Application URLs
- `AUTH_URL` - Server-side URL for Better Auth callbacks
- `NEXT_PUBLIC_APP_URL` - Client-side URL used throughout the app
- Both should typically be the same value but serve different purposes

## Recommendations

1. **No unused variables found** - All environment variables are actively used
2. **Optional variables** - Several variables are marked as optional (Google OAuth, Trigger.dev, etc.) - these are correctly implemented
3. **Variable naming** - The distinction between `POLAR_PRO_PRODUCT_ID` and `NEXT_PUBLIC_POLAR_PRO_PLAN_PRODUCT_ID` is intentional and correct

