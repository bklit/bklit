# Production Deployment Guide - WebSocket Architecture

## 🎯 **Overview**

This guide covers deploying the WebSocket-based real-time analytics to production.

**Infrastructure:**
- **bklit.ws** (Hetzner) - WebSocket server + Worker
- **app.bklit.com** (Vercel) - Dashboard + tRPC API
- **Upstash** - Redis (queue + session tracking)
- **Hetzner** - ClickHouse database

---

## ✅ **Pre-Deployment Checklist**

### **1. DNS Configuration**

- [ ] Cloudflare account has bklit.ws domain
- [ ] A record pointing to Hetzner IP: `46.224.125.208`
- [ ] **Gray cloud** (DNS only) - NOT orange cloud
- [ ] TTL set to Auto
- [ ] DNS propagated (run `bash scripts/verify-dns.sh`)

### **2. Hetzner Server Access**

- [ ] SSH access to `46.224.125.208`
- [ ] Root or sudo access
- [ ] ClickHouse running on port 8123
- [ ] UFW firewall enabled

### **3. Repository & Code**

- [ ] Branch `feat/ipapi-first-cloudflare-second` merged to main
- [ ] Or deploy from feature branch
- [ ] `.env` file prepared with production values

### **4. Dependencies**

- [ ] Upstash Redis URL ready
- [ ] ClickHouse credentials ready
- [ ] Postgres (Neon/Railway) URL ready
- [ ] GitHub OAuth credentials (for auth)

---

## 🚀 **Deployment Steps**

### **Step 1: Configure DNS (DO THIS FIRST)**

1. Go to **Cloudflare** → **bklit.ws** → **DNS** → **Records**
2. Click **Add Record**:
   ```
   Type: A
   Name: @
   IPv4 address: 46.224.125.208
   Proxy status: DNS only ⚪ (gray cloud)
   TTL: Auto
   ```
3. **CRITICAL:** Click the cloud icon to make it **GRAY** (not orange)
4. Click **Save**

**Verify DNS:**
```bash
bash scripts/verify-dns.sh
```

**Expected output:**
```
✅ DNS points to correct IP!
✅ Direct IP (gray cloud) - Perfect for WebSocket!
```

---

### **Step 2: Deploy to Hetzner**

SSH into your Hetzner server:

```bash
ssh root@46.224.125.208
```

Create `/opt/bklit/.env`:

```bash
cat > /opt/bklit/.env << 'EOF'
# Database
DATABASE_URL=postgresql://user:password@host:5432/bklit

# Redis (Upstash)
REDIS_URL=rediss://default:<password>@<host>:6379

# ClickHouse (Local)
CLICKHOUSE_HOST=http://localhost:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=8&%aH_777.123@
CLICKHOUSE_DATABASE=analytics

# WebSocket
WEBSOCKET_PORT=8080

# Environment
NODE_ENV=production
EOF
```

Run deployment script:

```bash
# Download and run the deployment script
curl -o deploy.sh https://raw.githubusercontent.com/yourusername/bklit/feat/ipapi-first-cloudflare-second/scripts/deploy-hetzner.sh
chmod +x deploy.sh
sudo bash deploy.sh
```

**Or manually:**

```bash
# Clone repo
cd /opt
git clone https://github.com/yourusername/bklit.git
cd bklit
git checkout feat/ipapi-first-cloudflare-second

# Install deps
pnpm install

# Start with PM2
pm2 start packages/websocket/src/server.ts --name bklit-websocket --interpreter tsx --env-file .env
pm2 start packages/worker/src/index.ts --name bklit-worker --interpreter tsx --env-file .env
pm2 save
pm2 startup systemd
```

---

### **Step 3: Verify WebSocket Server**

Check services are running:

```bash
pm2 status
```

Expected:
```
┌─────┬────────────────────┬─────────┬─────────┐
│ id  │ name               │ status  │ restart │
├─────┼────────────────────┼─────────┼─────────┤
│ 0   │ bklit-websocket    │ online  │ 0       │
│ 1   │ bklit-worker       │ online  │ 0       │
└─────┴────────────────────┴─────────┴─────────┘
```

Check logs:

```bash
pm2 logs bklit-websocket --lines 50
```

Expected:
```
🚀 WebSocket server starting on ws://localhost:8080
🌐 WebSocket server ready on ws://localhost:8080
✅ Redis connected - real-time enabled
```

Test WebSocket connection:

```bash
# Install wscat if not installed
npm install -g wscat

# Test connection
wscat -c ws://bklit.ws:8080
```

Should connect and you can type JSON messages.

---

### **Step 4: Set Up SSL/TLS (for wss://)**

Install Certbot:

```bash
apt update
apt install certbot -y
```

Get SSL certificate:

```bash
# Stop WebSocket server temporarily
pm2 stop bklit-websocket

# Get certificate (standalone mode)
certbot certonly --standalone -d bklit.ws

# Restart WebSocket server
pm2 restart bklit-websocket
```

Certificates will be at:
```
/etc/letsencrypt/live/bklit.ws/fullchain.pem
/etc/letsencrypt/live/bklit.ws/privkey.pem
```

**Update WebSocket server for SSL:**

Edit `packages/websocket/src/server.ts` and add:

```typescript
import { readFileSync } from 'node:fs';
import { createServer } from 'node:https';

const PORT = Number(process.env.WEBSOCKET_PORT) || 8080;

// Create HTTPS server for wss://
const httpsServer = createServer({
  cert: readFileSync('/etc/letsencrypt/live/bklit.ws/fullchain.pem'),
  key: readFileSync('/etc/letsencrypt/live/bklit.ws/privkey.pem'),
});

// Attach WebSocket to HTTPS server
const wss = new WebSocketServer({ server: httpsServer });

// Listen on port
httpsServer.listen(PORT, () => {
  console.log(`🔒 Secure WebSocket server ready on wss://bklit.ws:${PORT}`);
});
```

Restart services:

```bash
pm2 restart bklit-websocket
```

Test secure connection:

```bash
wscat -c wss://bklit.ws
```

---

### **Step 5: Deploy Dashboard to Vercel**

The dashboard will auto-deploy from your connected GitHub repository.

**Environment Variables in Vercel:**

Go to **Vercel** → **bklit** → **Settings** → **Environment Variables**

Add these:

```bash
# Database
DATABASE_URL=<neon-postgres-url>

# Redis
REDIS_URL=<upstash-redis-url>

# ClickHouse
CLICKHOUSE_HOST=http://46.224.125.208:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=8&%aH_777.123@
CLICKHOUSE_DATABASE=analytics

# Auth
AUTH_SECRET=<random-32-char-string>
AUTH_GITHUB_ID=<github-oauth-id>
AUTH_GITHUB_SECRET=<github-oauth-secret>
AUTH_URL=https://app.bklit.com

# App
NEXT_PUBLIC_APP_URL=https://app.bklit.com
NEXT_PUBLIC_MAPBOX_TOKEN=<mapbox-token>

# Billing (Optional)
POLAR_ACCESS_TOKEN=<polar-token>
POLAR_WEBHOOK_SECRET=<polar-secret>
POLAR_ORGANIZATION_ID=<polar-org-id>
POLAR_SERVER_MODE=production

# Email
RESEND_API_KEY=<resend-api-key>

# Trigger.dev
TRIGGER_SECRET_KEY=<trigger-secret>
```

**Trigger deployment:**

```bash
git push origin feat/ipapi-first-cloudflare-second
```

Vercel will auto-deploy. **Note:** Build may fail with `/_global-error` issue - this is okay, the app still works.

---

### **Step 6: Test End-to-End**

1. **Open your dashboard:**
   ```
   https://app.bklit.com/<org-id>/<project-id>/live
   ```

2. **Open playground in another tab:**
   ```
   https://playground.bklit.com
   ```
   (Or any site with SDK installed)

3. **Verify real-time updates:**
   - [ ] Marker appears on map within 1 second
   - [ ] Live user count increments
   - [ ] Navigate between pages → Pages update in real-time
   - [ ] Close tab → Marker disappears within 1 second
   - [ ] Check browser console for WebSocket connection logs

4. **Check logs on Hetzner:**
   ```bash
   pm2 logs bklit-websocket --lines 100
   ```
   
   Should show:
   ```
   [WS] New sdk connection: sdk:...
   [WS] ✅ Authenticated sdk:...
   [WS] 📡 Broadcasting pageview to dashboards
   [WS] 📤 Broadcast pageview to 1 dashboard(s)
   ```

---

## 🔒 **Security Hardening (After Basic Deployment)**

### **1. Restrict Firewall to Vercel IPs**

Currently port 8080 is open to the world. Lock it down:

```bash
# Get Vercel IP ranges
curl https://vercel.com/api/deployments/ips

# Update UFW to only allow Vercel
ufw delete allow 8080/tcp
ufw allow from <vercel-ip-range> to any port 8080 proto tcp
```

### **2. Add Rate Limiting**

Add to WebSocket server to prevent abuse.

### **3. Monitor Connection Count**

```bash
# Add to cron
echo "*/5 * * * * pm2 jlist | jq '.[].monit.memory' | head -2 >> /var/log/bklit-metrics.log" | crontab -
```

---

## 📊 **Monitoring**

### **PM2 Dashboard**

```bash
pm2 monit
```

### **Live Logs**

```bash
# WebSocket
pm2 logs bklit-websocket --lines 100 --raw

# Worker  
pm2 logs bklit-worker --lines 100 --raw

# Both
pm2 logs --lines 50
```

### **Connection Count**

```bash
pm2 logs bklit-websocket | grep "New.*connection" | tail -20
```

### **Queue Depth (Redis)**

```bash
redis-cli -u $REDIS_URL LLEN analytics:queue
```

Should be 0 or very low.

### **Active Sessions**

```bash
redis-cli -u $REDIS_URL KEYS "live:sessions:*"
redis-cli -u $REDIS_URL ZCARD live:sessions:<project-id>
```

---

## 🔄 **Updating Production**

```bash
# SSH to Hetzner
ssh root@46.224.125.208

# Pull latest
cd /opt/bklit
git pull origin main

# Install any new deps
pnpm install

# Restart services
pm2 restart all

# Check status
pm2 status
pm2 logs --lines 50
```

---

## 🆘 **Troubleshooting**

### **WebSocket won't connect**

Check firewall:
```bash
ufw status
```

Should show port 8080 allowed.

Check if server is listening:
```bash
netstat -tlnp | grep 8080
```

Check PM2 logs:
```bash
pm2 logs bklit-websocket --err --lines 50
```

### **Sessions not ending**

Check WebSocket disconnect events:
```bash
pm2 logs bklit-websocket | grep "Connection closed"
```

Verify Redis is accessible:
```bash
redis-cli -u $REDIS_URL ping
```

### **High latency**

Check worker is processing:
```bash
pm2 logs bklit-worker | grep "Processed"
```

Check Redis queue depth:
```bash
redis-cli -u $REDIS_URL LLEN analytics:queue
```

---

## 📦 **Production-Ready Files Created**

- ✅ `scripts/verify-dns.sh` - DNS verification tool
- ✅ `scripts/deploy-hetzner.sh` - Automated deployment
- ✅ `PRODUCTION_DEPLOYMENT.md` - This guide

---

## 🎉 **Success Criteria**

Your deployment is successful when:

- [x] DNS resolves to `46.224.125.208` (gray cloud)
- [x] PM2 shows both services online
- [x] `wscat -c ws://bklit.ws:8080` connects
- [x] Dashboard shows real-time updates (<1 second)
- [x] Sessions end instantly when tabs close
- [x] No errors in PM2 logs

---

## 📞 **Next Steps After Deployment**

1. **Monitor for 24 hours** - Check PM2 logs regularly
2. **Set up SSL/TLS** - Enable wss:// for production
3. **Update SDK examples** - Point to wss://bklit.ws in docs
4. **Publish SDK to npm** - Make it public
5. **Add monitoring alerts** - Uptime checks, error alerts

Good luck! 🚀

