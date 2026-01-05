# @bklit/create

One-command setup for Bklit Analytics.

## Usage

```bash
# Create in default 'bklit' directory
npx @bklit/create

# Or specify a custom directory name
npx @bklit/create my-analytics
```

That's it! The wizard will:
- ✓ Clone the Bklit repository
- ✓ Check your system prerequisites
- ✓ Generate secure secrets automatically
- ✓ Set up PostgreSQL & ClickHouse with Docker
- ✓ Install dependencies
- ✓ Create database schema
- ✓ Start the development server

**Total time: ~90 seconds**

## What Gets Configured

### Required (Auto-Generated)
- `AUTH_SECRET` - 32-byte secure random secret
- `DATABASE_URL` - PostgreSQL connection (via Docker)
- `CLICKHOUSE_HOST` - ClickHouse connection (via Docker)
- `HEALTH_CHECK_SECRET` - 16-byte secure random secret

### Optional (You Choose)
The wizard asks if you want to set up:
- **Polar.sh** - Billing and subscriptions
- **GitHub/Google OAuth** - Social login
- **Resend** - Email sending

All optional! Core features work without them.

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test locally
node dist/index.js
```

## Publishing

```bash
pnpm build
npm publish --access public
```

## Requirements

- Node.js 22.0.0+
- Docker (optional - for auto database setup)

## License

MIT

