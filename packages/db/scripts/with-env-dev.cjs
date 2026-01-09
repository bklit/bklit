#!/usr/bin/env node
"use strict";
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

// Load .env file from workspace root
const envPath = path.join(__dirname, "../../../.env");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
}

// Use DEV_DATABASE_URL if available, otherwise fall back to DATABASE_URL
const DATABASE_URL = process.env.DEV_DATABASE_URL ?? process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error(
    "Error: Neither DEV_DATABASE_URL nor DATABASE_URL is set in .env file"
  );
  process.exit(1);
}

// Get the command and arguments passed after the script
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Error: No command specified");
  process.exit(1);
}

// Run the command with the modified environment
const result = spawnSync(args[0], args.slice(1), {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    DATABASE_URL,
  },
});

process.exit(result.status || 0);
