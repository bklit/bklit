#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load .env file from workspace root
const envPath = path.join(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// Use DEV_* variables if available, otherwise fall back to production variables
const CLICKHOUSE_HOST = process.env.DEV_CLICKHOUSE_HOST || process.env.CLICKHOUSE_HOST;
const CLICKHOUSE_USERNAME = process.env.DEV_CLICKHOUSE_USERNAME || process.env.CLICKHOUSE_USERNAME;
const CLICKHOUSE_PASSWORD = process.env.DEV_CLICKHOUSE_PASSWORD || process.env.CLICKHOUSE_PASSWORD;

// Validate required variables
if (!CLICKHOUSE_HOST || !CLICKHOUSE_USERNAME || !CLICKHOUSE_PASSWORD) {
  console.error('Error: Missing required ClickHouse configuration in .env file');
  console.error('Required: CLICKHOUSE_HOST, CLICKHOUSE_USERNAME, CLICKHOUSE_PASSWORD');
  console.error('Or their DEV_* equivalents for development');
  process.exit(1);
}

// Get the command and arguments passed after the script
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Error: No command specified');
  process.exit(1);
}

// Run the command with the modified environment
const result = spawnSync(args[0], args.slice(1), {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    CLICKHOUSE_HOST,
    CLICKHOUSE_USERNAME,
    CLICKHOUSE_PASSWORD,
  }
});

process.exit(result.status || 0);

