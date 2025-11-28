# Testing Guide: Polar.sh Integration (Milestones 1-6)

## What We've Built

✅ **Milestone 1:** Database - `subscriptions` table
✅ **Milestone 2:** Subscription service functions
✅ **Milestone 3:** Backend API endpoints
✅ **Milestone 4:** Frontend API client functions
✅ **Milestone 5:** Plan enforcement (2 questions/day for free, unlimited for paid)
✅ **Milestone 6:** Explanation gating (hidden for free users)

---

## Prerequisites

1. Database migration has been run (subscriptions table exists)
2. Backend dependencies installed (`npm install` in backend/)
3. Frontend dependencies installed (`npm install` in frontend/)

---

## Test 1: Start Backend Server

```bash
cd backend
npm run dev
```

**Expected output:**
```
🔍 Checking database connection...
✅ Database connected successfully
📝 Questions in database: [number]
🚀 Certverse API running on port 3001
```

**If successful:** Server is running at http://localhost:3001

---

## Test 2: Test Subscription Service

In a new terminal:

```bash
cd backend
npx tsx scripts/test-subscription-service.ts
```

**Expected output:**
```
🧪 Testing Subscription Service
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 1: Get subscription for new user
✅ Result: { user_id: 'test_...', plan_type: 'free', status: 'active' }

Test 2: Check if user is paid
✅ Is paid? false

Test 3: Upgrade user to paid
✅ Upgraded to paid

Test 4: Check subscription after upgrade
✅ Result: { plan_type: 'paid', status: 'active', polar_subscription_id: '...' }

Test 5: Check if user is paid after upgrade
✅ Is paid? true

Test 6: Downgrade user to free
✅ Downgraded to free

Test 7: Check subscription after downgrade
✅ Result: { plan_type: 'free', status: 'canceled' }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ All tests passed! Subscription service works!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Milestone 2 Complete!
```

---

## Test 3: Test API Endpoints

Run the API test script:

```bash
cd backend
./scripts/test-subscription-api.sh
```

**Expected output:**
```
🧪 Testing Subscription API Endpoints
=======================================

Test 1: GET /api/subscription (new user)
Response: {"id":"...","user_id":"test_...","plan_type":"free",...}
✅ Test 1 Passed: New user got free subscription

Test 2: POST /api/checkout/create
Response: {"url":"https://polar.sh/certverse/checkout?..."}
✅ Test 2 Passed: Got checkout URL

Test 3: GET /api/subscription (existing user)
Response: {"id":"...","user_id":"test_...",...}
✅ Test 3 Passed: Got existing subscription

Test 4: GET /api/subscription (missing userId)
Response: {"error":"Missing userId parameter"}
✅ Test 4 Passed: Error handling works

=======================================
✨ All subscription API tests complete!
```

---

## Test 4: Test Plan Enforcement (Manual)

### Test as Free User (2 questions/day)

```bash
# Get a test user ID
TEST_USER="test_free_$(date +%s)"

# Check unlock status
curl "http://localhost:3001/api/unlock/remaining?userId=$TEST_USER"
```

**Expected:** `{"remaining":2,"total":2,...}`

### Test as Paid User (unlimited)

```bash
# Create a paid user manually in Supabase
# Or use the test script to upgrade a user

# Check unlock status for paid user
curl "http://localhost:3001/api/unlock/remaining?userId=paid_user_id"
```

**Expected:** `{"remaining":999,"total":999,...}`

---

## Test 5: Test Explanation Gating (Manual)

### As Free User

```bash
TEST_USER="test_free_$(date +%s)"

# Get a question
QUESTION=$(curl -s "http://localhost:3001/api/question?userId=$TEST_USER")
QUESTION_ID=$(echo $QUESTION | jq -r '.id')

# Submit answer
curl -X POST "http://localhost:3001/api/submit" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$TEST_USER\",\"questionId\":\"$QUESTION_ID\",\"selectedChoice\":\"A\"}"
```

**Expected explanation:** `"⭐ Upgrade to Premium to see detailed explanations"`

### As Paid User

First, manually upgrade the user in Supabase:
- Go to subscriptions table
- Update user's `plan_type` to `'paid'` and `status` to `'active'`

Then submit an answer and check the explanation.

**Expected:** Full explanation text from the question

---

## Test 6: Test Frontend Integration

### Start Frontend

```bash
cd frontend
npm run dev
```

**Visit:** http://localhost:3000

### Test Subscription Fetch (Browser Console)

Open browser console and run:

```javascript
// Import the function (if needed, or call the API directly)
fetch('http://localhost:3001/api/subscription?userId=test_user_123')
  .then(r => r.json())
  .then(d => console.log('Subscription:', d))
```

**Expected:** Subscription object with `plan_type: 'free'`

---

## Verification Checklist

- [ ] Backend server starts without errors
- [ ] Subscription service tests pass
- [ ] API endpoint tests pass
- [ ] Free users limited to 2 questions/day
- [ ] Paid users get unlimited questions (999/day)
- [ ] Free users see upgrade message instead of explanations
- [ ] Paid users see full explanations
- [ ] Checkout URL generates correctly with Polar.sh link
- [ ] Database correctly stores subscription records

---

## Troubleshooting

### Backend won't start
- Check `.env` file has `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Verify database connection: `npx tsx -e "import {checkConnection} from './src/lib/supabase.js'; checkConnection().then(console.log)"`

### Tests hanging
- Check network connection
- Verify Supabase project is accessible
- Check for any firewall/VPN issues

### Subscriptions table doesn't exist
- Verify migration was run in Supabase dashboard
- Re-run the SQL from `backend/migrations/003_subscriptions.sql`

---

## Next Steps

After testing is complete, you can continue with:
- **Milestone 7:** Pricing page UI
- **Milestone 8:** Polar webhook handler
- **Milestone 9:** Settings page
- **Milestone 10:** End-to-end testing
