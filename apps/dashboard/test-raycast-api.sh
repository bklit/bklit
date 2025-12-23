#!/bin/bash

# Test script for Raycast API
# Usage: ./test-raycast-api.sh <API_TOKEN> <PROJECT_ID> [BASE_URL]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ -z "$1" ] || [ -z "$2" ]; then
  echo -e "${RED}Error: Missing required arguments${NC}"
  echo ""
  echo "Usage: $0 <API_TOKEN> <PROJECT_ID> [BASE_URL]"
  echo ""
  echo "Example:"
  echo "  $0 bk_live_abc123... clxxxx... https://app.bklit.co"
  echo "  $0 bk_live_abc123... clxxxx...  # Defaults to http://localhost:3000"
  echo ""
  exit 1
fi

API_TOKEN="$1"
PROJECT_ID="$2"
BASE_URL="${3:-http://localhost:3000}"

echo -e "${YELLOW}Testing Raycast API...${NC}"
echo ""
echo "Base URL: $BASE_URL"
echo "Project ID: $PROJECT_ID"
echo "Token: ${API_TOKEN:0:15}..."
echo ""

# Test the endpoint
echo -e "${YELLOW}Making request to /api/raycast/top-countries...${NC}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/raycast/top-countries" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"projectId\": \"$PROJECT_ID\"}")

# Extract status code (last line) and body (everything else)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ Success!${NC}"
  echo ""
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  echo ""
  
  # Check if data is empty
  DATA_LENGTH=$(echo "$BODY" | jq '.data | length' 2>/dev/null || echo "0")
  if [ "$DATA_LENGTH" -eq 0 ]; then
    echo -e "${YELLOW}⚠ Warning: No data returned (project might have no traffic in last 24 hours)${NC}"
  else
    echo -e "${GREEN}✓ Found $DATA_LENGTH countries${NC}"
  fi
else
  echo -e "${RED}✗ Error${NC}"
  echo ""
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  echo ""
  
  # Common error messages
  if echo "$BODY" | grep -q "Invalid token"; then
    echo -e "${YELLOW}Tip: Check that your API token is correct and hasn't expired${NC}"
  elif echo "$BODY" | grep -q "not authorized for project"; then
    echo -e "${YELLOW}Tip: Make sure the token is assigned to this project in Settings > API Tokens${NC}"
  elif echo "$BODY" | grep -q "Token is required"; then
    echo -e "${YELLOW}Tip: Check that you're passing the token correctly${NC}"
  fi
fi

echo ""
exit $([ "$HTTP_CODE" -eq 200 ] && echo 0 || echo 1)

