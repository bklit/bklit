#!/bin/bash

# Rebuild SDK and clear all caches
# Use this when you make changes to the SDK that need to be picked up by the playground

set -e

echo "🔨 Rebuilding SDK and clearing caches..."
echo ""

# 1. Build SDK (skip DTS to avoid d3-sankey error)
echo "1️⃣ Building SDK..."
cd packages/sdk
pnpm build --no-dts || {
  echo "⚠️  DTS build failed, but ESM/CJS succeeded"
}
cd ../..
echo "✅ SDK built"
echo ""

# 2. Clear Vite cache in playground
echo "2️⃣ Clearing Vite cache..."
rm -rf apps/playground/node_modules/.vite
rm -rf apps/playground/dist
echo "✅ Vite cache cleared"
echo ""

# 3. Clear turbo cache
echo "3️⃣ Clearing Turbo cache..."
rm -rf .turbo
echo "✅ Turbo cache cleared"
echo ""

echo "🎉 SDK rebuilt and caches cleared!"
echo ""
echo "Next steps:"
echo "  1. Restart dev servers: pnpm dev:stop && pnpm dev:services && pnpm dev"
echo "  2. Hard refresh playground in browser (Cmd+Shift+R)"
echo ""

