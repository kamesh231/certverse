#!/bin/bash

# Week 3 Testing Script
# Tests daily unlock limits, streak tracking, and stats updates

API_URL="${API_URL:-http://localhost:3001}"
USER_ID="${USER_ID:-test_user_123}"

echo "========================================="
echo "Week 3: Daily Unlock Limits - Test Suite"
echo "========================================="
echo ""
echo "Testing API: $API_URL"
echo "User ID: $USER_ID"
echo ""

# Test 1: Check unlock status
echo "Test 1: Get Unlock Status"
echo "----------------------------------------"
UNLOCK_RESPONSE=$(curl -s "${API_URL}/api/unlock/remaining?userId=${USER_ID}")
echo "Response: $UNLOCK_RESPONSE"
echo ""

# Parse remaining count
REMAINING=$(echo $UNLOCK_RESPONSE | grep -o '"remaining":[0-9]*' | grep -o '[0-9]*')
TOTAL=$(echo $UNLOCK_RESPONSE | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
STREAK=$(echo $UNLOCK_RESPONSE | grep -o '"streak":[0-9]*' | grep -o '[0-9]*')

echo "Remaining: $REMAINING"
echo "Total: $TOTAL"
echo "Streak: $STREAK"
echo ""

# Test 2: Get enhanced stats
echo "Test 2: Get Enhanced Stats"
echo "----------------------------------------"
STATS_RESPONSE=$(curl -s "${API_URL}/api/stats/enhanced?userId=${USER_ID}")
echo "Response: $STATS_RESPONSE"
echo ""

# Test 3: Get subscription status
echo "Test 3: Get Subscription Status"
echo "----------------------------------------"
SUB_RESPONSE=$(curl -s "${API_URL}/api/subscription?userId=${USER_ID}")
echo "Response: $SUB_RESPONSE"
echo ""

# Test 4: Check if questions remaining
echo "Test 4: Check Daily Limit"
echo "----------------------------------------"
if [ "$REMAINING" -gt 0 ]; then
  echo "✅ User has $REMAINING questions remaining today"
  echo "   Total daily limit: $TOTAL"
else
  echo "⚠️  Daily limit reached (0 / $TOTAL)"
  echo "   User must wait until reset"
fi
echo ""

# Test 5: Check streak
echo "Test 5: Check Streak"
echo "----------------------------------------"
if [ "$STREAK" -ge 3 ]; then
  echo "✅ Current streak: $STREAK days 🔥"
  echo "   Flame icon should be displayed"
elif [ "$STREAK" -gt 0 ]; then
  echo "✅ Current streak: $STREAK day(s)"
else
  echo "ℹ️  No active streak"
fi
echo ""

# Test 6: Simulate answer submission (if you have a question ID)
echo "Test 6: Simulate Answer Submission"
echo "----------------------------------------"
echo "To test answer submission, run:"
echo ""
echo "curl -X POST ${API_URL}/api/submit \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{
  \"userId\": \"${USER_ID}\",
  \"questionId\": \"<question_id>\",
  \"selectedChoice\": \"A\"
}'"
echo ""

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo ""
echo "API Health: $(curl -s ${API_URL}/health | grep -o '"status":"[^"]*"' || echo 'UNKNOWN')"
echo "Daily Limit: $REMAINING / $TOTAL"
echo "Current Streak: $STREAK days"
echo ""
echo "✅ Week 3 tests complete!"
echo ""
echo "Next steps:"
echo "1. Visit http://localhost:3000/question to test frontend"
echo "2. Answer questions and verify counter updates"
echo "3. Check dashboard at http://localhost:3000/dashboard"
echo "4. Verify streak display and stats"
echo ""
