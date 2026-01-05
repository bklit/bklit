import fs from "node:fs/promises";
import chalk from "chalk";

interface EnvConfig {
  secrets: Record<string, string>;
  databases: {
    postgresUrl: string;
    clickhouseUrl: string;
  };
  oauth?: {
    githubClientId?: string;
    githubClientSecret?: string;
    googleClientId?: string;
    googleClientSecret?: string;
  };
  billing?: {
    polarAccessToken?: string;
    polarOrganizationId?: string;
  };
  email?: {
    resendApiKey?: string;
  };
}

export async function generateEnvFile(config: EnvConfig): Promise<void> {
  const envContent = `
# Database
DATABASE_URL="${config.databases.postgresUrl}"
DEV_DATABASE_URL="${config.databases.postgresUrl}"

# ClickHouse Analytics
CLICKHOUSE_HOST="${config.databases.clickhouseUrl}"
CLICKHOUSE_USERNAME="default"
CLICKHOUSE_PASSWORD=""
DEV_CLICKHOUSE_HOST="${config.databases.clickhouseUrl}"
DEV_CLICKHOUSE_USERNAME="default"
DEV_CLICKHOUSE_PASSWORD=""

# Auth - Auto-generated
AUTH_SECRET="${config.secrets.AUTH_SECRET}"

# OAuth (Optional)
${config.oauth?.githubClientId ? `AUTH_GITHUB_ID="${config.oauth.githubClientId}"` : "# AUTH_GITHUB_ID=your_github_client_id"}
${config.oauth?.githubClientSecret ? `AUTH_GITHUB_SECRET="${config.oauth.githubClientSecret}"` : "# AUTH_GITHUB_SECRET=your_github_client_secret"}
${config.oauth?.googleClientId ? `AUTH_GOOGLE_ID="${config.oauth.googleClientId}"` : "# AUTH_GOOGLE_ID=your_google_client_id"}
${config.oauth?.googleClientSecret ? `AUTH_GOOGLE_SECRET="${config.oauth.googleClientSecret}"` : "# AUTH_GOOGLE_SECRET=your_google_client_secret"}

# Billing - Polar.sh (Optional)
${config.billing?.polarAccessToken ? `POLAR_ACCESS_TOKEN="${config.billing.polarAccessToken}"` : "# POLAR_ACCESS_TOKEN=your_polar_token"}
${config.billing?.polarOrganizationId ? `POLAR_ORGANIZATION_ID="${config.billing.polarOrganizationId}"` : "# POLAR_ORGANIZATION_ID=your_org_id"}
POLAR_SERVER_MODE="sandbox"
POLAR_WEBHOOK_SECRET="${config.secrets.POLAR_WEBHOOK_SECRET}"

# Email - Resend (Optional)
${config.email?.resendApiKey ? `RESEND_API_KEY="${config.email.resendApiKey}"` : "# RESEND_API_KEY=your_resend_key"}

# Health Monitoring
HEALTH_CHECK_SECRET="${config.secrets.HEALTH_CHECK_SECRET}"
# ALERT_EMAIL=your@email.com

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Environment
NODE_ENV="development"

# Maps (Optional - for geographic visualization)
# Get free token at: https://www.mapbox.com/
# NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Background Jobs - Trigger.dev (Optional)
# TRIGGER_SECRET_KEY=your_trigger_secret
# TRIGGER_API_KEY=your_trigger_api_key
# TRIGGER_API_URL=https://api.trigger.dev
`.trim();

  await fs.writeFile(".env", envContent);
  console.log(chalk.green("\n✓ Created .env file"));
}
