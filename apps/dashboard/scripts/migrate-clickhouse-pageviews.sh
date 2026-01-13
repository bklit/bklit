#!/bin/bash

# ClickHouse Pageviews Migration Script
# Adds metadata and campaign tracking columns to page_view_event table

set -e

echo "========================================"
echo "ClickHouse Pageviews Migration"
echo "========================================"
echo ""

# Load environment variables from root .env
if [ -f "../../.env" ]; then
  echo "Loading environment from ../../.env"
  export $(cat ../../.env | grep -v '^#' | xargs)
elif [ -f "../.env" ]; then
  echo "Loading environment from ../.env"
  export $(cat ../.env | grep -v '^#' | xargs)
elif [ -f ".env" ]; then
  echo "Loading environment from .env"
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "Warning: No .env file found"
fi

# Check required environment variables
if [ -z "$CLICKHOUSE_HOST" ]; then
  echo "Error: CLICKHOUSE_HOST environment variable is required"
  echo "Please set it in your .env file"
  exit 1
fi

if [ -z "$CLICKHOUSE_PASSWORD" ]; then
  echo "Error: CLICKHOUSE_PASSWORD environment variable is required"
  echo "Please set it in your .env file"
  exit 1
fi

# Set defaults
CLICKHOUSE_USER="${CLICKHOUSE_USER:-default}"
CLICKHOUSE_PORT="${CLICKHOUSE_PORT:-8123}"
CLICKHOUSE_URL="http://${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}"

echo "Configuration:"
echo "  Host: $CLICKHOUSE_HOST"
echo "  Port: $CLICKHOUSE_PORT"
echo "  User: $CLICKHOUSE_USER"
echo "  URL: $CLICKHOUSE_URL"
echo ""

# Test connection
echo "Testing connection..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$CLICKHOUSE_URL/ping" \
  --user "$CLICKHOUSE_USER:$CLICKHOUSE_PASSWORD")

if [ "$HTTP_CODE" != "200" ]; then
  echo "Error: Failed to connect to ClickHouse (HTTP $HTTP_CODE)"
  echo "Please check your credentials and ensure ClickHouse is running"
  exit 1
fi

echo "✓ Connection successful"
echo ""

# Execute migration
echo "Adding columns to page_view_event table..."
echo ""

MIGRATION_SQL="
ALTER TABLE page_view_event
  ADD COLUMN IF NOT EXISTS title Nullable(String),
  ADD COLUMN IF NOT EXISTS description Nullable(String),
  ADD COLUMN IF NOT EXISTS og_image Nullable(String),
  ADD COLUMN IF NOT EXISTS og_title Nullable(String),
  ADD COLUMN IF NOT EXISTS favicon Nullable(String),
  ADD COLUMN IF NOT EXISTS canonical_url Nullable(String),
  ADD COLUMN IF NOT EXISTS language Nullable(String),
  ADD COLUMN IF NOT EXISTS robots Nullable(String),
  ADD COLUMN IF NOT EXISTS referrer_hostname Nullable(String),
  ADD COLUMN IF NOT EXISTS referrer_path Nullable(String),
  ADD COLUMN IF NOT EXISTS referrer_type Nullable(String),
  ADD COLUMN IF NOT EXISTS utm_id Nullable(String),
  ADD COLUMN IF NOT EXISTS gclid Nullable(String),
  ADD COLUMN IF NOT EXISTS fbclid Nullable(String),
  ADD COLUMN IF NOT EXISTS msclkid Nullable(String),
  ADD COLUMN IF NOT EXISTS ttclid Nullable(String),
  ADD COLUMN IF NOT EXISTS li_fat_id Nullable(String),
  ADD COLUMN IF NOT EXISTS twclid Nullable(String),
  ADD COLUMN IF NOT EXISTS is_new_visitor Bool DEFAULT false,
  ADD COLUMN IF NOT EXISTS landing_page Nullable(String);
"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$CLICKHOUSE_URL" \
  --user "$CLICKHOUSE_USER:$CLICKHOUSE_PASSWORD" \
  --data-binary "$MIGRATION_SQL")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "200" ]; then
  echo "✗ Migration failed (HTTP $HTTP_CODE)"
  echo "Error: $BODY"
  exit 1
fi

echo "✓ Migration executed successfully"
echo ""

# Verify columns were added
echo "Verifying new columns..."
echo ""

VERIFY_SQL="DESCRIBE TABLE page_view_event"
DESCRIBE_OUTPUT=$(curl -s -X POST "$CLICKHOUSE_URL" \
  --user "$CLICKHOUSE_USER:$CLICKHOUSE_PASSWORD" \
  --data-binary "$VERIFY_SQL")

# Check for some of the new columns
if echo "$DESCRIBE_OUTPUT" | grep -q "title" && \
   echo "$DESCRIBE_OUTPUT" | grep -q "og_image" && \
   echo "$DESCRIBE_OUTPUT" | grep -q "gclid" && \
   echo "$DESCRIBE_OUTPUT" | grep -q "referrer_type"; then
  echo "✓ Verification successful - all columns added"
  echo ""
  echo "New columns:"
  echo "$DESCRIBE_OUTPUT" | grep -E "(title|description|og_image|og_title|favicon|canonical_url|language|robots|referrer_hostname|referrer_path|referrer_type|utm_id|gclid|fbclid|msclkid|ttclid|li_fat_id|twclid|is_new_visitor|landing_page)" | awk '{print "  - " $1 " (" $2 ")"}'
else
  echo "✗ Verification failed - some columns may be missing"
  echo ""
  echo "Full table structure:"
  echo "$DESCRIBE_OUTPUT"
  exit 1
fi

echo ""
echo "========================================"
echo "Migration completed successfully! 🎉"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Deploy updated tracker script"
echo "  2. Deploy updated API and services"
echo "  3. Test with a pageview"
echo ""

