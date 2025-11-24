# Certverse API - cURL Examples

Quick reference for testing API endpoints.

## Setup

```bash
# Local
export API_URL="http://localhost:3001"

# Production (after deployment)
export API_URL="https://certverse-backend.up.railway.app"

# Test user
export USER_ID="test-user-123"
```

---

## Endpoints

### 1. Health Check

```bash
curl $API_URL/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-24T10:00:00.000Z",
  "database": "connected"
}
```

---

### 2. API Information

```bash
curl $API_URL/
```

**Expected Response:**
```json
{
  "name": "Certverse API",
  "version": "1.0.0",
  "description": "Backend API for CISA exam preparation platform",
  "endpoints": {
    "health": "GET /health",
    "question": "GET /api/question?userId=xxx",
    "submit": "POST /api/submit",
    "stats": "GET /api/stats?userId=xxx",
    "history": "GET /api/history?userId=xxx"
  }
}
```

---

### 3. Get Random Question

```bash
curl "$API_URL/api/question?userId=$USER_ID"
```

**Expected Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "domain": 1,
  "q_text": "What is the PRIMARY purpose of an IS audit charter?",
  "choice_a": "To define the scope of individual audit engagements",
  "choice_b": "To establish the authority, responsibility, and accountability of the IS audit function",
  "choice_c": "To document audit findings and recommendations",
  "choice_d": "To ensure compliance with regulatory requirements",
  "answer": "B",
  "explanation": "An IS audit charter establishes the authority...",
  "created_at": "2025-01-24T10:00:00.000Z"
}
```

**Save question ID for next request:**
```bash
QUESTION_ID=$(curl -s "$API_URL/api/question?userId=$USER_ID" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\(.*\)"/\1/')
echo $QUESTION_ID
```

---

### 4. Submit Answer (Correct)

```bash
curl -X POST "$API_URL/api/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"questionId\": \"$QUESTION_ID\",
    \"selectedChoice\": \"B\"
  }"
```

**Expected Response:**
```json
{
  "success": true,
  "correct": true,
  "correctAnswer": "B",
  "explanation": "An IS audit charter establishes the authority...",
  "responseId": "response-uuid-here"
}
```

---

### 5. Submit Answer (Incorrect)

```bash
curl -X POST "$API_URL/api/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"questionId\": \"$QUESTION_ID\",
    \"selectedChoice\": \"A\"
  }"
```

**Expected Response:**
```json
{
  "success": true,
  "correct": false,
  "correctAnswer": "B",
  "explanation": "An IS audit charter establishes the authority...",
  "responseId": "response-uuid-here"
}
```

---

### 6. Get User Statistics

```bash
curl "$API_URL/api/stats?userId=$USER_ID"
```

**Expected Response:**
```json
{
  "totalAnswered": 10,
  "totalCorrect": 8,
  "accuracy": 80.00
}
```

---

### 7. Get User Answer History

```bash
# Last 10 answers (default)
curl "$API_URL/api/history?userId=$USER_ID"

# Last 5 answers
curl "$API_URL/api/history?userId=$USER_ID&limit=5"
```

**Expected Response:**
```json
[
  {
    "id": "response-uuid-1",
    "user_id": "test-user-123",
    "question_id": "question-uuid-1",
    "selected_choice": "B",
    "correct": true,
    "created_at": "2025-01-24T10:05:00.000Z"
  },
  {
    "id": "response-uuid-2",
    "user_id": "test-user-123",
    "question_id": "question-uuid-2",
    "selected_choice": "A",
    "correct": false,
    "created_at": "2025-01-24T10:04:00.000Z"
  }
]
```

---

### 8. Get Question Count

```bash
curl "$API_URL/api/question-count"
```

**Expected Response:**
```json
{
  "count": 20
}
```

---

## Complete Test Flow

Run this sequence to test full user journey:

```bash
#!/bin/bash

# Setup
export API_URL="http://localhost:3001"
export USER_ID="test-$(date +%s)"

echo "Testing with User ID: $USER_ID"

# 1. Health check
echo -e "\n1. Health Check:"
curl -s $API_URL/health | jq

# 2. Get question
echo -e "\n2. Get Question:"
QUESTION=$(curl -s "$API_URL/api/question?userId=$USER_ID")
echo $QUESTION | jq
QUESTION_ID=$(echo $QUESTION | jq -r '.id')
ANSWER=$(echo $QUESTION | jq -r '.answer')

# 3. Submit correct answer
echo -e "\n3. Submit Correct Answer ($ANSWER):"
curl -s -X POST "$API_URL/api/submit" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"questionId\":\"$QUESTION_ID\",\"selectedChoice\":\"$ANSWER\"}" | jq

# 4. Get another question
echo -e "\n4. Get Another Question:"
QUESTION2=$(curl -s "$API_URL/api/question?userId=$USER_ID")
QUESTION_ID2=$(echo $QUESTION2 | jq -r '.id')

# 5. Submit wrong answer
echo -e "\n5. Submit Wrong Answer (A):"
curl -s -X POST "$API_URL/api/submit" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"questionId\":\"$QUESTION_ID2\",\"selectedChoice\":\"A\"}" | jq

# 6. Check stats
echo -e "\n6. User Stats:"
curl -s "$API_URL/api/stats?userId=$USER_ID" | jq

# 7. Check history
echo -e "\n7. Answer History:"
curl -s "$API_URL/api/history?userId=$USER_ID&limit=5" | jq

echo -e "\n✅ Test complete!"
```

**Save as `test-flow.sh` and run:**
```bash
chmod +x test-flow.sh
./test-flow.sh
```

---

## Error Cases

### Missing userId
```bash
curl "$API_URL/api/question"
```
**Response:**
```json
{
  "error": "Missing userId parameter"
}
```

### Invalid Question ID
```bash
curl -X POST "$API_URL/api/submit" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","questionId":"invalid","selectedChoice":"A"}'
```
**Response:**
```json
{
  "success": false,
  "correct": false,
  "correctAnswer": "",
  "explanation": "",
  "error": "Question not found"
}
```

### Invalid Choice
```bash
curl -X POST "$API_URL/api/submit" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","questionId":"valid-id","selectedChoice":"Z"}'
```
**Response:**
```json
{
  "success": false,
  "correct": false,
  "correctAnswer": "",
  "explanation": "",
  "error": "Invalid choice. Must be A, B, C, or D"
}
```

---

## Using with jq (Pretty Print)

Install jq for formatted JSON:
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

Then pipe responses:
```bash
curl -s "$API_URL/api/question?userId=$USER_ID" | jq
```

---

## Postman Collection

Import this into Postman:

```json
{
  "info": {
    "name": "Certverse API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001"
    },
    {
      "key": "userId",
      "value": "test-user-123"
    }
  ],
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/health"
      }
    },
    {
      "name": "Get Question",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/question?userId={{userId}}"
      }
    },
    {
      "name": "Submit Answer",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/submit",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"userId\": \"{{userId}}\",\n  \"questionId\": \"paste-question-id-here\",\n  \"selectedChoice\": \"B\"\n}"
        }
      }
    },
    {
      "name": "Get Stats",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/stats?userId={{userId}}"
      }
    }
  ]
}
```

---

**Happy Testing! 🚀**
