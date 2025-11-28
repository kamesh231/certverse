# Quick Start Testing Guide

## Summary: What's Been Implemented ✅

We've completed **6 out of 10 milestones** for Polar.sh integration:

### ✅ Completed Features

1. **Database Schema** - `subscriptions` table with all necessary fields
2. **Subscription Service** - `backend/src/services/subscriptionService.ts`
   - Get/create user subscription
   - Check if user is paid
   - Upgrade/downgrade functions
   - Status management
3. **API Endpoints** - Added to `backend/src/index.ts`
   - `GET /api/subscription?userId=xxx` - Get user's subscription
   - `POST /api/checkout/create` - Generate Polar checkout URL
4. **Frontend API Client** - Updated `frontend/lib/api.ts`
   - `getUserSubscription(userId)` - Fetch subscription
   - `createCheckoutUrl(userId, email)` - Get checkout link
5. **Plan Enforcement** - Updated `backend/src/services/unlockService.ts`
   - Free users: **2 questions/day**
   - Paid users: **999 questions/day** (unlimited)
6. **Explanation Gating** - Updated `backend/src/api/submit-answer.ts`
   - Free users: See "⭐ Upgrade to Premium" message
   - Paid users: See full explanations

---

## Quick Test Steps

### Step 1: Start Backend Server

```bash
cd backend
npm run dev
```

**Expected:** Server starts on port 3001

### Step 2: Test Subscription API (New Terminal)

```bash
# Test getting subscription for a new user
curl "http://localhost:3001/api/subscription?userId=test_user_123"

# Expected response:
{
  "id": "...",
  "user_id": "test_user_123",
  "plan_type": "free",
  "status": "active",
  "is_paid": false,
  ...
}
```

### Step 3: Test Checkout URL Generation

```bash
curl -X POST "http://localhost:3001/api/checkout/create" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test_user_123","userEmail":"test@example.com"}'

# Expected response:
{
  "url": "https://polar.sh/certverse/checkout?metadata[user_id]=test_user_123&prefilled_email=test@example.com"
}
```

### Step 4: Test Plan Limits

```bash
# Free user - should show 2 questions remaining
curl "http://localhost:3001/api/unlock/remaining?userId=test_free_user"

# Expected:
{"remaining": 2, "total": 2, ...}
```

### Step 5: Test Explanation Gating

```bash
# Get a question first
QUESTION=$(curl -s "http://localhost:3001/api/question?userId=test_free")
QUESTION_ID=$(echo $QUESTION | jq -r '.id')

# Submit answer as free user
curl -X POST "http://localhost:3001/api/submit" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"test_free\",\"questionId\":\"$QUESTION_ID\",\"selectedChoice\":\"A\"}"

# Check the explanation field - should say:
# "explanation": "⭐ Upgrade to Premium to see detailed explanations"
```

---

## Manual Testing via Supabase

You can also test by manually updating the database:

1. Go to Supabase Dashboard > Table Editor > `subscriptions`
2. Find or create a test user
3. Change `plan_type` to `'paid'` and `status` to `'active'`
4. Test the same user again - they should now get:
   - 999 questions/day (unlimited)
   - Full explanations

---

## Files Modified/Created

### Backend
- ✅ `backend/src/services/subscriptionService.ts` (NEW)
- ✅ `backend/src/services/unlockService.ts` (UPDATED - plan-based limits)
- ✅ `backend/src/api/submit-answer.ts` (UPDATED - explanation gating)
- ✅ `backend/src/index.ts` (UPDATED - new endpoints)

### Frontend
- ✅ `frontend/lib/api.ts` (UPDATED - subscription functions)

### Database
- ✅ `backend/migrations/003_subscriptions.sql` (RUN in Supabase)

### Test Scripts
- ✅ `backend/scripts/test-subscription-service.ts`
- ✅ `backend/scripts/test-subscription-api.sh`

---

## What's Left to Build

### Remaining 4 Milestones:

7. **Pricing Page** - UI showing Free vs Paid plans with checkout button
8. **Polar Webhook Handler** - Handles upgrade/downgrade events from Polar.sh
9. **Settings Page** - UI for users to manage their subscription
10. **End-to-End Testing** - Complete flow testing

---

## Environment Variables Needed (For Later)

When you set up Polar.sh, add these to backend `.env`:

```env
POLAR_ORGANIZATION=certverse
POLAR_WEBHOOK_SECRET=<from Polar dashboard>
```

---

## Troubleshooting

**Server won't start:**
- Check database credentials in `.env`
- Verify Supabase connection

**Subscription functions not working:**
- Confirm `subscriptions` table exists in Supabase
- Check table has correct schema from migration

**Tests hanging:**
- May be network/firewall issue
- Try testing via curl instead of test scripts

---

## Next Session

When you're ready to continue:
1. Complete the Pricing page (Milestone 7)
2. Build the Polar webhook handler (Milestone 8)
3. Add Settings page (Milestone 9)
4. End-to-end testing (Milestone 10)

Estimated: ~50k tokens to complete all 4 remaining milestones.
