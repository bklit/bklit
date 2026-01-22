#!/bin/bash

# Benchmark script for Raycast APIs
# Usage: ./scripts/benchmark-raycast-api.sh <API_TOKEN> <PROJECT_ID> [BASE_URL]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

if [ -z "$1" ] || [ -z "$2" ]; then
  echo -e "${RED}Usage: $0 <API_TOKEN> <PROJECT_ID> [BASE_URL]${NC}"
  echo ""
  echo "Example:"
  echo "  $0 bk_live_abc123... clxxxx... https://app.bklit.co"
  exit 1
fi

API_TOKEN="$1"
PROJECT_ID="$2"
BASE_URL="${3:-https://app.bklit.co}"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           Bklit Raycast API Benchmark                        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Base URL: ${BLUE}$BASE_URL${NC}"
echo -e "Project:  ${BLUE}$PROJECT_ID${NC}"
echo ""

# Function to benchmark an endpoint
benchmark_endpoint() {
  local endpoint=$1
  local name=$2
  local runs=5
  local total_time=0
  local min_time=999999
  local max_time=0
  local success=0
  local data_size=0

  echo -e "${YELLOW}Testing: ${name}${NC}"
  echo -n "  Runs: "

  for i in $(seq 1 $runs); do
    # Use curl with timing
    result=$(curl -s -w "\n%{time_total}|%{size_download}" -X POST "$BASE_URL/api/raycast/$endpoint" \
      -H "Authorization: Bearer $API_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"projectId\": \"$PROJECT_ID\"}" 2>/dev/null)
    
    # Extract timing and size
    body=$(echo "$result" | sed '$d')
    metrics=$(echo "$result" | tail -n1)
    time_sec=$(echo "$metrics" | cut -d'|' -f1)
    size=$(echo "$metrics" | cut -d'|' -f2)
    
    # Convert to milliseconds
    time_ms=$(echo "$time_sec * 1000" | bc | cut -d'.' -f1)
    
    # Check if successful
    if echo "$body" | grep -q '"success":true'; then
      success=$((success + 1))
      echo -n -e "${GREEN}✓${NC}"
    else
      echo -n -e "${RED}✗${NC}"
    fi
    
    # Update stats
    total_time=$((total_time + time_ms))
    data_size=$size
    
    if [ "$time_ms" -lt "$min_time" ]; then
      min_time=$time_ms
    fi
    if [ "$time_ms" -gt "$max_time" ]; then
      max_time=$time_ms
    fi
    
    sleep 0.2
  done

  avg_time=$((total_time / runs))
  
  echo ""
  echo -e "  ${GREEN}Success:${NC} $success/$runs"
  echo -e "  ${GREEN}Avg:${NC} ${avg_time}ms  ${GREEN}Min:${NC} ${min_time}ms  ${GREEN}Max:${NC} ${max_time}ms"
  echo -e "  ${GREEN}Response size:${NC} ${data_size} bytes"
  echo ""
  
  # Return avg time for summary
  echo "$avg_time" >> /tmp/bklit_benchmark_times.txt
}

# Clear temp file
> /tmp/bklit_benchmark_times.txt

echo -e "${CYAN}─────────────────────────────────────────────────────────────────${NC}"
echo ""

benchmark_endpoint "top-countries" "Top Countries"
benchmark_endpoint "top-pages" "Top Pages"
benchmark_endpoint "top-referrers" "Top Referrers"
benchmark_endpoint "browser-usage" "Browser Usage"
benchmark_endpoint "device-usage" "Device Usage"

echo -e "${CYAN}─────────────────────────────────────────────────────────────────${NC}"
echo ""

# Calculate totals
total=0
count=0
while read -r time; do
  total=$((total + time))
  count=$((count + 1))
done < /tmp/bklit_benchmark_times.txt

if [ "$count" -gt 0 ]; then
  overall_avg=$((total / count))
  echo -e "${GREEN}Overall average response time: ${overall_avg}ms${NC}"
fi

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    Benchmark Complete                        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Cleanup
rm -f /tmp/bklit_benchmark_times.txt
