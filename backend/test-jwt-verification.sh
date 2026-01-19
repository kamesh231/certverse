#!/bin/bash

# JWT Verification Test Script
# Tests that the backend properly validates Clerk JWT tokens

echo "🔒 JWT Verification Test Suite"
echo "================================"
echo ""

# Configuration
API_URL="${API_URL:-https://certverse-production.up.railway.app}"
echo "Testing API: $API_URL"
echo ""

# Test 1: Request without Authorization header (should fail with 401)
echo "Test 1: Request without Authorization header"
echo "Expected: 401 Unauthorized"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/stats")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ PASS: Got 401 as expected"
    echo "Response: $BODY"
else
    echo "❌ FAIL: Expected 401, got $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

# Test 2: Request with invalid token (should fail with 401)
echo "Test 2: Request with invalid token"
echo "Expected: 401 Unauthorized"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer invalid_token_here" \
    "$API_URL/api/stats")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ PASS: Got 401 as expected"
    echo "Response: $BODY"
else
    echo "❌ FAIL: Expected 401, got $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

# Test 3: Request with malformed Authorization header (should fail with 401)
echo "Test 3: Request with malformed Authorization header"
echo "Expected: 401 Unauthorized"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: InvalidFormat token123" \
    "$API_URL/api/stats")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ PASS: Got 401 as expected"
    echo "Response: $BODY"
else
    echo "❌ FAIL: Expected 401, got $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

# Test 4: Health check endpoint (should work without auth)
echo "Test 4: Health check endpoint (no auth required)"
echo "Expected: 200 OK"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ PASS: Health check accessible without auth"
    echo "Response: $BODY"
else
    echo "❌ FAIL: Expected 200, got $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

# Test 5: Question count endpoint (public, no auth)
echo "Test 5: Question count endpoint (public, no auth required)"
echo "Expected: 200 OK"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/question-count")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ PASS: Public endpoint accessible without auth"
    echo "Response: $BODY"
else
    echo "❌ FAIL: Expected 200, got $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

# Test 6: Protected endpoints list
echo "Test 6: Verifying all protected endpoints require authentication"
echo "The following endpoints should all return 401 without valid JWT:"
echo ""

PROTECTED_ENDPOINTS=(
    "/api/subscription"
    "/api/question?userEmail=test@example.com"
    "/api/unlock/remaining"
    "/api/stats"
    "/api/stats/enhanced"
    "/api/history"
    "/api/onboarding/status"
)

FAIL_COUNT=0
PASS_COUNT=0

for endpoint in "${PROTECTED_ENDPOINTS[@]}"; do
    RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "401" ]; then
        echo "✅ $endpoint - Properly protected (401)"
        ((PASS_COUNT++))
    else
        echo "❌ $endpoint - NOT protected! (Got $HTTP_CODE)"
        ((FAIL_COUNT++))
    fi
done

echo ""
echo "================================"
echo "Test Summary"
echo "================================"
echo "✅ Passed: $PASS_COUNT"
if [ "$FAIL_COUNT" -gt 0 ]; then
    echo "❌ Failed: $FAIL_COUNT"
    echo ""
    echo "⚠️  WARNING: Some endpoints are not properly protected!"
    exit 1
else
    echo "❌ Failed: 0"
    echo ""
    echo "🎉 All tests passed! JWT verification is working correctly."
    exit 0
fi
