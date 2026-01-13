# Dashboard Scripts

Utility scripts for database migrations and maintenance.

## ClickHouse Pageviews Migration

Adds enhanced metadata and campaign tracking columns to the `page_view_event` table.

### Prerequisites

Ensure your `.env` file (in the root directory) contains:

```env
CLICKHOUSE_HOST=http://your-server:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=your-password
```

### Running the Migration

#### Option 1: Cross-Platform (Recommended for Windows)

Works on Windows, macOS, and Linux:

```bash
cd apps/dashboard
pnpm tsx scripts/migrate-clickhouse-pageviews.ts
```

#### Option 2: Unix Shell Script (macOS/Linux only)

```bash
cd apps/dashboard
./scripts/migrate-clickhouse-pageviews.sh
```

### What It Does

The migration adds the following columns to `page_view_event`:

**Page Metadata:**

- `title`, `description`, `og_image`, `og_title`
- `favicon`, `canonical_url`, `language`, `robots`

**Campaign Attribution:**

- `referrer_hostname`, `referrer_path`, `referrer_type`
- `utm_id`, `gclid`, `fbclid`, `msclkid`, `ttclid`, `li_fat_id`, `twclid`

**Session Tracking:**

- `is_new_visitor`, `landing_page`

### Troubleshooting

**Connection Errors:**

- Verify `CLICKHOUSE_HOST` includes the full URL (e.g., `http://46.224.125.208:8123`)
- Check that ClickHouse is running and accessible
- Ensure firewall allows connections from your IP

**Permission Errors:**

- Verify `CLICKHOUSE_PASSWORD` is correct
- Ensure user has `ALTER TABLE` permissions

**Column Already Exists:**

- This is normal! The script uses `IF NOT EXISTS` and will skip existing columns
- The migration is idempotent (safe to run multiple times)

## Contributing

When creating new migration scripts:

1. **Always provide both versions** - Shell script (.sh) and TypeScript (.ts)
2. **Test on multiple platforms** - Windows, macOS, Linux
3. **Make scripts idempotent** - Safe to run multiple times
4. **Document thoroughly** - Update this README and relevant docs
5. **Use environment variables** - Don't hardcode credentials
