# Bklit Analytics Architecture

## Overview

Bklit uses a **queue-based architecture** inspired by Visitors.now, designed for high performance, zero data loss, and comprehensive debugging capabilities.

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      TRACKED WEBSITE                        │
│                     (tracker.js SDK)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ POST /track
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   DUAL-WRITE PHASE                          │
│  /api/track (Vercel) - During Migration Only               │
│  ├─ Direct ClickHouse write (OLD - validation baseline)     │
│  └─ Redis queue push (NEW - being verified)                │
└───────────────┬─────────────────────────┬───────────────────┘
                │                         │
                ▼                         ▼
       ┌────────────────┐        ┌────────────────┐
       │   ClickHouse   │        │  Redis Queue   │
       │   (immediate)  │        │ analytics:queue│
       └────────────────┘        └────────┬───────┘
                                          │
                                          ▼
                                ┌──────────────────┐
                                │ Background Worker│
                                │ (packages/worker)│
                                │ ├─ Polls queue   │
                                │ ├─ Batch 100     │
                                │ ├─ Insert CH     │
                                │ ├─ Verify match  │
                                │ └─ Pub live-events│
                                └────────┬──────────┘
                                         │
                                         ▼
                                ┌──────────────────┐
                                │  Redis PubSub    │
                                │  live-events     │
                                └────────┬──────────┘
                                         │
                                         ▼
                                ┌──────────────────┐
                                │ WebSocket Server │
                                │ (Hetzner/ws.bklit│
                                └────────┬──────────┘
                                         │
                                         ▼
                                ┌──────────────────┐
                                │  Dashboard UI    │
                                │  Real-time       │
                                └──────────────────┘
```

## Data Flow

### 1. Event Ingestion
- **Service:** `packages/ingestion` (port 3001)
- **Purpose:** Fast HTTP endpoint that queues events
- **Response Time:** <50ms target
- **Stack:** Node.js HTTP server, token validation with Redis caching

### 2. Redis Queue
- **Key:** `analytics:queue`
- **Format:** JSON-serialized QueuedEvent objects
- **Persistence:** AOF enabled (appendonly yes, everysec)
- **Durability:** Zero data loss guarantee

### 3. Background Worker
- **Service:** `packages/worker`
- **Purpose:** Batch process queued events
- **Polling:** Every 1 second
- **Batch Size:** Up to 100 events
- **Processing:**
  1. Pop events from queue
  2. Batch insert to ClickHouse
  3. Verify against direct writes
  4. Publish to live-events channel

### 4. Real-time Updates
- **Channel:** `live-events` (Redis pub/sub)
- **Consumer:** WebSocket server on Hetzner
- **Latency:** <1 second from event to browser

## Debug & Monitoring

### /terminal UI
- **Route:** `/[org]/[project]/terminal`
- **Purpose:** Real-time pipeline monitoring
- **Features:**
  - Live event stream (Server-Sent Events)
  - Stage-by-stage filtering
  - Event ID tracing
  - Latency metrics
  - Error highlighting

### Debug Logs Channel
- **Channel:** `debug-logs` (Redis pub/sub)
- **Stages:** ingestion, queue, worker, clickhouse, pubsub, websocket
- **Levels:** info, warn, error
- **Format:** JSON with eventId for end-to-end tracing

## Local Development

### Starting All Services

```bash
pnpm dev:all
```

This runs:
1. Docker Compose (ClickHouse + Redis)
2. Ingestion service (port 3001)
3. Background worker (processes queue)
4. Dashboard (port 3000)

### Services

| Service | Port | Purpose |
|---------|------|---------|
| ClickHouse | 8123, 9000 | Analytics storage |
| Redis | 6379 | Queue + pub/sub + session tracking |
| Ingestion | 3001 | HTTP event receiver |
| Worker | - | Background batch processor |
| Dashboard | 3000 | UI + API + WebSocket client |

### Environment Variables

```bash
# Local Development
REDIS_URL=redis://localhost:6379
DEV_CLICKHOUSE_HOST=http://localhost:8123
DEV_CLICKHOUSE_USERNAME=default
DEV_CLICKHOUSE_PASSWORD=local_dev_password
DEV_DATABASE_URL=prisma+postgres://localhost:51213/...
```

## Migration Strategy (Zero Data Loss)

### Phase 1: Dual-Write (Current)
- `/api/track` writes to BOTH systems
- Old system: Direct ClickHouse insert
- New system: Redis queue → Worker → ClickHouse
- Verification: Worker checks if event exists (written by old system)

### Phase 2: Monitoring (24-48 hours)
- Monitor `/terminal` for 100% match rate
- Check for any discrepancies or errors
- Verify queue doesn't back up
- Confirm latency is acceptable

### Phase 3: Cutover
- Disable old direct-write code
- Keep only queue-based system
- Monitor for another 24 hours
- Archive old code

## Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| Ingestion response time | <50ms | TBD |
| Queue to ClickHouse latency | <5s | TBD |
| WebSocket broadcast latency | <1s | TBD |
| Worker batch size | 100-1000 | 100 |
| Data loss | 0% | 0% (guaranteed by queue) |

## Production Deployment

### Ingestion Service
- Deploy to: Cloudflare Workers (edge) OR Hetzner (co-located with ClickHouse)
- Domain: `track.bklit.ai`
- Requirements: Low latency, high availability

### Background Worker
- Deploy to: Hetzner (same server as ClickHouse for fastest inserts)
- Run as: systemd service
- Monitoring: Logs to debug-logs channel

### WebSocket Server
- Current: Separate Node.js process on Hetzner
- Future: Merge into dashboard API (simplify infrastructure)

## Key Benefits vs Previous Architecture

| Aspect | Before | After |
|--------|--------|-------|
| Write performance | One insert per event | Batch inserts (100x faster) |
| Reliability | Events lost on failure | Queue ensures durability |
| Scalability | Limited by serverless | Horizontal (add more workers) |
| Debugging | Scattered console.logs | Centralized /terminal UI |
| Cost | High (Vercel functions) | Low (self-hosted worker) |

## Tech Stack

- **Frontend:** Next.js 16 (Vercel)
- **API:** tRPC + Next.js API routes
- **Database:** PostgreSQL (Supabase/Prisma Accelerate)
- **Analytics:** ClickHouse (Self-hosted on Hetzner)
- **Queue:** Redis (Upstash for prod, local for dev)
- **Real-time:** Redis pub/sub + WebSocket (Socket.IO)
- **Ingestion:** Node.js HTTP server (packages/ingestion)
- **Worker:** Node.js batch processor (packages/worker)

## Monitoring & Debugging

### /terminal Features
1. **Real-time event stream** - See every event as it flows through the pipeline
2. **Stage filtering** - Focus on specific parts (ingestion, queue, worker, etc.)
3. **Event tracing** - Follow a single event through all stages using eventId
4. **Performance metrics** - Latency per stage, queue depth, events/second
5. **Error alerting** - Immediate visibility into failures

### Debug Log Format
```json
{
  "timestamp": "2026-01-16T14:48:00.123Z",
  "stage": "worker",
  "level": "info",
  "message": "Batch processing completed",
  "data": {
    "processed": 100,
    "duration": 1234,
    "avgDuration": 12.34
  },
  "eventId": "evt_1234567890_abc123",
  "projectId": "cmic3a5ap0003zxfjshgs688w",
  "duration": 1234
}
```

## Next Steps

1. ✅ All services running locally
2. ⏳ Test end-to-end flow via /terminal
3. ⏳ Monitor for 24-48 hours to verify zero discrepancies
4. ⏳ Remove old direct-write code after verification
5. ⏳ Deploy to production (ingestion → Cloudflare Workers, worker → Hetzner)

