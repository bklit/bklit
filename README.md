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

## **Prerequisites**

- **Node.js 22.14.0+**
- **pnpm 9.6.0+**
- **PostgreSQL** database
- **ClickHouse** database (for analytics)

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
│   ├── analytics/          # ClickHouse analytics engine
│   ├── api/                # tRPC API routes
│   ├── auth/               # Better Auth + Polar integration
│   ├── db/                 # Prisma ORM (PostgreSQL)
│   ├── email/              # React Email templates
│   ├── extensions/         # Extension system (Discord, etc.)
│   ├── sdk/                # Analytics SDK (published to npm)
│   ├── ui/                 # Shared UI components (shadcn/ui)
│   ├── utils/              # Common utilities
│   └── validators/         # Zod schemas for validation
│
└── scripts/
    ├── backup-database.sh
    └── verify-clickhouse-migration.sh
```

## **Tech Stack**

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Database:** PostgreSQL (Prisma ORM) + ClickHouse (analytics events)
- **Auth:** Better Auth with GitHub/Google OAuth
- **Billing:** Polar.sh for subscriptions and payments
- **Email:** Resend with React Email templates
- **UI:** shadcn/ui components + Radix UI primitives
- **API:** tRPC for end-to-end type-safe APIs
- **Analytics Engine:** ClickHouse for high-performance event storage and queries
- **Geolocation:** Cloudflare headers (country, city, region, timezone, coordinates)
- **Background Jobs:** Trigger.dev v4 for scheduled tasks and health checks
- **Monorepo:** Turborepo + pnpm workspaces (pnpm 10.11.1)
- **Documentation:** Fumadocs (Next.js-based docs framework)
- **Maps:** Nivo Geo, D3, ReactFlow for visualizations

## **Documentation**

📚 **[Full Documentation](https://docs.bklit.com)**

- **[Quick Start Guide](https://docs.bklit.com/getting-started/quick-start)** - Get up and running in minutes
- **[SDK Documentation](https://docs.bklit.com/sdk)** - Integrate Bklit into your app
- **[Dashboard Guide](https://docs.bklit.com/dashboard)** - Learn the dashboard features
- **[Local Development](https://docs.bklit.com/reference/local-development)** - Set up isolated dev environment
- **[Playground](https://docs.bklit.com/playground)** - Test SDK integration
- **[Feature List](https://docs.bklit.com/features)** - Complete list of all features

## Repo activity

![Alt](https://repobeats.axiom.co/api/embed/967f6b8d93c20cd08f66a7c82048a635bcfa8733.svg "Repobeats analytics image")

### Contributing

- Please see our [Contributing Guide](https://docs.bklit.com/reference/contributing) for details.

### License

- MIT
