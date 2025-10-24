# Bklit - Analytics

Open source analytics platform for modern web apps.

## Overview

Bklit is a comprehensive, privacy-focused web analytics platform built for modern applications. It provides real-time page view tracking, custom event tracking, session analytics, and geographic insights - all with a clean, developer-friendly SDK and powerful dashboard.

## Features

### 📊 Core Analytics
- **Page View Tracking**: Automatic tracking of page views with session persistence
- **Custom Event Tracking**: Track clicks, views, hovers, and custom events on any element
- **Session Analytics**: Detailed session tracking with entry/exit pages, duration, and bounce rates
- **Geographic Data**: IP-based geolocation with city, country, region, timezone, and ISP information
- **Device Detection**: Automatic mobile device detection from user agents

### 🎯 Event Tracking
- **Automatic Event Tracking**: Track events using `data-bklit-event` attributes or `bklit-event-*` IDs
- **Manual Event Tracking**: Programmatically track events with custom metadata
- **Event Definitions**: Create and manage event definitions in the dashboard
- **Event Types**: Built-in support for click, view, and hover events
- **Conversion Tracking**: Calculate conversion rates based on event definitions

### 🚀 Developer Experience
- **Lightweight SDK**: Zero-dependency JavaScript SDK for browser environments
- **SPA Support**: Automatic tracking for single-page applications (React, Vue, etc.)
- **TypeScript Support**: Full TypeScript types included
- **Debug Mode**: Built-in debug logging for development
- **CORS Support**: Works across all domains with proper CORS configuration

### 🏢 Multi-tenancy
- **Organizations**: Manage multiple organizations with team members
- **Projects**: Create multiple projects per organization
- **Role-Based Access**: Member and admin roles for organization management
- **Invitations**: Invite team members via email with expiring tokens

### 🔐 Authentication
- **Better Auth Integration**: Modern authentication powered by Better Auth
- **GitHub OAuth**: Sign in with GitHub
- **Polar Integration**: Built-in support for Polar.sh for monetization
- **Session Management**: Secure session handling with token-based authentication

## Architecture

### Monorepo Structure

Bklit is built as a pnpm monorepo using Turborepo:

```
bklit/
├── apps/
│   ├── dashboard/          # Next.js dashboard application
│   ├── playground/         # Vite playground for SDK testing
│   └── website/            # Marketing website (Next.js)
├── packages/
│   ├── sdk/                # Browser SDK for tracking
│   ├── api/                # tRPC API routes
│   ├── auth/               # Authentication logic (Better Auth)
│   ├── db/                 # Prisma database schema and client
│   ├── ui/                 # Shared UI components
│   ├── utils/              # Shared utilities
│   └── validators/         # Zod validation schemas
└── tooling/
    └── tsconfig/           # Shared TypeScript configurations
```

### Technology Stack

**Frontend:**
- Next.js 15 with React 19
- TailwindCSS 4 for styling
- tRPC for type-safe API calls
- TanStack Query for data fetching
- Recharts & D3.js for data visualization
- React Flow for flow diagrams

**Backend:**
- Next.js API Routes
- tRPC for API layer
- Prisma ORM with PostgreSQL
- Better Auth for authentication
- IP geolocation services

**Infrastructure:**
- Turborepo for monorepo management
- pnpm for package management
- Biome for linting and formatting
- TypeScript throughout

## Installation

### Prerequisites

- Node.js >= 22.14.0
- pnpm >= 9.6.0
- PostgreSQL database

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bklit.git
cd bklit
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bklit"

# Authentication
AUTH_SECRET="your-secret-key"
AUTH_GITHUB_ID="your-github-oauth-id"
AUTH_GITHUB_SECRET="your-github-oauth-secret"

# Polar (optional - for monetization)
POLAR_SERVER_MODE="sandbox" # or "production"
POLAR_ACCESS_TOKEN="your-polar-token"
POLAR_WEBHOOK_SECRET="your-webhook-secret"
POLAR_ORGANIZATION_ID="your-org-id"

# Development (optional)
VITE_NGROK_URL="https://your-ngrok-url.ngrok.io"
```

4. Generate Prisma client and run migrations:
```bash
pnpm db:generate
pnpm db:migrate
```

5. Start development servers:
```bash
# Start all apps
pnpm dev

# Or start specific apps
pnpm dev:web          # Dashboard only
```

## SDK Usage

### Installation

```bash
npm install @bklit/sdk
# or
yarn add @bklit/sdk
# or
pnpm add @bklit/sdk
```

### Basic Setup

```javascript
import { initBklit } from '@bklit/sdk';

// Initialize the SDK
initBklit({
  projectId: 'your-project-id',          // Required
  apiHost: 'https://your-api.com/api/track',  // Optional
  environment: 'production',              // Optional: 'development' | 'production'
  debug: false                           // Optional: Enable debug logging
});
```

### Automatic Event Tracking

Track events automatically using data attributes or IDs:

```html
<!-- Using data attribute -->
<button data-bklit-event="signup-button">
  Sign Up
</button>

<!-- Using ID -->
<button id="bklit-event-cta-click">
  Click Me
</button>
```

The SDK automatically tracks:
- **Click events**: When the element is clicked
- **View events**: When the element becomes visible (50% threshold)
- **Hover events**: When the mouse hovers for 500ms

### Manual Event Tracking

```javascript
import { trackEvent } from '@bklit/sdk';

// Track a custom event
trackEvent(
  'purchase-completed',           // trackingId
  'conversion',                   // eventType
  {                              // metadata (optional)
    value: 99.99,
    currency: 'USD',
    productId: 'prod_123'
  },
  'manual'                       // triggerMethod
);
```

### Manual Page View Tracking

```javascript
import { trackPageView } from '@bklit/sdk';

// Manually track a page view
trackPageView();
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectId` | string | *required* | Your Bklit project ID from the dashboard |
| `apiHost` | string | `https://bklit.com/api/track` | Custom API endpoint URL |
| `environment` | 'development' \| 'production' | 'production' | Environment mode |
| `debug` | boolean | false | Enable debug logging to console |

### Environment Variables

The SDK supports these environment variables (build-time only):

- `BKLIT_API_HOST`: Override the default API host
- `BKLIT_ENVIRONMENT`: Set environment ('development' or 'production')
- `BKLIT_DEBUG`: Enable debug mode ('true' or 'false')

## API Endpoints

### Public Endpoints

#### Track Page View
```
POST /api/track
Content-Type: application/json

{
  "url": "https://example.com/page",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "projectId": "your-project-id",
  "userAgent": "Mozilla/5.0...",
  "sessionId": "timestamp-random",
  "referrer": "https://google.com"
}
```

#### Track Event
```
POST /api/track-event
Content-Type: application/json

{
  "trackingId": "button-click",
  "eventType": "click",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "projectId": "your-project-id",
  "sessionId": "timestamp-random",
  "metadata": {
    "triggerMethod": "automatic"
  }
}
```

#### End Session
```
POST /api/track/session-end
Content-Type: application/json

{
  "sessionId": "timestamp-random",
  "projectId": "your-project-id"
}
```

### Protected API (tRPC)

The dashboard uses tRPC for type-safe API communication. Main routers:

- **auth**: User authentication and session management
- **project**: Project CRUD operations and listing
- **organization**: Organization management, members, and invitations
- **event**: Event definition management, tracking data, and analytics
- **session**: Session analytics and detailed session views

## Database Schema

### Core Models

- **User**: User accounts with email authentication
- **Session**: Authentication sessions
- **Account**: OAuth provider accounts
- **Organization**: Multi-tenant organizations
- **Member**: Organization membership with roles
- **Invitation**: Email invitations with expiry
- **Project**: Analytics projects
- **PageViewEvent**: Individual page view records with geolocation
- **TrackedSession**: User session data with bounce tracking
- **EventDefinition**: Event tracking definitions
- **TrackedEvent**: Individual tracked events

### Key Relationships

- Organizations have many Projects and Members
- Projects have many PageViewEvents, TrackedSessions, and EventDefinitions
- TrackedSessions have many PageViewEvents and TrackedEvents
- EventDefinitions have many TrackedEvents

## Development

### Available Scripts

```bash
# Development
pnpm dev                    # Start all apps in dev mode
pnpm dev:web               # Start dashboard only

# Building
pnpm build                 # Build all apps

# Database
pnpm db:generate           # Generate Prisma client
pnpm db:migrate           # Run database migrations
pnpm db:studio            # Open Prisma Studio

# Authentication
pnpm auth:generate        # Generate auth schema

# Code Quality
pnpm format-and-lint      # Check formatting and linting
pnpm format-and-lint:fix  # Fix formatting and linting issues
pnpm typecheck            # Run TypeScript type checking

# Cleanup
pnpm clean                # Clean node_modules
pnpm clean:workspaces     # Clean all workspace build artifacts
```

### Project Commands

```bash
# Dashboard
cd apps/dashboard
pnpm dev                  # Start dashboard dev server
pnpm build               # Build for production

# SDK
cd packages/sdk
pnpm dev                 # Watch mode for SDK development
pnpm build              # Build SDK package

# Playground
cd apps/playground
pnpm dev                # Start playground for testing SDK
```

## Dashboard Features

The Bklit dashboard provides a comprehensive interface for analytics:

- **Real-time Analytics**: Live user tracking and current visitors
- **Project Overview**: Summary of page views, sessions, and top pages
- **Event Analytics**: View event performance, conversion rates, and time-series data
- **Session Details**: Drill down into individual user sessions
- **Geographic Visualization**: Maps and charts showing user locations
- **Event Management**: Create, update, and delete event definitions
- **Project Settings**: Configure projects and domains
- **Organization Management**: Invite team members and manage roles
- **Billing Integration**: Polar.sh integration for subscription management

## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0) license.

You are free to:
- Share — copy and redistribute the material
- Adapt — remix, transform, and build upon the material

Under the following terms:
- **Attribution** — You must give appropriate credit
- **NonCommercial** — You may not use the material for commercial purposes

See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, questions, or contributions, please open an issue on GitHub.
