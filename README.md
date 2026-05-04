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

- Real-time analytics with instant WebSocket-based live tracking
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
│   ├── redis/              # Redis client, queue, and pub/sub utilities
│   ├── sdk/                # Analytics SDK (published to npm)
│   ├── ui/                 # Shared UI components (shadcn/ui)
│   ├── utils/              # Common utilities
│   ├── validators/         # Zod schemas for validation
│   ├── websocket/          # WebSocket server (real-time tracking)
│   └── worker/             # Background worker (processes events → ClickHouse)
│
└── scripts/
    ├── backup-database.sh
    └── verify-clickhouse-migration.sh
```

## **Architecture**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │     │  WebSocket  │     │    Redis    │     │   Worker    │
│    (SDK)    │◀───▶│   Server    │────▶│    Queue    │────▶│             │
│             │     │ (bklit.ws)  │     │             │     │             │
└─────────────┘     └──────┬──────┘     └─────────────┘     └──────┬──────┘
                           │                                       │
                           │ Instant broadcast                     ▼
                           │                                ┌─────────────┐
                           │                                │ ClickHouse  │
                           │                                │             │
                           └───────────────────────────────▶└─────────────┘
                                          │
                                   ┌──────▼──────┐
                                   │  Dashboard  │
                                   │ (WebSocket) │
                                   └─────────────┘
```

**Data Flow:**
1. **SDK** connects to **WebSocket Server** (wss://bklit.ws) via persistent connection
2. **WebSocket** validates, enriches with geolocation, and queues events in **Redis**
3. **WebSocket** broadcasts events instantly to connected **Dashboards**
4. **Worker** processes the queue in batches and stores in **ClickHouse**
5. **Sessions end instantly** when browser tab closes (WebSocket disconnect detection)

## **Tech Stack**

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Database:** PostgreSQL (Prisma ORM) + ClickHouse (analytics events)
- **Queue:** Redis (Upstash in production)
- **Real-time:** WebSockets (wss://bklit.ws) for instant session tracking
- **Auth:** Better Auth with GitHub/Google OAuth
- **Billing:** Polar.sh for subscriptions and payments
- **Email:** Resend with React Email templates
- **UI:** shadcn/ui components + Radix UI primitives
- **API:** tRPC for end-to-end type-safe APIs
- **Analytics Engine:** ClickHouse for high-performance event storage and queries
- **Geolocation:** ip-api.com (country, city, coordinates, ISP, timezone)
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

# 4. Start backend services (Docker + WebSocket + Worker)
pnpm dev:services

# 5. Start frontend apps (Dashboard, Playground, Website)
pnpm dev

# 6. Stop all services and cleanup
pnpm dev:stop
```

**Development URLs:**
- Dashboard: http://localhost:3000
- Playground: http://localhost:5173
- Website: http://localhost:4000
- WebSocket: ws://localhost:8080

**Development Services (started by `pnpm dev:services`):**
- Docker (Redis + ClickHouse)
- WebSocket server (port 8080)
- Background worker (queue processor)
- Prisma Studio (optional database GUI)

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

## **Real-Time Analytics**

Bklit uses **WebSockets** for instant real-time analytics:

- **Sub-second latency:** Visitors appear on the map within 1 second
- **Instant session ending:** Sessions end immediately when tabs close (<1 second)
- **Live page tracking:** See which pages visitors are viewing in real-time
- **WebSocket architecture:** Industry-standard approach for instant real-time analytics

**Key Features:**
- Persistent WebSocket connections from SDK and Dashboard
- Automatic reconnection with exponential backoff
- Message queuing when connection is not ready
- No polling required - pure event-driven updates

**Infrastructure:**
- Production: `wss://bklit.ws` (Hetzner VPS with SSL/TLS)
- Development: `ws://localhost:8080`

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
