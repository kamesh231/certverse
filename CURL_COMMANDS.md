# Week 3 Backend Testing - Curl Commands

Replace `YOUR_USER_ID` with your actual Clerk user ID, or use `test_user` for testing.

---

## 1. Health Check

```bash
curl -s "https://certverse-production.up.railway.app/health" | jq '.'
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-26T...",
  "database": "connected"
}
```

---

## 2. Get Daily Unlock Status ⭐ NEW (Week 3)

```bash
curl -s "https://certverse-production.up.railway.app/api/unlock/remaining?userId=test_user" | jq '.'
```

**Expected response:**
```json
{
  "remaining": 5,
  "total": 5,
  "resetsAt": "2025-01-27T00:00:00.000Z",
  "streak": 0
}
```

**What this tests:**
- ✅ Daily unlock limit logic
- ✅ Remaining questions calculation
- ✅ Streak tracking
- ✅ Reset time calculation

---

## 3. Get Enhanced User Stats ⭐ NEW (Week 3)

```bash
curl -s "https://certverse-production.up.railway.app/api/stats/enhanced?userId=test_user" | jq '.'
```

**Expected response:**
```json
{
  "totalAnswered": 0,
  "totalCorrect": 0,
  "accuracy": 0,
  "currentStreak": 0,
  "longestStreak": 0,
  "questionsToday": 0
}
```

**What this tests:**
- ✅ Enhanced stats with streak data
- ✅ Questions answered today counter
- ✅ Longest streak tracking

---

## 4. Get Random Question

```bash
curl -s "https://certverse-production.up.railway.app/api/question?userId=test_user" | jq '.'
```

**Expected response:**
```json
{
  "id": "uuid-here",
  "domain": 1,
  "q_text": "What is the PRIMARY purpose...",
  "choice_a": "Option A",
  "choice_b": "Option B",
  "choice_c": "Option C",
  "choice_d": "Option D",
  "answer": "B",
  "explanation": "Explanation text...",
  "created_at": "2024-11-24T..."
}
```

---

## 5. Submit Answer (Updates Stats & Streak) ⭐ UPDATED (Week 3)

```bash
curl -X POST "https://certverse-production.up.railway.app/api/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "questionId": "PASTE_QUESTION_ID_HERE",
    "selectedChoice": "A"
  }' | jq '.'
```

**Expected response:**
```json
{
  "success": true,
  "correct": false,
  "correctAnswer": "B",
  "explanation": "Explanation of why B is correct...",
  "responseId": "uuid-here"
}
```

**What changed in Week 3:**
- ✅ Now automatically updates `user_stats` table
- ✅ Increments streak if consecutive day
- ✅ Decrements daily unlock counter

---

## 6. Get Regular Stats (Old Endpoint)

```bash
curl -s "https://certverse-production.up.railway.app/api/stats?userId=test_user" | jq '.'
```

**Expected response:**
```json
{
  "totalAnswered": 5,
  "totalCorrect": 3,
  "accuracy": 60
}
```

---

## 7. Get User History

```bash
curl -s "https://certverse-production.up.railway.app/api/history?userId=test_user&limit=5" | jq '.'
```

**Expected response:**
```json
[
  {
    "id": "uuid",
    "user_id": "test_user",
    "question_id": "uuid",
    "selected_choice": "A",
    "correct": true,
    "created_at": "2025-01-26T..."
  }
]
```

---

## Full Test Sequence (Copy All at Once)

Test the complete Week 3 flow:

```bash
# Set your user ID
USER_ID="test_user_$(date +%s)"
BACKEND="https://certverse-production.up.railway.app"

# 1. Check unlock status (should be 5/5)
echo "1. Initial unlock status:"
curl -s "$BACKEND/api/unlock/remaining?userId=$USER_ID" | jq '.'

# 2. Get a question
echo -e "\n2. Getting question:"
QUESTION=$(curl -s "$BACKEND/api/question?userId=$USER_ID")
echo "$QUESTION" | jq '.'
QUESTION_ID=$(echo "$QUESTION" | jq -r '.id')

# 3. Submit answer
echo -e "\n3. Submitting answer:"
curl -X POST "$BACKEND/api/submit" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"questionId\":\"$QUESTION_ID\",\"selectedChoice\":\"A\"}" | jq '.'

# 4. Check updated stats
echo -e "\n4. Updated stats (should show 1 question, streak=1):"
curl -s "$BACKEND/api/stats/enhanced?userId=$USER_ID" | jq '.'

# 5. Check unlock status (should be 4/5)
echo -e "\n5. Updated unlock status (should be 4/5):"
curl -s "$BACKEND/api/unlock/remaining?userId=$USER_ID" | jq '.'
```

---

## Testing Daily Limit

To test the 5 question/day limit:

```bash
USER_ID="limit_test_$(date +%s)"
BACKEND="https://certverse-production.up.railway.app"

# Answer 5 questions in a loop
for i in {1..5}; do
  echo "Question $i:"

  # Get question
  QUESTION=$(curl -s "$BACKEND/api/question?userId=$USER_ID")
  QUESTION_ID=$(echo "$QUESTION" | jq -r '.id')

  # Submit answer
  curl -X POST "$BACKEND/api/submit" \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"$USER_ID\",\"questionId\":\"$QUESTION_ID\",\"selectedChoice\":\"A\"}" | jq -c '{success,correct}'

  # Check remaining
  UNLOCK=$(curl -s "$BACKEND/api/unlock/remaining?userId=$USER_ID")
  echo "Remaining: $(echo $UNLOCK | jq -r '.remaining')/5"
  echo ""
done

# After 5 questions, remaining should be 0
echo "Final check - should be 0/5:"
curl -s "$BACKEND/api/unlock/remaining?userId=$USER_ID" | jq '.'
```

---

## Testing Streak

Streak requires testing over multiple days. To simulate:

**Day 1:**
```bash
USER_ID="streak_test_user"
BACKEND="https://certverse-production.up.railway.app"

# Answer 1 question
QUESTION=$(curl -s "$BACKEND/api/question?userId=$USER_ID")
QUESTION_ID=$(echo "$QUESTION" | jq -r '.id')

curl -X POST "$BACKEND/api/submit" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"questionId\":\"$QUESTION_ID\",\"selectedChoice\":\"A\"}"

# Check streak (should be 1)
curl -s "$BACKEND/api/stats/enhanced?userId=$USER_ID" | jq '{currentStreak,longestStreak}'
```

**Day 2 (next day):**
```bash
# Answer another question
QUESTION=$(curl -s "$BACKEND/api/question?userId=$USER_ID")
QUESTION_ID=$(echo "$QUESTION" | jq -r '.id')

curl -X POST "$BACKEND/api/submit" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"questionId\":\"$QUESTION_ID\",\"selectedChoice\":\"A\"}"

# Check streak (should be 2)
curl -s "$BACKEND/api/stats/enhanced?userId=$USER_ID" | jq '{currentStreak,longestStreak}'
```

---

## Quick One-Liners

### Check if backend is up
```bash
curl -s https://certverse-production.up.railway.app/health | jq -r '.status'
```

### Get your remaining questions
```bash
curl -s "https://certverse-production.up.railway.app/api/unlock/remaining?userId=YOUR_CLERK_ID" | jq '{remaining,total,streak}'
```

### Check your streak
```bash
curl -s "https://certverse-production.up.railway.app/api/stats/enhanced?userId=YOUR_CLERK_ID" | jq '{currentStreak,longestStreak,questionsToday}'
```

### Get total question count
```bash
curl -s https://certverse-production.up.railway.app/api/question-count | jq '.count'
```

---

## Error Responses

### Missing userId
```bash
curl -s "https://certverse-production.up.railway.app/api/unlock/remaining" | jq '.'
# Response:
# {
#   "error": "Missing userId parameter"
# }
```

### Invalid userId (no stats yet)
```bash
curl -s "https://certverse-production.up.railway.app/api/stats/enhanced?userId=nonexistent" | jq '.'
# Response:
# {
#   "totalAnswered": 0,
#   "totalCorrect": 0,
#   "accuracy": 0,
#   "currentStreak": 0,
#   "longestStreak": 0,
#   "questionsToday": 0
# }
```

---

## Notes

- Replace `https://certverse-production.up.railway.app` with your actual Railway URL
- Replace `YOUR_CLERK_ID` with your actual Clerk user ID (found in Clerk dashboard)
- Add `| jq '.'` to prettify JSON output (requires jq installed)
- Remove `| jq '.'` if you don't have jq installed

**Install jq (optional but recommended):**
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Or use without jq (ugly but works)
curl -s "URL" | python -m json.tool
```
