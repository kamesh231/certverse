#!/bin/bash

# Test script for Polar webhook endpoint
# Run this after starting the backend server: npm run dev

BASE_URL="http://localhost:3001"
TEST_USER_ID="test_user_$(date +%s)"
WEBHOOK_SECRET="test_secret_for_development"

echo "🧪 Testing Polar Webhook Endpoint"
echo "======================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Generate HMAC signature
function generate_signature() {
  local payload="$1"
  echo -n "$payload" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //'
}

# Test 1: checkout.completed event
echo "${BLUE}Test 1: POST /api/webhooks/polar (checkout.completed)${NC}"
PAYLOAD=$(cat <<EOF
{
  "type": "checkout.completed",
  "data": {
    "customer_id": "cus_test_123",
    "subscription_id": "sub_test_123",
    "product_id": "prod_test_123",
    "current_period_start": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "current_period_end": "$(date -u -v+30d +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d '+30 days' +"%Y-%m-%dT%H:%M:%SZ")",
    "metadata": {
      "user_id": "$TEST_USER_ID"
    }
  }
}
EOF
)

SIGNATURE=$(generate_signature "$PAYLOAD")

RESPONSE=$(curl -s -X POST "${BASE_URL}/api/webhooks/polar" \
  -H "Content-Type: application/json" \
  -H "polar-signature: $SIGNATURE" \
  -d "$PAYLOAD")

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "received"; then
    echo "${GREEN}✅ Test 1 Passed: Webhook received checkout.completed${NC}"
else
    echo "${RED}❌ Test 1 Failed${NC}"
fi
echo ""

# Test 2: Invalid signature
echo "${BLUE}Test 2: POST /api/webhooks/polar (invalid signature)${NC}"
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/webhooks/polar" \
  -H "Content-Type: application/json" \
  -H "polar-signature: invalid_signature" \
  -d "$PAYLOAD")

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "Invalid signature"; then
    echo "${GREEN}✅ Test 2 Passed: Invalid signature rejected${NC}"
else
    echo "${RED}❌ Test 2 Failed${NC}"
fi
echo ""

# Test 3: subscription.canceled event
echo "${BLUE}Test 3: POST /api/webhooks/polar (subscription.canceled)${NC}"
PAYLOAD=$(cat <<EOF
{
  "type": "subscription.canceled",
  "data": {
    "id": "sub_test_123",
    "current_period_end": "$(date -u -v+30d +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d '+30 days' +"%Y-%m-%dT%H:%M:%SZ")",
    "cancel_at": "$(date -u -v+30d +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d '+30 days' +"%Y-%m-%dT%H:%M:%SZ")"
  }
}
EOF
)

SIGNATURE=$(generate_signature "$PAYLOAD")

RESPONSE=$(curl -s -X POST "${BASE_URL}/api/webhooks/polar" \
  -H "Content-Type: application/json" \
  -H "polar-signature: $SIGNATURE" \
  -d "$PAYLOAD")

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "received"; then
    echo "${GREEN}✅ Test 3 Passed: Webhook received subscription.canceled${NC}"
else
    echo "${RED}❌ Test 3 Failed${NC}"
fi
echo ""

echo "======================================="
echo "${GREEN}✨ Webhook tests complete!${NC}"
echo ""
echo "Note: Check your backend logs to see webhook processing details."
echo "Test user ${TEST_USER_ID} subscription should now be in the database."
