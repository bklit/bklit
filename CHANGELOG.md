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

## Unreleased

Changes that are in development but not yet released will be listed here.

---

[1.0.0]: https://github.com/bklit/bklit/releases/tag/v1.0.0
