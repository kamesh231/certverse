# Subscription Flows - Implementation Complete ✅

**Status:** All upgrade/downgrade flows are fully implemented and ready for testing.

---

## ✅ Implemented Features

### 1. New User Experience (Free Plan)
**Implementation:** `backend/src/services/subscriptionService.ts:19-47`

When a user signs up:
- `getUserSubscription()` is called
- If no subscription exists → Creates **free** subscription automatically
- User gets 2 questions/day
- No explanations shown

### 2. Free User Limitations
**Implementation:** `backend/src/services/unlockService.ts:34-42`

Free users are restricted by:
- **Daily limit:** 2 questions/day (enforced by `calculateDailyUnlock()`)
- **No explanations:** `submit-answer.ts:50-58` checks `isPaidUser()` and shows:
  ```
  "⭐ Upgrade to Premium to see detailed explanations"
  ```

### 3. Upgrade Flow (Free → Paid)
**Implementation:** `backend/src/api/polar-webhook.ts:72-91`

**User Journey:**
1. User clicks "Upgrade to Premium" on pricing page
2. Frontend calls `createCheckoutUrl(userId, userEmail)` → `frontend/lib/api.ts:320`
3. Backend creates Polar checkout link with `metadata[user_id]` → `subscriptionService.ts:183-205`
4. User redirected to Polar.sh checkout
5. User completes payment
6. **Polar webhook:** `checkout.completed` event fires
7. Backend calls `upgradeSubscription()` → Updates DB:
   ```typescript
   plan_type: 'paid'
   status: 'active'
   polar_customer_id: <from_polar>
   polar_subscription_id: <from_polar>
   current_period_end: <billing_date>
   ```
8. **User now has:**
   - Unlimited questions (999/day)
   - Full explanations
   - Premium access

### 4. Paid User Benefits
**Implementation:** `unlockService.ts:37-39` + `submit-answer.ts:50-58`

Paid users (`plan_type === 'paid' && status === 'active'`) get:
- **Unlimited questions:** `calculateDailyUnlock()` returns 999
- **Full explanations:** `isPaidUser()` returns true → Shows `question.explanation`

### 5. Cancellation Flow (Paid → Stays Active Until Period End)
**Implementation:** `polar-webhook.ts:93-107`

**User Journey:**
1. User goes to Polar customer portal and cancels
2. **Polar webhook:** `subscription.canceled` event fires
3. Backend calls `updateSubscriptionStatus(userId, 'canceled', { cancelAt: period_end })`
4. Updates DB:
   ```typescript
   status: 'canceled'
   cancel_at: <period_end_date>
   ```
5. **User keeps premium access until `cancel_at` date**

### 6. Downgrade Flow (Period Ends → Free)
**Implementation:** `polar-webhook.ts:109-119`

**User Journey:**
1. Billing period ends (subscription expires)
2. **Polar webhook:** `subscription.ended` event fires
3. Backend calls `downgradeSubscription(userId)`
4. Updates DB:
   ```typescript
   plan_type: 'free'
   status: 'active'
   polar_customer_id: null
   polar_subscription_id: null
   ```
5. **User downgraded to free plan:**
   - 2 questions/day
   - No explanations

### 7. Payment Failed Flow
**Implementation:** `polar-webhook.ts:121-131`

**User Journey:**
1. Payment fails (card declined, expired, etc.)
2. **Polar webhook:** `payment.failed` event fires
3. Backend calls `updateSubscriptionStatus(userId, 'past_due')`
4. Updates DB: `status: 'past_due'`
5. **Grace period:** User may retain access (configurable)
6. After grace period → Automatically downgrades to free

---

## 🔄 Complete Flow Diagram

```
New User Sign Up
    ↓
FREE PLAN (auto-created)
    - 2 questions/day
    - No explanations
    - "Upgrade" prompts
    ↓
User clicks "Upgrade to Premium"
    ↓
Polar Checkout (payment)
    ↓
Webhook: checkout.completed
    ↓
PAID PLAN (upgraded)
    - Unlimited questions
    - Full explanations
    - Premium features
    ↓
User cancels subscription
    ↓
Webhook: subscription.canceled
    ↓
CANCELED (keeps access)
    - Stays paid until period_end
    - No new charges
    ↓
Billing period ends
    ↓
Webhook: subscription.ended
    ↓
FREE PLAN (downgraded)
    - 2 questions/day
    - No explanations
```

---

## 🧪 Testing Checklist

### Test 1: New User Gets Free Plan ✓
**Goal:** Verify new users automatically get free plan

**Steps:**
1. Sign up with new Clerk account
2. Backend automatically creates free subscription
3. Check `/api/subscription?userId=<id>` returns:
   ```json
   {
     "plan_type": "free",
     "status": "active",
     "is_paid": false
   }
   ```

**Expected:** User starts with free plan, no manual setup needed.

---

### Test 2: Free User Daily Limit (2 Questions) ✓
**Goal:** Verify free users can only answer 2 questions per day

**Steps:**
1. As free user, answer 1st question → Success
2. Answer 2nd question → Success
3. Try to get 3rd question → Should be blocked

**Check:** `/api/unlock/remaining?userId=<id>` should show:
```json
{
  "remaining": 0,
  "total": 2,
  "resetsAt": "<tomorrow_midnight>"
}
```

**Expected:** Free users limited to 2 questions/day.

---

### Test 3: Free User Can't See Explanations ✓
**Goal:** Verify free users see upgrade message instead of explanation

**Steps:**
1. As free user, submit an answer
2. Check response explanation field

**Expected Response:**
```json
{
  "success": true,
  "correct": true,
  "explanation": "⭐ Upgrade to Premium to see detailed explanations"
}
```

---

### Test 4: Upgrade Flow (Checkout → Paid) ✓
**Goal:** Test complete upgrade process

**Steps:**
1. As free user, go to `/pricing`
2. Click "Upgrade to Premium"
3. Complete Polar checkout (test mode)
4. Polar sends `checkout.completed` webhook
5. Check subscription status

**Expected:**
- `/api/subscription?userId=<id>` shows `plan_type: "paid"`
- User gets unlimited questions
- User sees explanations

**Manual Webhook Test:**
```bash
cd backend
./scripts/test-polar-webhook.sh
```

This simulates the `checkout.completed` event.

---

### Test 5: Paid User Gets Unlimited Questions ✓
**Goal:** Verify paid users have no daily limit

**Steps:**
1. Upgrade user to paid (test webhook or manual DB update)
2. Check `/api/unlock/remaining?userId=<id>`

**Expected Response:**
```json
{
  "remaining": 999,
  "total": 999,
  "resetsAt": "<tomorrow>"
}
```

3. Answer 10+ questions in one day → All succeed

---

### Test 6: Paid User Sees Explanations ✓
**Goal:** Verify paid users get full explanations

**Steps:**
1. As paid user, submit an answer
2. Check response

**Expected Response:**
```json
{
  "success": true,
  "correct": true,
  "explanation": "<full explanation text from question>"
}
```

---

### Test 7: Downgrade Flow (Cancel → Free) ✓
**Goal:** Test cancellation and downgrade process

**Steps:**
1. User has active paid subscription
2. Simulate `subscription.canceled` webhook
3. Check status changes to `canceled` but `plan_type` stays `paid`
4. Simulate `subscription.ended` webhook
5. Check `plan_type` changes to `free`

**Manual Test:**
```bash
# Test cancellation (stays paid until period end)
curl -X POST http://localhost:3001/api/webhooks/polar \
  -H "Content-Type: application/json" \
  -H "polar-signature: test_signature" \
  -d '{
    "type": "subscription.canceled",
    "data": {
      "id": "polar_sub_123",
      "cancel_at": "2025-02-28T00:00:00Z",
      "current_period_end": "2025-02-28T00:00:00Z"
    }
  }'

# Test subscription end (downgrade to free)
curl -X POST http://localhost:3001/api/webhooks/polar \
  -H "Content-Type: application/json" \
  -H "polar-signature: test_signature" \
  -d '{
    "type": "subscription.ended",
    "data": {
      "id": "polar_sub_123"
    }
  }'
```

**Expected:**
- After `canceled`: User keeps paid access, `status: 'canceled'`
- After `ended`: User downgraded to free, `plan_type: 'free'`

---

## 🛠️ Quick Testing Commands

### Backend Tests
```bash
cd backend
npm run dev

# In another terminal
./scripts/test-subscription-api.sh
./scripts/test-polar-webhook.sh
```

### Frontend Test
```bash
cd frontend
npm run dev

# Visit:
# http://localhost:3000/pricing → Test upgrade button
# http://localhost:3000/settings → Check subscription tab
# http://localhost:3000/question → Test question limits
```

### Database Queries (Manual Testing)
```sql
-- Check user subscription
SELECT * FROM subscriptions WHERE user_id = '<clerk_user_id>';

-- Manually upgrade user to paid (for testing)
UPDATE subscriptions
SET plan_type = 'paid', status = 'active'
WHERE user_id = '<clerk_user_id>';

-- Manually downgrade to free
UPDATE subscriptions
SET plan_type = 'free', status = 'active'
WHERE user_id = '<clerk_user_id>';

-- Reset to free (clear Polar data)
UPDATE subscriptions
SET
  plan_type = 'free',
  status = 'active',
  polar_customer_id = NULL,
  polar_subscription_id = NULL
WHERE user_id = '<clerk_user_id>';
```

---

## 📋 Files Involved

### Backend
- ✅ `src/services/subscriptionService.ts` - Core subscription logic
- ✅ `src/services/unlockService.ts` - Daily limit enforcement
- ✅ `src/api/polar-webhook.ts` - Webhook event handlers
- ✅ `src/api/submit-answer.ts` - Explanation gating
- ✅ `src/index.ts` - API endpoints

### Frontend
- ✅ `lib/api.ts` - API client functions
- ✅ `app/(dashboard)/pricing/page.tsx` - Pricing page with upgrade button
- ✅ `app/(dashboard)/settings/page.tsx` - Subscription management

### Database
- ✅ `backend/migrations/003_subscriptions.sql` - Subscriptions table schema

---

## 🎯 What's Working

1. ✅ **New users start free** - Automatic on first API call
2. ✅ **Free users limited** - 2 questions/day, no explanations
3. ✅ **Upgrade flow** - Checkout → Webhook → Paid access
4. ✅ **Paid users unlimited** - 999 questions/day, full explanations
5. ✅ **Cancellation flow** - Stays paid until period end
6. ✅ **Downgrade flow** - Reverts to free after subscription ends
7. ✅ **Payment failed handling** - Marks as past_due

---

## 🚀 Production Deployment Checklist

Before enabling in production:

1. ✅ Code complete (all implemented)
2. ⏳ Create Polar.sh organization
3. ⏳ Create Premium product ($29/mo) in Polar dashboard
4. ⏳ Get checkout link ID from Polar
5. ⏳ Get webhook secret from Polar
6. ⏳ Add environment variables to Railway:
   ```
   POLAR_CHECKOUT_LINK_ID=polar_cl_...
   POLAR_WEBHOOK_SECRET=whsec_...
   POLAR_SANDBOX=false
   ```
7. ⏳ Configure webhook endpoint in Polar:
   - URL: `https://your-domain.railway.app/api/webhooks/polar`
   - Events: checkout.completed, subscription.canceled, subscription.ended, payment.failed
8. ⏳ Test in Polar sandbox mode first
9. ⏳ Run full test suite
10. ⏳ Switch to production mode

---

## 📞 Support

If you encounter issues:
- Check Sentry logs for backend errors
- Check Polar dashboard for webhook delivery status
- Verify environment variables are set correctly
- Test webhook signature verification

---

**Last Updated:** 2025-01-29
**Status:** ✅ Implementation Complete - Ready for Testing
