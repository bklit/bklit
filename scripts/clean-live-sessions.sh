#!/bin/bash

# Clean Live Sessions Script
# Clears all live session data from Redis and ClickHouse

set -e

echo "🧹 Cleaning live sessions..."
echo ""

# 1. Clear native Redis (not Docker)
echo "1️⃣ Flushing Redis (localhost:6379)..."
redis-cli FLUSHALL
echo "✅ Redis cleared"
echo ""

# 2. End all ClickHouse sessions (only if container is running)
echo "2️⃣ Ending all ClickHouse sessions..."
if docker ps --format '{{.Names}}' | grep -q '^bklit-clickhouse-local$'; then
  docker exec bklit-clickhouse-local clickhouse-client \
    --user default \
    --password local_dev_password \
    --database analytics \
    --query "
      ALTER TABLE tracked_session
      UPDATE ended_at = now(), duration = 1800, did_bounce = false
      WHERE ended_at IS NULL
      SETTINGS mutations_sync = 2
    "
  echo "✅ ClickHouse sessions ended"
else
  echo "⚠️  ClickHouse container not running (this is OK if services are stopped)"
  echo "   Sessions will be cleared when you start services"
fi
echo ""

echo "🎉 All live sessions cleared!"
echo ""
echo "Next steps:"
echo "  1. Hard refresh the dashboard (Cmd+Shift+R)"
echo "  2. Open a new incognito tab with the playground"
echo ""

