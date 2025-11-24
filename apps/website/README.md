# Web App - Quick Start

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Run Prisma migrations**

   ```bash
   pnpm prisma:migrate:web
   ```

3. **Generate Prisma client**

   ```bash
   pnpm prisma:generate:web
   ```

4. **Build the SDK**

   ```bash
   pnpm build:sdk
   ```

5. **Start the web app**

   ```bash
   pnpm dev:web
   ```

6. **Start Cloudflared tunnel** (optional, in a separate terminal for remote testing)

   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

   Copy the tunnel URL and update your `.env` file:
   - Set `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the tunnel URL (e.g., `https://abc123.trycloudflare.com`)

7. **Start the playground** (in another terminal)
   ```bash
   pnpm dev:playground
   ```
