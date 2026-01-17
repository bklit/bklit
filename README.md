![hero](https://repository-images.githubusercontent.com/985341745/118def38-e6ce-446b-8ca1-d809c583f57d)

<p align="center">
	<h1 align="center"><b>Bklit Analytics</b></h1>
<p align="center">
    Bklit is a privacy-focused, open-source analytics platform built for modern web applications. Track pageviews, custom events, user sessions, and conversion funnels with a powerful SDK and beautiful dashboard.
    <br />
    <br />
    <a href="https://docs.bklit.com">Docs</a>
    ·
    <a href="https://x.com/bklitai">X.com</a>
    ·
    <a href="https://discord.gg/9yyK8FwPcU">Discord</a>
    ·
    <a href="https://github.com/bklit/bklit/issues">Issues</a>
  </p>
</p>

### [→ Demo](https://app.bklit.com)

\*Requires signup

## **Features**

📊 **[View Complete Feature List →](https://docs.bklit.com/features)**

Bklit Analytics provides 150+ features including:

- Real-time analytics with live visitor tracking
- Visual funnel builder for conversion optimization
- Geographic insights with city-level precision
- Unlimited data retention on all plans
- Open-source with self-hosting option
- Enterprise-grade security and permissions
- Developer-friendly SDK and API

## **Quick Start**

Get Bklit running in under 2 minutes:

```bash
npx @bklit/create
```

That's it! The CLI will:
- ✓ Check your system prerequisites
- ✓ Generate secure secrets automatically
- ✓ Set up PostgreSQL & ClickHouse with Docker
- ✓ Install dependencies
- ✓ Create database schema
- ✓ Start the development server

**Total time: ~90 seconds**

## **Prerequisites**

- **Node.js 22.0.0+**
- **pnpm 9.6.0+**
- **Docker** (optional - for automatic database setup)
- **PostgreSQL** (if not using Docker)
- **ClickHouse** (if not using Docker)

## **Project Structure**

This monorepo is managed with [Turborepo](https://turbo.build/repo) and [pnpm workspaces](https://pnpm.io/workspaces).

```
bklit/
├── apps/
│   ├── dashboard/          # Main analytics dashboard (Next.js 16)
│   ├── docs/               # Documentation site (Fumadocs)
│   ├── playground/         # Demo app for SDK testing (Vite + React)
│   └── website/            # Marketing website (Next.js 16)
│
├── packages/
│   ├── analytics/          # ClickHouse analytics service
│   ├── api/                # tRPC API routes
│   ├── auth/               # Better Auth + Polar integration
│   ├── db/                 # Prisma ORM (PostgreSQL)
│   ├── email/              # React Email templates
│   ├── extensions/         # Extension system (Discord, etc.)
│   ├── ingestion/          # Event ingestion server (receives SDK events)
│   ├── redis/              # Redis client, queue, and pub/sub utilities
│   ├── sdk/                # Analytics SDK (published to npm)
│   ├── ui/                 # Shared UI components (shadcn/ui)
│   ├── utils/              # Common utilities
│   ├── validators/         # Zod schemas for validation
│   └── worker/             # Background worker (processes events → ClickHouse)
│
└── scripts/
    ├── backup-database.sh
    └── verify-clickhouse-migration.sh
```

## **Architecture**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Ingestion  │────▶│    Redis    │────▶│   Worker    │
│    (SDK)    │     │   Server    │     │   Queue     │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                    ┌──────────────────────────────────────────────┼───────┐
                    │                                              ▼       │
                    │  ┌─────────────┐     ┌─────────────┐   ┌──────────┐ │
                    │  │  Dashboard  │◀────│ Redis Pub/Sub│◀──│ClickHouse│ │
                    │  │    (SSE)    │     │ (live-events)│   │          │ │
                    │  └─────────────┘     └─────────────┘   └──────────┘ │
                    │                                                      │
                    └──────────────────────────────────────────────────────┘
```

**Data Flow:**
1. **SDK** sends events to the **Ingestion Server**
2. **Ingestion** validates and queues events in **Redis**
3. **Worker** processes the queue, stores in **ClickHouse**, and publishes to **Redis Pub/Sub**
4. **Dashboard** receives real-time updates via **Server-Sent Events (SSE)**

## **Tech Stack**

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Database:** PostgreSQL (Prisma ORM) + ClickHouse (analytics events)
- **Queue & Pub/Sub:** Redis (Upstash in production)
- **Real-time:** Server-Sent Events (SSE) via Next.js API routes
- **Auth:** Better Auth with GitHub/Google OAuth
- **Billing:** Polar.sh for subscriptions and payments
- **Email:** Resend with React Email templates
- **UI:** shadcn/ui components + Radix UI primitives
- **API:** tRPC for end-to-end type-safe APIs
- **Analytics Engine:** ClickHouse for high-performance event storage and queries
- **Geolocation:** Cloudflare headers (country, city, region, timezone, coordinates)
- **Monorepo:** Turborepo + pnpm workspaces
- **Documentation:** Fumadocs (Next.js-based docs framework)
- **Maps:** Mapbox GL JS for globe visualization

## **Manual Setup**

If you prefer manual setup or can't use Docker:

```bash
# 1. Clone the repository
git clone https://github.com/bklit/bklit.git
cd bklit

# 2. Install dependencies
pnpm install

# 3. Copy environment file
cp .env.example .env
# Edit .env with your database credentials

# 4. Start backend services (Docker + Ingestion + Worker)
pnpm dev:services

# 5. Start frontend apps (Dashboard, Playground, Website)
pnpm dev

# 6. Stop all services
pnpm dev:stop
```

**Development URLs:**
- Dashboard: http://localhost:3000
- Playground: http://localhost:5173
- Website: http://localhost:4000

## **What's Optional?**

**Core features** (work out of the box):
- Email authentication (magic links)
- Analytics tracking & dashboards
- Funnel builder
- Session tracking
- Geographic insights (list view)

**Optional features** (can enable later):
- OAuth (GitHub/Google) - for social login
- Billing (Polar.sh) - for paid plans
- Email sending (Resend) - for transactional emails
- Maps (Mapbox) - for map visualization
- Background jobs (Trigger.dev) - for scheduled tasks

Enable these by adding their API keys to `.env`.

## **Documentation**

📚 **[Full Documentation](https://docs.bklit.com)**

- **[Quick Start Guide](https://docs.bklit.com/getting-started/quick-start)** - Get up and running in minutes
- **[SDK Documentation](https://docs.bklit.com/sdk)** - Integrate Bklit into your app
- **[Dashboard Guide](https://docs.bklit.com/dashboard)** - Learn the dashboard features
- **[Local Development](https://docs.bklit.com/reference/local-development)** - Set up isolated dev environment
- **[Environment Variables](https://docs.bklit.com/reference/environment-variables)** - Configuration reference
- **[Playground](https://docs.bklit.com/playground)** - Test SDK integration
- **[Feature List](https://docs.bklit.com/features)** - Complete list of all features

## Repo activity

![Alt](https://repobeats.axiom.co/api/embed/967f6b8d93c20cd08f66a7c82048a635bcfa8733.svg "Repobeats analytics image")

### Contributing

- Please see our [Contributing Guide](https://docs.bklit.com/reference/contributing) for details.

### License

- MIT
