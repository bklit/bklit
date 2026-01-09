#!/usr/bin/env node

/**
 * Cursor pre-commit hook for Ultracite
 * Auto-formats and lints staged files before committing
 */

import { execSync } from "node:child_process";
import process from "node:process";

try {
  console.log("🔍 Running Ultracite checks...");
  
  // Run Ultracite fix on all files
  execSync("pnpm ultracite fix", {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  
  console.log("✅ Ultracite checks passed!");
  process.exit(0);
} catch (error) {
  console.error("❌ Ultracite checks failed!");
  console.error(error.message);
  process.exit(1);
}

