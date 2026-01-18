#!/bin/bash

echo "🔍 Verifying bklit.ws DNS configuration..."
echo ""

# Expected IP
EXPECTED_IP="46.224.125.208"

# Check DNS resolution
echo "1️⃣ DNS Resolution:"
RESOLVED_IP=$(dig bklit.ws +short | head -1)
echo "   bklit.ws resolves to: $RESOLVED_IP"

if [ "$RESOLVED_IP" = "$EXPECTED_IP" ]; then
  echo "   ✅ DNS points to correct IP!"
else
  echo "   ❌ DNS mismatch! Expected: $EXPECTED_IP, Got: $RESOLVED_IP"
  echo "   Wait a few minutes for DNS propagation, then try again."
  exit 1
fi

echo ""

# Check if it's proxied (should be gray cloud)
echo "2️⃣ Cloudflare Proxy Check:"
CF_IPS=$(curl -s https://www.cloudflare.com/ips-v4 | head -5)
if echo "$CF_IPS" | grep -q "${RESOLVED_IP%.*}"; then
  echo "   ⚠️  WARNING: IP looks like Cloudflare proxy (orange cloud)"
  echo "   You MUST use gray cloud (DNS only) for WebSocket!"
else
  echo "   ✅ Direct IP (gray cloud) - Perfect for WebSocket!"
fi

echo ""

# Check if port 8080 is open
echo "3️⃣ Port 8080 Check:"
if timeout 3 bash -c "cat < /dev/null > /dev/tcp/bklit.ws/8080" 2>/dev/null; then
  echo "   ✅ Port 8080 is open and accessible"
else
  echo "   ❌ Port 8080 not accessible yet"
  echo "   Run this on your Hetzner server:"
  echo "   sudo ufw allow 8080/tcp"
fi

echo ""

# Try WebSocket connection (requires wscat)
echo "4️⃣ WebSocket Test (requires wscat):"
if command -v wscat &> /dev/null; then
  echo "   Testing ws://bklit.ws:8080 (will timeout after 3s)..."
  timeout 3 wscat -c ws://bklit.ws:8080 2>&1 | head -5 || echo "   Connection attempt made"
else
  echo "   ⏭️  Skipped (install: npm install -g wscat)"
fi

echo ""
echo "✅ DNS verification complete!"
echo ""
echo "Next steps:"
echo "  1. Deploy WebSocket server to Hetzner (port 8080)"
echo "  2. Set up SSL/TLS for wss://"
echo "  3. Test with: wscat -c ws://bklit.ws:8080"

