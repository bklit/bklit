#!/usr/bin/env bash
# Restart bklit PM2 services when health endpoints report unhealthy or stop responding.
set -euo pipefail

WEBSOCKET_HEALTH_URL="${WEBSOCKET_HEALTH_URL:-https://127.0.0.1:8080/health}"
WORKER_HEALTH_URL="${WORKER_HEALTH_URL:-http://127.0.0.1:8081/health}"
CURL=(curl -sf --max-time 5 -k)

check_service() {
  local service=$1
  local url=$2

  if response="$("${CURL[@]}" "$url" 2>/dev/null)"; then
    local ok
    ok=$(printf '%s' "$response" | sed -n 's/.*"ok":\s*\([^,}]*\).*/\1/p' | tr -d ' "')
    if [[ "$ok" == "true" ]]; then
      echo "[healthcheck] ${service} ok"
      return 0
    fi

    echo "[healthcheck] ${service} unhealthy: ${response}"
  else
    echo "[healthcheck] ${service} health endpoint unreachable at ${url}"
  fi

  pm2 restart "$service"
}

check_service "bklit-websocket" "$WEBSOCKET_HEALTH_URL"
check_service "bklit-worker" "$WORKER_HEALTH_URL"
