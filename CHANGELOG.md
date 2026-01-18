# Bklit Platform Changelog

## [2.0.0] - 2026-01-18

### 🚀 Major Release - WebSocket Architecture

**This is a major architectural shift for instant real-time analytics.**

### Breaking Changes

#### Infrastructure Changes

- **Replaced HTTP ingestion with WebSocket server**
  - New service: `packages/websocket/` (renamed from `packages/ingestion/`)
  - WebSocket server runs on bklit.ws:8080 (port 8080)
  - Requires deployment to VPS/server (cannot run on serverless)

- **Removed HTTP tracking endpoints**
  - Deleted: `POST /api/track`
  - Deleted: `POST /api/session-end`
  - Deleted: `POST /api/track-event`
  - Deleted: `GET /api/live-stream` (SSE endpoint)

- **New production infrastructure requirement**
  - WebSocket server must run on separate server (e.g., Hetzner VPS)
  - Domain required: bklit.ws with DNS pointing to WebSocket server
  - SSL/TLS certificates required for wss://
  - PM2 or similar process manager recommended

#### SDK Changes

- **@bklit/sdk v1.0.0+** - Published to npm with WebSocket support
  - Configuration: `apiHost` → `wsHost`
  - Default: `wss://bklit.ws:8080`
  - See [SDK Migration Guide](packages/sdk/CHANGELOG.md)

#### Development Workflow Changes

- **Updated commands:**
  - `pnpm dev:services` now starts WebSocket server (not ingestion)
  - `pnpm dev:websocket` replaces `pnpm dev:ingestion`
  - `pnpm dev:stop` kills WebSocket processes (port 8080)

### New Features

#### Instant Real-Time Analytics

- **Sub-second session ending**
  - Sessions end in <1 second when tabs close (was 30s-4min)
  - 120-240x faster than previous HTTP + timeout approach
  - Reliable WebSocket disconnect detection

- **Real-time event broadcasting**
  - Dashboard updates instantly via WebSocket
  - No polling required
  - Event-driven architecture

- **Auto-reconnection**
  - SDK reconnects automatically with exponential backoff
  - Message queuing when connection not ready
  - Graceful degradation

#### ip-api.com Geolocation

- **Switched from Cloudflare headers to ip-api.com**
  - More accurate city-level geolocation
  - ISP information included
  - Mobile device detection
  - Free tier: 45 requests/minute
  - Auto-detection for local development

#### Production WebSocket Infrastructure

- **Secure WebSocket (wss://)**
  - SSL/TLS with Let's Encrypt
  - Auto-renewal via Certbot
  - Production: `wss://bklit.ws:8080`
  - Development: `ws://localhost:8080`

- **Process management**
  - PM2 integration for auto-start
  - Systemd service support
  - Health monitoring
  - Auto-restart on crash

#### Live Map Improvements

- **Fixed marker clickability**
- **Country grouping with expansion**
- **Session end animations**
- **Debug console for map events**
- **React state management improvements**

### Removed

- **Session cleanup worker job** - No longer needed (instant WebSocket disconnect)
- **Redis TTL/expiry logic** - Sessions managed by WebSocket lifecycle
- **ClickHouse fallback for live counts** - Redis is single source of truth
- **`beforeunload` handlers** - Replaced by WebSocket disconnect
- **`sendBeacon` fallbacks** - No longer needed
- **600+ lines of legacy code** - Simplified architecture

### Performance Improvements

| Metric | v1.x | v2.0 | Improvement |
|--------|------|------|-------------|
| Session End Latency | 30s-4min | <1 second | 120-240x faster |
| Live User Query | 50-150ms | 5-10ms | 10x faster |
| Real-time Updates | 10s polling | Instant | Event-driven |
| Dashboard Load | Moderate | Fast | No ClickHouse fallback |

### Infrastructure

#### Production Stack

- **WebSocket Server:** Hetzner VPS (bklit.ws:8080)
- **Dashboard:** Vercel (app.bklit.com)
- **Redis:** Upstash (queue + sessions)
- **ClickHouse:** Hetzner (analytics database)
- **DNS:** Vercel DNS (bklit.ws)

#### Development Stack

- **WebSocket:** localhost:8080 (via `pnpm dev:services`)
- **Redis:** Docker (localhost:6379)
- **ClickHouse:** Docker (localhost:8123)
- **Dashboard:** localhost:3000

### Migration Guide

See [WEBSOCKET_MIGRATION.md](WEBSOCKET_MIGRATION.md) for complete migration details.

#### For Self-Hosted Users

**Update deployment:**

1. Pull latest code from `main` branch
2. Install PM2: `npm install -g pm2`
3. Configure DNS for bklit.ws (or your domain)
4. Set up SSL certificates (Let's Encrypt)
5. Start services: `pm2 start ecosystem.config.js`
6. See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for details

**No database changes required** - ClickHouse schema unchanged, fully compatible.

#### For SDK Users

**Update to latest SDK:**

```bash
npm install @bklit/sdk@latest
```

See [SDK Migration Guide](packages/sdk/CHANGELOG.md#100---2026-01-18)

### Data Integrity

- ✅ **Zero data loss** - All existing pageviews and sessions preserved
- ✅ **Schema unchanged** - Fully backward compatible
- ✅ **Queries work** - All dashboard features functional
- ✅ **Geolocation improved** - ip-api provides better accuracy

### Documentation

- ✅ Updated README.md with WebSocket architecture
- ✅ Created migration guides
- ✅ Updated all SDK documentation
- ✅ Production deployment guides
- ✅ Security best practices documented

### Security

- ✅ Multi-tenant origin validation
- ✅ API token authentication
- ✅ SSL/TLS encryption (wss://)
- ✅ Redacted sensitive infrastructure details from public docs

### Contributors

This release includes contributions and testing from the Bklit team and early adopters.

---

## [1.0.1] - Session Country Code Enhancement

Session-level country code tracking improvements.

## [1.0.0] - Initial Open Source Release

First public release of Bklit Analytics platform.
