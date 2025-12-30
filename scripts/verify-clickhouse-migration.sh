#!/bin/bash

# Verify ClickHouse Migration Script
# Compares row counts between Postgres and ClickHouse

set -e

echo "🔍 Verifying ClickHouse migration..."
echo ""

# Check Postgres tables
echo "📊 Postgres table counts:"
psql "$DATABASE_URL" -c "
SELECT 'PageViewEvent' as table_name, COUNT(*) as count FROM \"PageViewEvent\"
UNION ALL
SELECT 'TrackedEvent', COUNT(*) FROM \"TrackedEvent\"  
UNION ALL
SELECT 'TrackedSession', COUNT(*) FROM \"TrackedSession\";
"

echo ""
echo "📊 ClickHouse table counts:"
echo "Connect to ClickHouse and run:"
echo ""
echo "SELECT 'page_view_event' as table_name, COUNT(*) as count FROM page_view_event"
echo "UNION ALL"
echo "SELECT 'tracked_event', COUNT(*) FROM tracked_event"
echo "UNION ALL"  
echo "SELECT 'tracked_session', COUNT(*) FROM tracked_session;"
echo ""
echo "⚠️  IMPORTANT: ClickHouse counts should be >= Postgres counts"
echo "If ClickHouse has fewer records, run: pnpm --filter @bklit/analytics migrate-data"

