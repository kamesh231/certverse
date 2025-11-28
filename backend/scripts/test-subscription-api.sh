#!/bin/bash

# Test script for subscription API endpoints
# Run this after starting the backend server: npm run dev

BASE_URL="http://localhost:3001"
TEST_USER_ID="test_$(date +%s)"
TEST_EMAIL="test@example.com"

echo "🧪 Testing Subscription API Endpoints"
echo "======================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Get subscription for new user
echo "${BLUE}Test 1: GET /api/subscription (new user)${NC}"
RESPONSE=$(curl -s "${BASE_URL}/api/subscription?userId=${TEST_USER_ID}")
echo "Response: $RESPONSE"

# Check if response contains expected fields
if echo "$RESPONSE" | grep -q "plan_type" && echo "$RESPONSE" | grep -q "free"; then
    echo "${GREEN}✅ Test 1 Passed: New user got free subscription${NC}"
else
    echo "${RED}❌ Test 1 Failed${NC}"
fi
echo ""

# Test 2: Create checkout URL
echo "${BLUE}Test 2: POST /api/checkout/create${NC}"
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/checkout/create" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"${TEST_USER_ID}\",\"userEmail\":\"${TEST_EMAIL}\"}")
echo "Response: $RESPONSE"

# Check if response contains Polar URL
if echo "$RESPONSE" | grep -q "polar.sh"; then
    echo "${GREEN}✅ Test 2 Passed: Got checkout URL${NC}"
else
    echo "${RED}❌ Test 2 Failed${NC}"
fi
echo ""

# Test 3: Get subscription again (should return existing)
echo "${BLUE}Test 3: GET /api/subscription (existing user)${NC}"
RESPONSE=$(curl -s "${BASE_URL}/api/subscription?userId=${TEST_USER_ID}")
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "${TEST_USER_ID}"; then
    echo "${GREEN}✅ Test 3 Passed: Got existing subscription${NC}"
else
    echo "${RED}❌ Test 3 Failed${NC}"
fi
echo ""

# Test 4: Test error handling (missing userId)
echo "${BLUE}Test 4: GET /api/subscription (missing userId)${NC}"
RESPONSE=$(curl -s "${BASE_URL}/api/subscription")
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "error"; then
    echo "${GREEN}✅ Test 4 Passed: Error handling works${NC}"
else
    echo "${RED}❌ Test 4 Failed${NC}"
fi
echo ""

echo "======================================="
echo "${GREEN}✨ All subscription API tests complete!${NC}"
echo ""
echo "Note: Test user ${TEST_USER_ID} was created in the database."
echo "You can clean it up manually or it will stay as test data."
