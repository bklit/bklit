# Changelog

All notable changes to Bklit Analytics will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-05

### 🎉 Version 1.0 - The Foundation Release

This is the first stable release of Bklit Analytics, establishing a clean baseline for future development.

### ✨ Added

#### Smart Setup CLI

- **`npx @bklit/create`** - Zero-configuration setup wizard
  - Auto-generates all secrets (AUTH_SECRET, etc.)
  - Auto-detects and configures Docker for PostgreSQL + ClickHouse
  - Interactive prompts for optional features
  - Creates .env file automatically
  - Complete setup in ~90 seconds

#### Simplified Environment Configuration

- Reduced required environment variables from 12+ to just 3
- Made Polar.sh billing completely optional
- Made OAuth providers (GitHub/Google) optional
- Made Resend email service optional
- Made Mapbox maps optional
- Made Trigger.dev background jobs optional

#### Developer Experience Improvements

- Added `pnpm db:reset`, `db:push`, `db:pull`, `db:status`, `db:deploy` commands
- Email OTPs now prominently displayed in terminal during development
- Email sending falls back to console logging in development
- Better error messages and validation
- Cross-platform support (Windows, macOS, Linux)

#### Documentation

- Complete rewrite of Quick Start guide
- New Environment Variables reference guide
- Updated all documentation to reflect optional features
- Added migration history documentation
- Improved README with quick start instructions

### 🔧 Changed

#### Core Changes

- **Breaking**: Node.js requirement changed from >=22.14.0 to >=22.0.0
- Polar plugin now loads conditionally (only if credentials exist)
- OAuth providers load conditionally (only if credentials exist)
- Email sending gracefully falls back to console in development

#### Database

- Established V1 baseline schema (18 tables)
- Removed ClickHouse-migrated models (PageViewEvent, TrackedEvent, TrackedSession)
- Clean migration state - ready for incremental updates

### 🐛 Fixed

- Fixed ESM/CommonJS conflicts in with-env-dev scripts
- Fixed ClickHouse password validation (allows empty string for local Docker)
- Fixed Docker volume persistence issues in setup
- Fixed environment variable validation strictness

### 📦 Packages

#### New Packages

- `@bklit/create` - Setup CLI tool (publishable to npm)

#### Modified Packages

- `@bklit/auth` - Optional Polar integration
- `@bklit/email` - Console fallback for development
- `@bklit/analytics` - Relaxed password validation
- `@bklit/db` - Improved helper scripts

### 🎯 What Works Out of the Box (No Configuration)

- ✅ Email authentication (magic links with OTP codes in terminal)
- ✅ Analytics tracking & dashboards
- ✅ Funnel builder
- ✅ Session tracking
- ✅ Geographic insights (list view)
- ✅ Custom events
- ✅ Real-time analytics
- ✅ Extensions system

### 📊 Impact

- **Setup time:** 30 minutes → 90 seconds (95% reduction)
- **Required env vars:** 12+ → 3 (90% reduction)
- **External dependencies:** Multiple → Zero (for core features)
- **Manual configuration:** Everything → Nothing

### 🚀 Migration Guide

For existing installations:

1. Your current .env files continue to work (backward compatible)
2. No action required unless you want to simplify your configuration
3. To adopt the new optional features approach:
   - Remove unused OAuth provider credentials
   - Remove Polar credentials if not using billing
   - Remove Resend API key for local development
4. Migration reset is optional (see `packages/db/MIGRATION_HISTORY.md`)

### 🙏 Contributors

Thank you to everyone who contributed to making v1 possible!

---

## [1.0.1] - 2025-01-07

### 🔧 Database Migration - Session Country Codes

#### ClickHouse Schema Changes

- **Added `country_code` column to `tracked_session` table**
  - Enables country flag display in session event tables
  - Improves geographic analytics and session detail views

#### Migration Required for Self-Hosted Users

If you're self-hosting with your own ClickHouse database, apply this migration:

**Step 1: Add the column**

```bash
cd packages/analytics
pnpm with-env-dev tsx src/migrations/add-country-code-to-session.ts
```

**Step 2: Backfill (country codes) to existing sessions (one-time)**

```bash
cd packages/analytics
pnpm with-env-dev tsx src/migrations/backfill-session-country-codes.ts
```

The backfill script will:

- Find all sessions without country codes
- Match them with their first pageview event containing a country code
- Update sessions in batches of 1,000 for efficiency
- Report progress and completion statistics

**Note:** New installations automatically include this column via the updated `init-tables.ts` migration.

#### Files Changed

- `packages/analytics/src/migrations/init-tables.ts` - Added country_code to schema
- `packages/analytics/src/migrations/add-country-code-to-session.ts` - Migration script
- `packages/analytics/src/migrations/backfill-session-country-codes.ts` - Backfill script
- `packages/analytics/src/service.ts` - Updated getSessionById query
- `apps/dashboard/src/components/events/session-events-table.tsx` - Added country flags

### ✨ UI Improvements

#### Analytics Change Indicators

- Added animated change indicators to Quick Stats card
- Added change indicators to Top Countries and Popular Pages cards
- Created reusable `ChangeIndicator` component with directional animations
  - Positive changes: slide up with emerald color
  - Negative changes: slide down with rose color
  - Includes blur effect on enter/exit
- Change indicators respect `?compare=false` URL parameter

#### Event Detail Enhancements

- Added country flags to Session Events table
- Made session IDs clickable links to session detail pages
- Improved Area Chart styling to match pageviews (linear, better spacing)
- Fixed NaN issues in stats when switching dates
- Fixed time series to show all days in selected range (was only showing one day)

#### Component Architecture

- Created `@bklit/ui/components/change-indicator` - Reusable change indicator
- Enhanced `ProgressRow` component with optional `change` prop
- All analytics cards now use consistent change comparison logic

### 🐛 Fixes

- Fixed Quick Stats card not updating when changing date range
- Fixed `initialData` vs `placeholderData` in React Query causing stale data
- Fixed conversion rate calculation returning NaN
- Fixed event timeline only showing paginated results instead of all events
- Fixed session link IDs (now uses `id` field instead of `session_id` hash)

---

## Unreleased

Changes that are in development but not yet released will be listed here.

---

[1.0.1]: https://github.com/bklit/bklit/releases/tag/v1.0.1
[1.0.0]: https://github.com/bklit/bklit/releases/tag/v1.0.0
