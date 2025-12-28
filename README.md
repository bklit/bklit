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

### **Key Features:**

- Fast, real-time analytics powered by ClickHouse
- Privacy-first analytics
- Custom events and conversion funnels
- Session tracking and user journeys
- Multi-project and team management
- Built-in billing & subscriptions via Polar.sh

#### Prerequisites

- **Node.js 22.18.0+**
- **pnpm** (package manager)
- **PostgreSQL** database
- **ClickHouse** database (for analytics)

### Project Structure

This monorepo is managed with [Turborepo](https://turbo.build/repo) and [pnpm workspaces](https://pnpm.io/workspaces).

```
bklit/
├── apps/
│   ├── dashboard/          # Main analytics dashboard (Next.js 15)
│   ├── docs/               # Documentation site (Fumadocs)
│   ├── playground/         # Demo app for SDK testing (Vite + React)
│   └── website/            # Marketing website (Next.js 15)
│
└── packages/
    ├── analytics/          # ClickHouse analytics engine
    ├── api/                # tRPC API routes
    ├── auth/               # Better Auth + Polar integration
    ├── db/                 # Prisma ORM (PostgreSQL)
    ├── email/              # React Email templates
    ├── sdk/                # Analytics SDK (published to npm)
    ├── ui/                 # Shared UI components (shadcn/ui)
    ├── utils/              # Common utilities
    └── validators/         # Zod schemas for validation
```

### Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS v4
- **Database:** PostgreSQL (Prisma ORM) + ClickHouse (analytics events)
- **Auth:** Better Auth with GitHub/Google OAuth
- **Billing:** Polar.sh for subscriptions and payments
- **Email:** Resend with React Email templates
- **UI:** shadcn/ui components + Radix UI primitives
- **API:** tRPC for end-to-end type-safe APIs
- **Analytics Engine:** ClickHouse for high-performance event storage and queries
- **Background Jobs:** Trigger.dev for scheduled tasks and health checks
- **Monorepo:** Turborepo + pnpm workspaces
- **Documentation:** Fumadocs (Next.js-based docs framework)

### [Docs](https://docs.bklit.com)

- [Quick Start Guide](https://docs.bklit.com/getting-started/quick-start) - Get up and running in minutes
- [SDK Documentation](https://docs.bklit.com/sdk) - Integrate Bklit into your app
- [Dashboard Guide](https://docs.bklit.com/dashboard) - Learn the dashboard features
- [Local Development](https://docs.bklit.com/reference/local-development) - Set up isolated dev environment
- [Playground](https://docs.bklit.com/playground) - Test SDK integration

## Repo activity

![Alt](https://repobeats.axiom.co/api/embed/967f6b8d93c20cd08f66a7c82048a635bcfa8733.svg "Repobeats analytics image")

### Contributing

- Please see our [Contributing Guide](https://docs.bklit.com/reference/contributing) for details.

### License

- MIT
