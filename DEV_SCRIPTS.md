# Development Scripts Guide

## 🚀 New Queue-Based Architecture (Recommended)

### Quick Start (One Command)
```bash
pnpm dev:local
```
This starts everything you need:
- Docker (ClickHouse + Redis)
- Ingestion service (port 3001)
- Background worker
- Dashboard (port 3000)
- Playground (port 5173)

### Stop Everything
```bash
pnpm dev:stop
```
Kills all node processes and stops Docker.

---

## 📋 Individual Scripts

### Infrastructure
- `pnpm dev:services` - Start Docker only (ClickHouse + Redis)
- `pnpm dev:init` - Start Docker + initialize ClickHouse tables
- `pnpm dev:services:stop` - Stop Docker

### New Architecture Services
- `pnpm dev:ingestion` - Start ingestion service (port 3001)
- `pnpm dev:worker` - Start background worker
- `pnpm dev:playground` - Start playground (port 5173)

### Dashboard
- `NODE_ENV=development pnpm -F @bklit/dashboard dev` - Start dashboard with local DB

---

## 🗑️ Deprecated Scripts (Old Architecture)

These are from before the queue-based refactor:

- `pnpm dev:all` - OLD: Used to start everything (now use `dev:local`)
- `pnpm dev:full` - OLD: Full stack with Trigger.dev
- `pnpm dev:live` - OLD: With standalone WebSocket server (deprecated)
- `pnpm ws:dev` / `pnpm ws:build` - OLD: Standalone WebSocket server (will be merged into dashboard)

### Keep These:
- `pnpm dev` - Still useful for dashboard + playground only (no queue system)
- `pnpm dev:docs` - Documentation site
- All `db:*` commands - Database management
- `deploy:trigger` - Trigger.dev deployment

---

##  Testing the New Architecture

### 1. Start Everything
```bash
pnpm dev:local
```

### 2. Open Terminal UI
Visit: `http://localhost:3000/{organizationId}/{projectId}/terminal`

### 3. Open Playground
Visit: `http://localhost:5173`

### 4. Generate Events
- Navigate between pages (pageviews)
- Click "Add to Cart" (custom events)

### 5. Watch /terminal
You'll see events flow through:
- 🔵 Ingestion (<3ms)
- 🟣 Queue
- 🟡 Worker  
- 🟢 ClickHouse (44-90ms)
- 🟠 PubSub

### 6. Verify Data
```bash
docker exec bklit-clickhouse-local clickhouse-client --database=analytics \
  --query "SELECT id, event_definition_id FROM tracked_event ORDER BY timestamp DESC LIMIT 10 FORMAT Pretty"
```

---

## 🔧 Troubleshooting

### Dashboard shows Accelerate error?
Make sure `.env` has:
```
DEV_CLICKHOUSE_HOST="http://localhost:8123"
DEV_CLICKHOUSE_USERNAME="default"
DEV_CLICKHOUSE_PASSWORD="local_dev_password"
DEV_DATABASE_URL="prisma+postgres://localhost:51213/..."
```

Then restart:
```bash
pnpm dev:stop
pnpm dev:local
```

### Port conflicts?
```bash
pnpm dev:stop
# Wait 5 seconds
pnpm dev:local
```

### Worker not processing events?
Check queue depth:
```bash
docker exec bklit-redis-local redis-cli LLEN analytics:queue
```

If > 0 and not decreasing, check worker logs.

---

## 📊 Architecture Summary

**Old (Direct Insert):**
```
Tracker → /api/track → ClickHouse (300-500ms per event)
```

**New (Queue-Based - Visitors.now style):**
```
Tracker → Ingestion (3ms) → Redis Queue → Worker → ClickHouse (batch 100 events)
```

**Benefits:**
- 100x faster ClickHouse writes (batching)
- Zero data loss (Redis persistence)
- Real-time debugging (/terminal UI)
- Better scalability

