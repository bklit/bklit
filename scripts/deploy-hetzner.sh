#!/bin/bash

# Deploy WebSocket server and Worker to Hetzner
# Run this ON your Hetzner server

set -e

echo "🚀 Deploying Bklit WebSocket + Worker to Hetzner..."
echo ""

# Configuration
PROJECT_DIR="/opt/bklit"
BRANCH="feat/ipapi-first-cloudflare-second"
NODE_VERSION="22"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run as root (sudo)"
  exit 1
fi

echo "1️⃣ Installing Node.js ${NODE_VERSION}..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y nodejs
  echo "   ✅ Node.js installed"
else
  echo "   ✅ Node.js already installed ($(node --version))"
fi

echo ""
echo "2️⃣ Installing pnpm..."
if ! command -v pnpm &> /dev/null; then
  npm install -g pnpm
  echo "   ✅ pnpm installed"
else
  echo "   ✅ pnpm already installed ($(pnpm --version))"
fi

echo ""
echo "3️⃣ Installing PM2..."
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
  echo "   ✅ PM2 installed"
else
  echo "   ✅ PM2 already installed"
fi

echo ""
echo "4️⃣ Installing tsx globally..."
if ! command -v tsx &> /dev/null; then
  npm install -g tsx
  echo "   ✅ tsx installed"
else
  echo "   ✅ tsx already installed"
fi

echo ""
echo "5️⃣ Cloning/Updating repository..."
if [ -d "$PROJECT_DIR" ]; then
  echo "   Repository exists, pulling latest..."
  cd $PROJECT_DIR
  git fetch
  git checkout $BRANCH
  git pull origin $BRANCH
else
  echo "   Cloning repository..."
  mkdir -p /opt
  cd /opt
  git clone https://github.com/yourusername/bklit.git
  cd bklit
  git checkout $BRANCH
fi

echo "   ✅ Repository ready at $PROJECT_DIR"

echo ""
echo "6️⃣ Installing dependencies..."
cd $PROJECT_DIR
pnpm install --frozen-lockfile
echo "   ✅ Dependencies installed"

echo ""
echo "7️⃣ Setting up environment..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
  echo "   ❌ .env file not found!"
  echo "   Please create $PROJECT_DIR/.env with required variables:"
  echo ""
  echo "   DATABASE_URL=postgresql://..."
  echo "   REDIS_URL=redis://..."
  echo "   CLICKHOUSE_HOST=http://localhost:8123"
  echo "   CLICKHOUSE_USER=default"
  echo "   CLICKHOUSE_PASSWORD=..."
  echo "   CLICKHOUSE_DATABASE=analytics"
  echo "   WEBSOCKET_PORT=8080"
  echo "   NODE_ENV=production"
  echo ""
  exit 1
else
  echo "   ✅ .env file exists"
fi

echo ""
echo "8️⃣ Configuring firewall (UFW)..."
ufw allow 8080/tcp
ufw allow 22/tcp
echo "   ✅ Firewall configured"

echo ""
echo "9️⃣ Starting services with PM2..."

# Stop existing services if running
pm2 delete bklit-websocket 2>/dev/null || true
pm2 delete bklit-worker 2>/dev/null || true

# Start WebSocket server
pm2 start packages/websocket/src/server.ts \
  --name bklit-websocket \
  --interpreter tsx \
  --cwd $PROJECT_DIR \
  --env-file $PROJECT_DIR/.env \
  --log $PROJECT_DIR/logs/websocket.log \
  --error $PROJECT_DIR/logs/websocket-error.log

# Start Worker
pm2 start packages/worker/src/index.ts \
  --name bklit-worker \
  --interpreter tsx \
  --cwd $PROJECT_DIR \
  --env-file $PROJECT_DIR/.env \
  --log $PROJECT_DIR/logs/worker.log \
  --error $PROJECT_DIR/logs/worker-error.log

# Save PM2 config
pm2 save

# Enable PM2 startup on boot
pm2 startup systemd

echo "   ✅ Services started"

echo ""
echo "🔟 Verifying deployment..."
sleep 3
pm2 status

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Services running:"
echo "  • WebSocket: ws://bklit.ws:8080"
echo "  • Worker: Background processing"
echo ""
echo "Check logs:"
echo "  pm2 logs bklit-websocket"
echo "  pm2 logs bklit-worker"
echo ""
echo "Next steps:"
echo "  1. Verify DNS: bash scripts/verify-dns.sh"
echo "  2. Test WebSocket: wscat -c ws://bklit.ws:8080"
echo "  3. Set up SSL/TLS for wss://"

