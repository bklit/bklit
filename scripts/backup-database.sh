#!/bin/bash

# Database Backup Script for Bklit
# Run this BEFORE making any schema changes

set -e

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="backup-${TIMESTAMP}.sql"

echo "🔐 Starting database backup..."
echo "📁 Backup file: ${BACKUP_FILE}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL or run: source .env"
    exit 1
fi

# Perform backup
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database backup completed successfully!"
    echo "📦 Backup saved to: ${BACKUP_FILE}"
    echo ""
    echo "File size: $(du -h ${BACKUP_FILE} | cut -f1)"
    echo ""
    echo "⚠️  IMPORTANT: Verify this backup before proceeding with schema changes"
    echo "To restore: psql \$DATABASE_URL < ${BACKUP_FILE}"
else
    echo "❌ Backup failed!"
    exit 1
fi

