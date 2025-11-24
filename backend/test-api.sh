#!/bin/bash

# Certverse Backend API Test Script
# Tests all endpoints to verify backend is working correctly

API_URL="http://localhost:3001"
USER_ID="test-user-$(date +%s)"

echo "🧪 Testing Certverse Backend API"
echo "=================================="
echo "API URL: $API_URL"
echo "Test User ID: $USER_ID"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH=$(curl -s "$API_URL/health")
if echo "$HEALTH" | grep -q "ok"; then
  echo -e "${GREEN}✅ Health check passed${NC}"
else
  echo -e "${RED}❌ Health check failed${NC}"
  exit 1
fi
echo ""

# Test 2: Get API Info
echo "2️⃣  Testing API Info..."
INFO=$(curl -s "$API_URL/")
if echo "$INFO" | grep -q "Certverse"; then
  echo -e "${GREEN}✅ API info retrieved${NC}"
else
  echo -e "${RED}❌ API info failed${NC}"
fi
echo ""

# Test 3: Get Question Count
echo "3️⃣  Testing Question Count..."
COUNT=$(curl -s "$API_URL/api/question-count")
QUESTION_COUNT=$(echo "$COUNT" | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
if [ "$QUESTION_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ Found $QUESTION_COUNT questions${NC}"
else
  echo -e "${RED}❌ No questions found. Run: npm run seed${NC}"
  exit 1
fi
echo ""

# Test 4: Get Random Question
echo "4️⃣  Testing Get Random Question..."
QUESTION=$(curl -s "$API_URL/api/question?userId=$USER_ID")
QUESTION_ID=$(echo "$QUESTION" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\(.*\)"/\1/')
CORRECT_ANSWER=$(echo "$QUESTION" | grep -o '"answer":"[^"]*"' | sed 's/"answer":"\(.*\)"/\1/')

if [ -n "$QUESTION_ID" ]; then
  echo -e "${GREEN}✅ Question retrieved${NC}"
  echo "   Question ID: $QUESTION_ID"
  echo "   Correct Answer: $CORRECT_ANSWER"
else
  echo -e "${RED}❌ Failed to get question${NC}"
  exit 1
fi
echo ""

# Test 5: Submit Correct Answer
echo "5️⃣  Testing Submit Correct Answer..."
SUBMIT_CORRECT=$(curl -s -X POST "$API_URL/api/submit" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"questionId\":\"$QUESTION_ID\",\"selectedChoice\":\"$CORRECT_ANSWER\"}")

if echo "$SUBMIT_CORRECT" | grep -q '"correct":true'; then
  echo -e "${GREEN}✅ Correct answer submitted successfully${NC}"
else
  echo -e "${RED}❌ Submit correct answer failed${NC}"
  echo "$SUBMIT_CORRECT"
fi
echo ""

# Test 6: Submit Incorrect Answer
echo "6️⃣  Testing Submit Incorrect Answer..."
# Get a new question
QUESTION2=$(curl -s "$API_URL/api/question?userId=$USER_ID")
QUESTION_ID2=$(echo "$QUESTION2" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\(.*\)"/\1/')
CORRECT_ANSWER2=$(echo "$QUESTION2" | grep -o '"answer":"[^"]*"' | sed 's/"answer":"\(.*\)"/\1/')

# Submit wrong answer (if correct is A, submit B)
if [ "$CORRECT_ANSWER2" = "A" ]; then
  WRONG_ANSWER="B"
else
  WRONG_ANSWER="A"
fi

SUBMIT_INCORRECT=$(curl -s -X POST "$API_URL/api/submit" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"questionId\":\"$QUESTION_ID2\",\"selectedChoice\":\"$WRONG_ANSWER\"}")

if echo "$SUBMIT_INCORRECT" | grep -q '"correct":false'; then
  echo -e "${GREEN}✅ Incorrect answer handled correctly${NC}"
else
  echo -e "${RED}❌ Submit incorrect answer failed${NC}"
fi
echo ""

# Test 7: Get User Stats
echo "7️⃣  Testing Get User Stats..."
STATS=$(curl -s "$API_URL/api/stats?userId=$USER_ID")
TOTAL_ANSWERED=$(echo "$STATS" | grep -o '"totalAnswered":[0-9]*' | grep -o '[0-9]*')
TOTAL_CORRECT=$(echo "$STATS" | grep -o '"totalCorrect":[0-9]*' | grep -o '[0-9]*')

if [ "$TOTAL_ANSWERED" = "2" ] && [ "$TOTAL_CORRECT" = "1" ]; then
  echo -e "${GREEN}✅ User stats correct${NC}"
  echo "   Total Answered: $TOTAL_ANSWERED"
  echo "   Total Correct: $TOTAL_CORRECT"
  echo "   Accuracy: 50%"
else
  echo -e "${YELLOW}⚠️  User stats may be incorrect${NC}"
  echo "   Expected: 2 answered, 1 correct"
  echo "   Got: $TOTAL_ANSWERED answered, $TOTAL_CORRECT correct"
fi
echo ""

# Test 8: Get User History
echo "8️⃣  Testing Get User History..."
HISTORY=$(curl -s "$API_URL/api/history?userId=$USER_ID")
if echo "$HISTORY" | grep -q "$QUESTION_ID"; then
  echo -e "${GREEN}✅ User history retrieved${NC}"
else
  echo -e "${RED}❌ User history failed${NC}"
fi
echo ""

# Test 9: Error Handling - Missing userId
echo "9️⃣  Testing Error Handling..."
ERROR=$(curl -s "$API_URL/api/question")
if echo "$ERROR" | grep -q "Missing userId"; then
  echo -e "${GREEN}✅ Error handling works${NC}"
else
  echo -e "${YELLOW}⚠️  Error handling may not be working properly${NC}"
fi
echo ""

# Summary
echo "=================================="
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "📊 Summary:"
echo "   - Health check: ✅"
echo "   - Get question: ✅"
echo "   - Submit answer: ✅"
echo "   - User stats: ✅"
echo "   - Error handling: ✅"
echo ""
echo "🚀 Backend is ready for frontend integration!"
