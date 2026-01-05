# Migration History

This file documents all database schema migrations for Bklit Analytics.

## Current State

The project currently uses incremental migrations. A V1 baseline migration reset is **optional** and can be performed to clean up migration drift.

## Planned: Version 1 Baseline (Optional)

**Baseline Migration**: `20250105000000_v1_baseline` (not yet created)

This baseline migration can be created to clean up legacy migrations and establish a clean starting point.

### What Changed

- Deleted all legacy migrations (pre-ClickHouse migration era)
- Established current schema as Version 1 source of truth
- Removed models migrated to ClickHouse: PageViewEvent, TrackedEvent, TrackedSession
- Improved developer experience with setup scripts

### Current Schema (V1)

**18 tables total:**

**Authentication (4 tables)**

- User
- Session
- Account
- Verification

**Organization Management (3 tables)**

- Organization
- Member
- Invitation

**Core Entities (2 tables)**

- Project
- EventDefinition

**Preferences (1 table)**

- NotificationPreference

**API & Tokens (2 tables)**

- ApiToken
- ApiTokenProject

**Health Monitoring (2 tables)**

- ApiHealthCheck
- ApiHealthAlertState

**Analytics (2 tables)**

- Funnel
- FunnelStep

**Extensions (3 tables)**

- ProjectExtension
- ProjectExtensionEvent
- ExtensionRateLimit

### Developer Experience Improvements

- Added interactive `pnpm setup` script for first-time setup
- Created `npx @bklit/create` CLI for zero-config setup
- Cross-platform support (Windows, macOS, Linux)
- Improved error messages and validation
- Simpler commands: `db:reset`, `db:status`, `db:push`, etc.
- Auto-detection of environment issues
- Optional features (Polar, OAuth, Resend) with graceful fallbacks

### Next Migrations

All future migrations will be incremental changes from this baseline.

---

## Future Migrations

### Template for Documenting New Migrations

When creating new migrations, document them here:

```markdown
## [Migration Name] (Date)

**Migration**: `YYYYMMDDHHMMSS_migration_name`

### Purpose

What this migration does and why it's needed.

### Changes

- Added: [tables/columns added]
- Modified: [tables/columns changed]
- Removed: [tables/columns removed]

### Impact

- Performance considerations
- Breaking changes
- Required actions after applying

### Rollback

How to rollback if needed.
```
