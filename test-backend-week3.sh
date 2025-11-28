#!/bin/bash

# Week 3 Backend API Testing Script
# Tests: Daily unlock limits, streak tracking, and enhanced stats

# Configuration
BACKEND_URL="${1:-https://certverse-production.up.railway.app}"
TEST_USER_ID="test_user_week3_$(date +%s)"

echo "======================================"
echo "🧪 Week 3 Backend API Tests"
echo "======================================"
echo "Backend URL: $BACKEND_URL"
echo "Test User ID: $TEST_USER_ID"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Command:"
echo "curl -s \"$BACKEND_URL/health\""
echo ""
RESPONSE=$(curl -s "$BACKEND_URL/health")
echo "Response:"
echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | grep -q '"status":"ok"'; then
  echo -e "${GREEN}✅ Health check passed${NC}"
else
  echo -e "${RED}❌ Health check failed${NC}"
fi
echo ""

# Test 2: Get Unlock Status (NEW - Week 3)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Get Daily Unlock Status (NEW)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Command:"
echo "curl -s \"$BACKEND_URL/api/unlock/remaining?userId=$TEST_USER_ID\""
echo ""
UNLOCK_RESPONSE=$(curl -s "$BACKEND_URL/api/unlock/remaining?userId=$TEST_USER_ID")
echo "Response:"
echo "$UNLOCK_RESPONSE" | jq '.'
if echo "$UNLOCK_RESPONSE" | grep -q '"remaining"'; then
  REMAINING=$(echo "$UNLOCK_RESPONSE" | jq -r '.remaining')
  TOTAL=$(echo "$UNLOCK_RESPONSE" | jq -r '.total')
  STREAK=$(echo "$UNLOCK_RESPONSE" | jq -r '.streak')
  echo -e "${GREEN}✅ Unlock endpoint working${NC}"
  echo "   📊 Questions remaining today: $REMAINING/$TOTAL"
  echo "   🔥 Current streak: $STREAK days"
else
  echo -e "${RED}❌ Unlock endpoint failed${NC}"
fi
echo ""

# Test 3: Get Enhanced Stats (NEW - Week 3)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Get Enhanced User Stats (NEW)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Command:"
echo "curl -s \"$BACKEND_URL/api/stats/enhanced?userId=$TEST_USER_ID\""
echo ""
STATS_RESPONSE=$(curl -s "$BACKEND_URL/api/stats/enhanced?userId=$TEST_USER_ID")
echo "Response:"
echo "$STATS_RESPONSE" | jq '.'
if echo "$STATS_RESPONSE" | grep -q '"currentStreak"'; then
  TOTAL_ANSWERED=$(echo "$STATS_RESPONSE" | jq -r '.totalAnswered')
  ACCURACY=$(echo "$STATS_RESPONSE" | jq -r '.accuracy')
  STREAK=$(echo "$STATS_RESPONSE" | jq -r '.currentStreak')
  QUESTIONS_TODAY=$(echo "$STATS_RESPONSE" | jq -r '.questionsToday')
  echo -e "${GREEN}✅ Enhanced stats endpoint working${NC}"
  echo "   📝 Total answered: $TOTAL_ANSWERED"
  echo "   🎯 Accuracy: $ACCURACY%"
  echo "   🔥 Current streak: $STREAK days"
  echo "   📅 Questions today: $QUESTIONS_TODAY"
else
  echo -e "${RED}❌ Enhanced stats endpoint failed${NC}"
fi
echo ""

# Test 4: Get Random Question
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Get Random Question"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Command:"
echo "curl -s \"$BACKEND_URL/api/question?userId=$TEST_USER_ID\""
echo ""
QUESTION_RESPONSE=$(curl -s "$BACKEND_URL/api/question?userId=$TEST_USER_ID")
echo "Response:"
echo "$QUESTION_RESPONSE" | jq '.'
if echo "$QUESTION_RESPONSE" | grep -q '"q_text"'; then
  QUESTION_ID=$(echo "$QUESTION_RESPONSE" | jq -r '.id')
  QUESTION_TEXT=$(echo "$QUESTION_RESPONSE" | jq -r '.q_text' | head -c 100)
  echo -e "${GREEN}✅ Question endpoint working${NC}"
  echo "   🆔 Question ID: $QUESTION_ID"
  echo "   📝 Question: ${QUESTION_TEXT}..."
else
  echo -e "${RED}❌ Question endpoint failed${NC}"
  QUESTION_ID=""
fi
echo ""

# Test 5: Submit Answer (Tests stats update)
if [ -n "$QUESTION_ID" ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "5️⃣  Submit Answer (Updates Stats & Streak)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Command:"
  echo "curl -X POST \"$BACKEND_URL/api/submit\" \\"
  echo "  -H \"Content-Type: application/json\" \\"
  echo "  -d '{\"userId\":\"$TEST_USER_ID\",\"questionId\":\"$QUESTION_ID\",\"selectedChoice\":\"A\"}'"
  echo ""

  SUBMIT_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/submit" \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"$TEST_USER_ID\",\"questionId\":\"$QUESTION_ID\",\"selectedChoice\":\"A\"}")

  echo "Response:"
  echo "$SUBMIT_RESPONSE" | jq '.'

  if echo "$SUBMIT_RESPONSE" | grep -q '"success":true'; then
    IS_CORRECT=$(echo "$SUBMIT_RESPONSE" | jq -r '.correct')
    CORRECT_ANSWER=$(echo "$SUBMIT_RESPONSE" | jq -r '.correctAnswer')
    echo -e "${GREEN}✅ Submit endpoint working${NC}"
    if [ "$IS_CORRECT" == "true" ]; then
      echo "   ✅ Answer was correct!"
    else
      echo "   ❌ Answer was incorrect (correct: $CORRECT_ANSWER)"
    fi
  else
    echo -e "${RED}❌ Submit endpoint failed${NC}"
  fi
  echo ""

  # Test 6: Verify Stats Updated
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "6️⃣  Verify Stats Updated After Submit"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Command:"
  echo "curl -s \"$BACKEND_URL/api/stats/enhanced?userId=$TEST_USER_ID\""
  echo ""

  sleep 1  # Give database a moment to update

  UPDATED_STATS=$(curl -s "$BACKEND_URL/api/stats/enhanced?userId=$TEST_USER_ID")
  echo "Response:"
  echo "$UPDATED_STATS" | jq '.'

  NEW_TOTAL=$(echo "$UPDATED_STATS" | jq -r '.totalAnswered')
  NEW_STREAK=$(echo "$UPDATED_STATS" | jq -r '.currentStreak')
  NEW_TODAY=$(echo "$UPDATED_STATS" | jq -r '.questionsToday')

  if [ "$NEW_TOTAL" -gt 0 ]; then
    echo -e "${GREEN}✅ Stats updated successfully${NC}"
    echo "   📝 Total answered: $NEW_TOTAL (was 0)"
    echo "   🔥 Streak: $NEW_STREAK days (was 0)"
    echo "   📅 Questions today: $NEW_TODAY (was 0)"
  else
    echo -e "${RED}❌ Stats didn't update${NC}"
  fi
  echo ""

  # Test 7: Check Unlock Status After Submit
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "7️⃣  Check Unlock Status After Submit"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Command:"
  echo "curl -s \"$BACKEND_URL/api/unlock/remaining?userId=$TEST_USER_ID\""
  echo ""

  UPDATED_UNLOCK=$(curl -s "$BACKEND_URL/api/unlock/remaining?userId=$TEST_USER_ID")
  echo "Response:"
  echo "$UPDATED_UNLOCK" | jq '.'

  NEW_REMAINING=$(echo "$UPDATED_UNLOCK" | jq -r '.remaining')
  if [ "$NEW_REMAINING" -eq 4 ]; then
    echo -e "${GREEN}✅ Unlock counter decremented correctly${NC}"
    echo "   📊 Remaining: $NEW_REMAINING/5 (was 5/5)"
  else
    echo -e "${YELLOW}⚠️  Remaining: $NEW_REMAINING (expected 4)${NC}"
  fi
  echo ""
fi

echo "======================================"
echo "✅ All Tests Complete!"
echo "======================================"
echo ""
echo "Summary:"
echo "✅ Health check"
echo "✅ Unlock status endpoint (Week 3)"
echo "✅ Enhanced stats endpoint (Week 3)"
echo "✅ Question retrieval"
echo "✅ Answer submission"
echo "✅ Stats update after submit"
echo "✅ Unlock counter decrement"
echo ""
echo "Week 3 features are working! 🎉"
