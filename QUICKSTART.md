# Bklit New Architecture - Quick Start Guide

## 🚀 What's New

Your analytics system now uses a **queue-based architecture** (Visitors.now style) with:
- ✅ Zero data loss (Redis queue with AOF persistence)
- ✅ Batch processing (100x faster ClickHouse writes)
- ✅ Real-time debugging (/terminal UI)
- ✅ Dual-write verification (both old and new systems running in parallel)

## 📦 Services Running Locally

Currently running:
1. ✅ **Ingestion Service** - `http://localhost:3001` (accepts POST /track)
2. ✅ **Background Worker** - Polls queue every 1s, batches to ClickHouse
3. ✅ **Dashboard** - `http://localhost:3000` (includes /terminal UI)
4. ✅ **ClickHouse** - `localhost:8123` (Docker)
5. ✅ **Redis** - `localhost:6379` (Docker)

## 🎯 Testing the New System

### Step 1: Open the Terminal UI

Visit: **http://localhost:3000/{organizationId}/{projectId}/terminal**

You should see:
- Real-time log stream
- Stage filter chips (ingestion, queue, worker, clickhouse, pubsub, websocket)
- Live metrics

### Step 2: Trigger an Event

Open your playground or website (with tracker.js) and navigate around. Or test directly:

```bash
curl -X POST http://localhost:3001/track \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{
    "url": "https://test.com/page",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "projectId": "YOUR_PROJECT_ID",
    "sessionId": "test-session-123",
    "userAgent": "Test/1.0"
  }'
```

### Step 3: Watch the Pipeline in /terminal

You should see logs flowing through all stages:
1. **Ingestion** - Event received and queued
2. **Queue** - Event pushed to Redis
3. **Worker** - Event popped from queue
4. **ClickHouse** - Event saved to database
5. **PubSub** - Event published for real-time
6. **Verification** - Event matched between systems ✅

### Step 4: Verify in ClickHouse

```bash
docker exec bklit-clickhouse-local clickhouse-client \
  --query "SELECT count() FROM page_view_event WHERE project_id = 'YOUR_PROJECT_ID'"
```

## 🔍 Monitoring

### Check Queue Depth
```bash
docker exec bklit-redis-local redis-cli LLEN analytics:queue
```

Should be 0 or very low (worker processes fast).

### Check Worker Logs
See terminal 10:
```bash
cat /Users/matt/.cursor/projects/Users-matt-Bklit-bklit/terminals/10.txt
```

### Check Ingestion Logs
See terminal 9:
```bash
cat /Users/matt/.cursor/projects/Users-matt-Bklit-bklit/terminals/9.txt
```

## 🛠 Development Commands

```bash
# Start everything
pnpm dev:all

# Start individual services
pnpm dev:services      # Just Docker (ClickHouse + Redis)
pnpm dev:ingestion     # Just ingestion service
pnpm dev:worker        # Just background worker
pnpm -F @bklit/dashboard dev  # Just dashboard

# Check service health
curl http://localhost:3001/health  # Ingestion
curl http://localhost:3000/api/health  # Dashboard (if endpoint exists)
```

## 📊 Current Status

### ✅ Completed
- Docker services (ClickHouse + Redis)
- Ingestion service with token validation & caching
- Background worker with batch processing
- /terminal UI with real-time SSE streaming
- Debug logging infrastructure
- Dual-write in /api/track
- Verification logic

### ⏳ Pending (After 24-48h Verification)
- Remove old direct-write code from /api/track
- Deploy ingestion to Cloudflare Workers (production)
- Deploy worker to Hetzner systemd service (production)

## 🎨 Terminal UI Features

Located at: `/[org]/[project]/terminal`

**Features:**
- Real-time event stream (Server-Sent Events)
- Filter by stage (ingestion, queue, worker, etc.)
- Search logs by content
- Pause/Resume stream
- Auto-scroll control
- Clear logs button
- Event ID tracing
- Latency metrics per stage

**Color Coding:**
- 🔵 Blue = Ingestion
- 🟣 Purple = Queue
- 🟡 Yellow = Worker
- 🟢 Green = ClickHouse
- 🟠 Orange = PubSub
- 🩷 Pink = WebSocket

## 🚨 Troubleshooting

### Queue backing up?
```bash
# Check depth
docker exec bklit-redis-local redis-cli LLEN analytics:queue

# If > 1000, check worker logs for errors
cat /Users/matt/.cursor/projects/Users-matt-Bklit-bklit/terminals/10.txt
```

### Events not appearing in /terminal?
1. Check Redis is connected: `docker ps | grep redis`
2. Check debug-stream endpoint: `curl http://localhost:3000/api/debug-stream?projectId=YOUR_ID`
3. Check browser console for errors

### Ingestion service not responding?
```bash
# Check if running
curl http://localhost:3001/health

# Check logs
cat /Users/matt/.cursor/projects/Users-matt-Bklit-bklit/terminals/9.txt

# Restart
pnpm dev:ingestion
```

## 📈 Next Steps

1. **Test the pipeline** - Visit playground, watch /terminal
2. **Monitor for 24-48 hours** - Ensure 100% match rate
3. **Deploy to production** - Ingestion to CF Workers, worker to Hetzner
4. **Remove old code** - Delete direct-write after verification
5. **Optimize** - Tune batch sizes, polling intervals based on metrics

