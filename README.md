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

**GitHub OAuth** (for authentication)

- `AUTH_GITHUB_ID` - Your GitHub OAuth App Client ID
- `AUTH_GITHUB_SECRET` - Your GitHub OAuth App Client Secret
- Create a GitHub OAuth App: [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)

**Better Auth**

- `AUTH_SECRET` - Generate a random secret for session encryption
- You can generate one with: `openssl rand -base64 32`
- Documentation: [Better Auth](https://www.better-auth.com/docs/installation)

**Polar** (for billing/subscriptions)

- `POLAR_ACCESS_TOKEN` - Your Polar API access token
- `POLAR_SERVER_MODE` - Either `sandbox` or `production`
- `POLAR_WEBHOOK_SECRET` - Your Polar webhook secret
- `POLAR_ORGANIZATION_ID` - Your Polar organization ID
- `POLAR_PRO_PRODUCT_ID` - Your Polar Pro product ID
- `POLAR_FREE_PRODUCT_ID` - (Optional) Your Polar Free product ID
- Set up Polar: [Polar Documentation](https://docs.polar.sh/)

**Resend** (for email)

- `RESEND_API_KEY` - Your Resend API key
- Get your API key: [Resend Documentation](https://resend.com/docs/introduction)

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

1. **Create an organization and project**
   - Navigate to `http://localhost:3000`
   - Sign in with GitHub
   - Create a new organization
   - Create a new project within that organization

2. **Generate an API key**
   - Go to your organization settings
   - Navigate to "API Tokens"
   - Create a new API token
   - Copy the generated token

3. **Configure the playground**

   Copy the playground env example:

   ```bash
   cp apps/playground/.env.example apps/playground/.env
   ```

   Update `apps/playground/.env` with:
   - `VITE_BKLIT_API_KEY` - Your API token from step 2

   Update `apps/playground/src/main.tsx`:
   - Replace `YOUR_PROJECT_ID` with your newly created project ID (found in the dashboard)

4. **Set up ngrok for local tracking**

   For the tracking API to work in a local environment, you'll need to use a tunnel like ngrok:

   ```bash
   # Install ngrok if you haven't already
   # https://ngrok.com/download

   # Start ngrok tunnel to your dashboard
   ngrok http 3000
   ```

   Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and add it to `apps/playground/.env`:

   ```
   VITE_NGROK_URL=https://abc123.ngrok.io
   ```

5. **Run the playground**

   ```bash
   cd apps/playground
   pnpm dev
   ```

   The playground will be available at `http://localhost:5173`

### Additional Scripts

- `pnpm typecheck` - Run TypeScript type checking across all packages
- `pnpm format-and-lint` - Check code formatting and linting
- `pnpm format-and-lint:fix` - Fix formatting and linting issues
- `pnpm build` - Build all packages for production

## Development

This is a monorepo managed with [Turborepo](https://turbo.build/repo) and [pnpm workspaces](https://pnpm.io/workspaces).

### Project Structure

- `apps/dashboard` - Main analytics dashboard
- `apps/playground` - Demo application showing SDK integration
- `apps/website` - Marketing website
- `packages/sdk` - Bklit tracking SDK
- `packages/api` - tRPC API routes
- `packages/auth` - Authentication package
- `packages/db` - Database schema and Prisma client
- `packages/email` - Email templates and client
- `packages/ui` - Shared UI components

## License

MIT
