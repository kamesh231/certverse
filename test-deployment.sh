#!/bin/bash

# Test Certverse Backend Deployment
# Usage: ./test-deployment.sh [RAILWAY_URL]

RAILWAY_URL="${1:-https://certverse-production.up.railway.app}"

echo "🧪 Testing Certverse Backend Deployment"
echo "URL: $RAILWAY_URL"
echo "========================================"
echo ""

# Test 1: Health check
echo "1️⃣  Testing health endpoint..."
HEALTH=$(curl -s "$RAILWAY_URL/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed"
  echo "$HEALTH"
fi
echo ""

# Test 2: API root
echo "2️⃣  Testing API root..."
API_ROOT=$(curl -s "$RAILWAY_URL/")
if echo "$API_ROOT" | grep -q "Certverse API"; then
  echo "✅ API root accessible"
else
  echo "❌ API root failed"
fi
echo ""

# Test 3: Unlock endpoint (new Week 3 feature)
echo "3️⃣  Testing unlock/remaining endpoint..."
UNLOCK=$(curl -s "$RAILWAY_URL/api/unlock/remaining?userId=test")
if echo "$UNLOCK" | grep -q "remaining"; then
  echo "✅ Unlock endpoint working"
  echo "   Response: $UNLOCK"
else
  echo "❌ Unlock endpoint failed"
  echo "   Response: $UNLOCK"
fi
echo ""

# Test 4: Enhanced stats endpoint (new Week 3 feature)
echo "4️⃣  Testing stats/enhanced endpoint..."
STATS=$(curl -s "$RAILWAY_URL/api/stats/enhanced?userId=test")
if echo "$STATS" | grep -q "currentStreak"; then
  echo "✅ Enhanced stats endpoint working"
  echo "   Response: $STATS"
else
  echo "❌ Enhanced stats endpoint failed"
  echo "   Response: $STATS"
fi
echo ""

# Test 5: Question endpoint
echo "5️⃣  Testing question endpoint..."
QUESTION=$(curl -s "$RAILWAY_URL/api/question?userId=test")
if echo "$QUESTION" | grep -q "q_text"; then
  echo "✅ Question endpoint working"
else
  echo "❌ Question endpoint failed"
  echo "   Response: $QUESTION"
fi
echo ""

echo "========================================"
echo "✅ Deployment test complete!"
echo ""
echo "To test in browser:"
echo "1. Go to https://certverse.vercel.app/question"
echo "2. Sign in with Clerk"
echo "3. Look for 'Questions today: 0/5' badge"
echo "4. Look for 'Streak: X days' badge"
