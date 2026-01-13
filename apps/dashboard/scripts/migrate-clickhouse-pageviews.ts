#!/usr/bin/env tsx

/**
 * ClickHouse Pageviews Migration Script
 * Adds metadata and campaign tracking columns to page_view_event table
 *
 * Cross-platform: Works on Windows, macOS, and Linux
 *
 * Usage:
 *   pnpm tsx scripts/migrate-clickhouse-pageviews.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from root .env
const envPaths = [
  resolve(__dirname, "../../../.env"),
  resolve(__dirname, "../../.env"),
  resolve(__dirname, "../.env"),
  resolve(__dirname, ".env"),
];

let envLoaded = false;
for (const path of envPaths) {
  const result = config({ path });
  if (!result.error) {
    console.log(`✓ Loaded environment from: ${path}\n`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn("⚠️  Warning: No .env file found\n");
}

const CLICKHOUSE_HOST = process.env.CLICKHOUSE_HOST;
const CLICKHOUSE_USER = process.env.CLICKHOUSE_USER || "default";
const CLICKHOUSE_PASSWORD = process.env.CLICKHOUSE_PASSWORD;

console.log("========================================");
console.log("ClickHouse Pageviews Migration");
console.log("========================================\n");

// Validate required environment variables
if (!CLICKHOUSE_HOST) {
  console.error("❌ Error: CLICKHOUSE_HOST environment variable is required");
  console.error("Please set it in your .env file");
  process.exit(1);
}

if (!CLICKHOUSE_PASSWORD) {
  console.error(
    "❌ Error: CLICKHOUSE_PASSWORD environment variable is required"
  );
  console.error("Please set it in your .env file");
  process.exit(1);
}

// Handle CLICKHOUSE_HOST - it might be a full URL or just hostname
let CLICKHOUSE_URL: string;
if (
  CLICKHOUSE_HOST.startsWith("http://") ||
  CLICKHOUSE_HOST.startsWith("https://")
) {
  CLICKHOUSE_URL = CLICKHOUSE_HOST;
} else {
  const port = process.env.CLICKHOUSE_PORT || "8123";
  CLICKHOUSE_URL = `http://${CLICKHOUSE_HOST}:${port}`;
}

console.log("Configuration:");
console.log(`  Host: ${CLICKHOUSE_HOST}`);
console.log(`  User: ${CLICKHOUSE_USER}`);
console.log(`  URL: ${CLICKHOUSE_URL}\n`);

// Helper function to make ClickHouse requests
async function clickhouseRequest(
  query: string
): Promise<{ ok: boolean; status: number; text: string }> {
  const auth = Buffer.from(
    `${CLICKHOUSE_USER}:${CLICKHOUSE_PASSWORD}`
  ).toString("base64");

  const response = await fetch(CLICKHOUSE_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "text/plain",
    },
    body: query,
  });

  const text = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    text,
  };
}

async function main() {
  try {
    // Test connection
    console.log("Testing connection...");
    const pingResponse = await fetch(`${CLICKHOUSE_URL}/ping`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${CLICKHOUSE_USER}:${CLICKHOUSE_PASSWORD}`).toString("base64")}`,
      },
    });

    if (!pingResponse.ok) {
      console.error(
        `❌ Failed to connect to ClickHouse (HTTP ${pingResponse.status})`
      );
      console.error(
        "Please check your credentials and ensure ClickHouse is running"
      );
      process.exit(1);
    }

    console.log("✓ Connection successful\n");

    // Execute migration
    console.log("Adding columns to page_view_event table...\n");

    const migrationSQL = `
ALTER TABLE page_view_event
  ADD COLUMN IF NOT EXISTS title Nullable(String),
  ADD COLUMN IF NOT EXISTS description Nullable(String),
  ADD COLUMN IF NOT EXISTS og_image Nullable(String),
  ADD COLUMN IF NOT EXISTS og_title Nullable(String),
  ADD COLUMN IF NOT EXISTS favicon Nullable(String),
  ADD COLUMN IF NOT EXISTS canonical_url Nullable(String),
  ADD COLUMN IF NOT EXISTS language Nullable(String),
  ADD COLUMN IF NOT EXISTS robots Nullable(String),
  ADD COLUMN IF NOT EXISTS referrer_hostname Nullable(String),
  ADD COLUMN IF NOT EXISTS referrer_path Nullable(String),
  ADD COLUMN IF NOT EXISTS referrer_type Nullable(String),
  ADD COLUMN IF NOT EXISTS utm_id Nullable(String),
  ADD COLUMN IF NOT EXISTS gclid Nullable(String),
  ADD COLUMN IF NOT EXISTS fbclid Nullable(String),
  ADD COLUMN IF NOT EXISTS msclkid Nullable(String),
  ADD COLUMN IF NOT EXISTS ttclid Nullable(String),
  ADD COLUMN IF NOT EXISTS li_fat_id Nullable(String),
  ADD COLUMN IF NOT EXISTS twclid Nullable(String),
  ADD COLUMN IF NOT EXISTS is_new_visitor Bool DEFAULT false,
  ADD COLUMN IF NOT EXISTS landing_page Nullable(String);
`;

    const migrationResponse = await clickhouseRequest(migrationSQL);

    if (!migrationResponse.ok) {
      console.error(`❌ Migration failed (HTTP ${migrationResponse.status})`);
      if (migrationResponse.text) {
        console.error(`Error: ${migrationResponse.text}`);
      }
      process.exit(1);
    }

    console.log("✓ Migration executed successfully\n");

    // Verify columns were added
    console.log("Verifying new columns...\n");

    const describeResponse = await clickhouseRequest(
      "DESCRIBE TABLE page_view_event"
    );

    if (!describeResponse.ok) {
      console.error("❌ Verification failed - could not describe table");
      process.exit(1);
    }

    const tableSchema = describeResponse.text;
    const newColumns = [
      "title",
      "description",
      "og_image",
      "og_title",
      "favicon",
      "canonical_url",
      "language",
      "robots",
      "referrer_hostname",
      "referrer_path",
      "referrer_type",
      "utm_id",
      "gclid",
      "fbclid",
      "msclkid",
      "ttclid",
      "li_fat_id",
      "twclid",
      "is_new_visitor",
      "landing_page",
    ];

    const allColumnsPresent = newColumns.every((col) =>
      tableSchema.includes(col)
    );

    if (!allColumnsPresent) {
      console.error("❌ Verification failed - some columns may be missing");
      console.log("\nFull table structure:");
      console.log(tableSchema);
      process.exit(1);
    }

    console.log("✓ Verification successful - all columns added\n");
    console.log("New columns:");

    // Parse and display new columns
    const lines = tableSchema.split("\n");
    for (const col of newColumns) {
      const line = lines.find((l) => l.startsWith(col));
      if (line) {
        const parts = line.split("\t");
        console.log(`  - ${parts[0]} (${parts[1]})`);
      }
    }

    console.log("\n========================================");
    console.log("Migration completed successfully! 🎉");
    console.log("========================================\n");
    console.log("Next steps:");
    console.log("  1. Deploy updated tracker script");
    console.log("  2. Deploy updated API and services");
    console.log("  3. Test with a pageview\n");
  } catch (error) {
    console.error("\n❌ Migration failed with error:");
    console.error(error);
    process.exit(1);
  }
}

main();
