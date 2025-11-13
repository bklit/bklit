![hero](https://repository-images.githubusercontent.com/985341745/de876cb4-a2d4-449f-9e71-38d9910e626e)

<p align="center">
	<h1 align="center"><b>Bklit</b></h1>
<p align="center">
    Run your business smarter
    <br />
    <br />
    <a href="https://x.com/bklitai">X</a>
    ·
    <a href="https://discord.gg/GFfD67gZGf">Discord</a>
    ·
    <a href="https://bklit.com">Website</a>
    ·
    <a href="https://github.com/bklit/bklit/issues">Issues</a>
  </p>
</p>

### Prerequisites

- **Node 22.18.0** or higher
- pnpm

If you need to install or switch Node versions, we recommend using [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install 22.18.0
nvm use 22.18.0
```

### Installation

1. **Install dependencies**

```bash
pnpm i
```

2. **Set up your environment variables**

Copy the `.env.example` file to `.env` in the root directory and fill in the required values:

```bash
cp .env.example .env
```

#### Required Environment Variables

You'll need to obtain the following credentials:

**Database**

- `DATABASE_URL` - Your PostgreSQL database connection string

**Application URLs**

- `AUTH_URL` - Your dashboard URL (e.g., `http://localhost:3000` for local, `https://app.bklit.com` for production)
- `NEXT_PUBLIC_APP_URL` - Same as AUTH_URL (used by client-side code)

**GitHub OAuth** (authentication)

- `AUTH_GITHUB_ID` - Your GitHub OAuth App Client ID
- `AUTH_GITHUB_SECRET` - Your GitHub OAuth App Client Secret
- Create a GitHub OAuth App: [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
- **Callback URL:** `http://localhost:3000/api/auth/callback/github` (for local development)

**Google OAuth** (optional, authentication)

- `AUTH_GOOGLE_ID` - Your Google OAuth Client ID
- `AUTH_GOOGLE_SECRET` - Your Google OAuth Client Secret
- Create Google Credentials in the [Google Cloud Console](https://console.cloud.google.com/apis/dashboard). Refer to the [Better-Auth guide](https://www.better-auth.com/docs/authentication/google) for more help.
- **Callback URL:** `http://localhost:3000/api/auth/callback/google` (for local development)

**Better Auth**

- `AUTH_SECRET` - Generate a random secret for session encryption
- You can generate one with: `openssl rand -base64 32`
- Documentation: [Better Auth](https://www.better-auth.com/docs/installation)

**Polar** (for billing/subscriptions)

- `POLAR_ACCESS_TOKEN` - Your Polar API access token
- `POLAR_SERVER_MODE` - Either `sandbox` or `production`
- `POLAR_WEBHOOK_SECRET` - Your Polar webhook secret
- `POLAR_ORGANIZATION_ID` - Your Polar organization ID
- `POLAR_PRO_PRODUCT_ID` - Your Polar Pro product ID (**Required** - server-side)
- `NEXT_PUBLIC_POLAR_PRO_PLAN_PRODUCT_ID` - Your Polar Pro product ID (client-side)
- Set up Polar: [Polar Documentation](https://docs.polar.sh/)

**Resend** (for email)

- `RESEND_API_KEY` - Your Resend API key
- Get your API key: [Resend Documentation](https://resend.com/docs/introduction)

**API Health Monitoring**

- `ALERT_EMAIL` - Email address to receive API health alerts when endpoints are down
- Required for the health check monitoring system to send email notifications
- **Note:** For Trigger.dev cloud execution, also set this in your Trigger.dev dashboard environment variables

**Optional**

- `BKLIT_WEBSITE_URL` - Your marketing website URL (used for email template images)
- `BKLIT_DEFAULT_PROJECT` - Auto-invite new users to this project's organization
- `NODE_ENV` - Node environment (`development`, `production`, `test`)

3. **Set up the database**

Run Prisma migrations to set up your database schema:

```bash
pnpm db:migrate
```

(Optional) Open Prisma Studio to view your database:

```bash
pnpm db:studio
```

### Running the Application

From the root directory, you can run the following commands in separate terminals:

```bash
# Start the main dashboard application
pnpm dev

# Or run the dashboard specifically
cd apps/dashboard
pnpm dev
```

The dashboard will be available at `http://localhost:3000`

### Setting Up the Playground (Demo App)

The playground is a demo application that shows how to integrate the Bklit SDK.

1. **Create an organization and project in your dashboard**
   - Navigate to `http://localhost:3000`
   - Sign in with GitHub or Google
   - Create a new organization
   - Create a new project within that organization

2. **Generate an API key in your dashboard**
   - Go to your organization settings
   - Navigate to "API Tokens"
   - Create a new API token scoped to your project
   - Copy the generated token (you won't see it again!)

3. **Configure the playground**

   Create the playground environment file:

   ```bash
   cd apps/playground
   cp .env.example .env
   ```

   Update `apps/playground/.env` with:

   ```bash
   VITE_BKLIT_PROJECT_ID="your-project-id"  # From dashboard
   VITE_BKLIT_API_KEY="your-api-token"     # From step 2
   # VITE_NGROK_URL is optional - leave blank to use localhost:3000
   ```

4. **Run the playground**

   ```bash
   # Make sure your dashboard is running in another terminal
   pnpm -F @bklit/dashboard dev

   # Then start the playground
   pnpm -F @bklit/playground dev
   ```

   The playground will be available at `http://localhost:5173`

   You should see tracking events in your dashboard's analytics immediately!

#### Optional: Using ngrok for Remote Testing

If you need to test from external devices or share your local instance:

```bash
# Start ngrok tunnel to your dashboard
ngrok http 3000

# Update playground .env with the ngrok URL
VITE_NGROK_URL=https://abc123.ngrok-free.app
```

**Note:** For local development between `localhost:5173` (playground) and `localhost:3000` (dashboard), ngrok is **not required** thanks to CORS configuration.

### Additional Scripts

- `pnpm typecheck` - Run TypeScript type checking across all packages
- `pnpm format-and-lint` - Check code formatting and linting
- `pnpm format-and-lint:fix` - Fix formatting and linting issues
- `pnpm build` - Build all packages for production
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Prisma Studio

## Production Deployment

### Environment Variables for Production

When deploying to production (e.g., Vercel), update these environment variables:

**Required Updates:**

```bash
# Application URLs - MUST be production URLs
AUTH_URL="https://app.bklit.com"
NEXT_PUBLIC_APP_URL="https://app.bklit.com"

# OAuth Callbacks - Add production URLs to your OAuth apps
# GitHub: https://app.bklit.com/api/auth/callback/github
# Google: https://app.bklit.com/api/auth/callback/google

# Polar - Switch to production mode
POLAR_SERVER_MODE="production"
POLAR_PRO_PRODUCT_ID="your-production-product-id"
NEXT_PUBLIC_POLAR_PRO_PLAN_PRODUCT_ID="your-production-product-id"

# Database - Production database connection
DATABASE_URL="your-production-database-url"
```

**Keep the same:**

- `AUTH_SECRET`
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- `POLAR_ACCESS_TOKEN`
- `POLAR_WEBHOOK_SECRET`
- `POLAR_ORGANIZATION_ID`
- `RESEND_API_KEY`
- `ALERT_EMAIL`

### Vercel Deployment

1. **Push your code to GitHub**

2. **Import project to Vercel**
   - Connect to your GitHub repository
   - Vercel will auto-detect the Next.js apps

3. **Configure Build Settings**
   - **Dashboard:** `apps/dashboard`
   - **Website:** `apps/website`
   - Build command: `pnpm build` (auto-detected)
   - Install command: `pnpm install`

4. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required production environment variables from above

5. **Deploy!**
   - Click "Deploy" and Vercel will build and deploy your apps

### Custom Domains

- **Dashboard:** `app.bklit.com`
- **Website:** `bklit.com`

Add these in Vercel Project Settings → Domains

## Development

This is a monorepo managed with [Turborepo](https://turbo.build/repo) and [pnpm workspaces](https://pnpm.io/workspaces).

### Project Structure

```
bklit/
├── apps/
│   ├── dashboard/          # Main analytics dashboard (Next.js)
│   ├── playground/         # Demo app for SDK testing (Vite)
│   └── website/            # Marketing website (Next.js)
│
└── packages/
    ├── api/                # tRPC API routes
    ├── auth/               # Better Auth + Polar integration
    ├── db/                 # Prisma database layer
    ├── email/              # React Email templates
    ├── sdk/                # Analytics SDK (published)
    ├── ui/                 # Shared UI components (shadcn/ui)
    ├── utils/              # Common utilities
    └── validators/         # Zod schemas
```

### Key Technologies

- **Framework:** Next.js 15 (App Router), React 19
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** Better Auth with GitHub/Google OAuth
- **Billing:** Polar.sh
- **Email:** Resend with React Email
- **UI:** shadcn/ui with Tailwind CSS v4
- **API:** tRPC for type-safe APIs
- **Monorepo:** Turborepo + pnpm workspaces

## License

MIT
