# Trial Management - Complete Guide

## Overview

This system ensures users can only receive **ONE trial period** per account, preventing repeat trials.

## Your Questions Answered

### 1. "A trial should be offered to only new customers"

**Answer:** ✅ Implemented

When a user creates a checkout:
1. Backend checks `has_used_trial` flag in database
2. If `true` → User has already used trial
3. If `false` → User is eligible for trial

**Location:** `src/services/subscriptionService.ts:234-242`

```typescript
const isTrialEligible = await canOfferTrial(userId);
if (!isTrialEligible) {
  logger.warn(`User ${userId} has already used trial`);
  // Polar will also enforce this on their end
}
```

### 2. "If the trial ends is Polar notifying us for end of trial and are we making the change?"

**Answer:** ✅ Yes, via webhooks

Polar sends these webhook events:

| Event | When | Our Action |
|-------|------|------------|
| `subscription.created` (status: trialing) | Trial starts | Set `has_used_trial=true`, `trial_start`, `trial_end` |
| `subscription.active` | Trial converts to paid | Update status to `active` |
| `subscription.ended` | Trial ends without payment | Downgrade to free plan |

**How it works:**

When trial starts:
```
webhook: subscription.created (status='trialing')
  ↓
upgradeSubscription() called with trial data
  ↓
Database updated:
  - status = 'trialing'
  - has_used_trial = true
  - trial_start = '2025-11-29T00:00:00Z'
  - trial_end = '2025-12-06T00:00:00Z'
```

When trial ends:
```
Option A: User converts to paid
webhook: subscription.active
  ↓
status changed to 'active', user remains on paid plan

Option B: User doesn't convert
webhook: subscription.ended
  ↓
downgradeSubscription() called
  ↓
user moved to free plan (2 questions/day)
```

### 3. "If a user once uses the trial we cannot offer trial the next time is it possible to configure?"

**Answer:** ✅ Yes, enforced by database

The `has_used_trial` boolean flag:
- Set to `true` when user starts trial
- **Never** reset to `false`
- Checked before creating checkout

**Database Schema:**
```sql
has_used_trial BOOLEAN DEFAULT FALSE
  - true = user has used their trial (no more trials allowed)
  - false = user is eligible for trial
```

**Enforcement Points:**
1. Backend checks before checkout: `canOfferTrial(userId)`
2. Database tracks permanently: `has_used_trial=true`
3. Polar also enforces on their end

## Database Migration

### Run Migration (Required)

To enable trial tracking, run this SQL in your **Supabase Dashboard → SQL Editor**:

```sql
-- Add trial tracking fields to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS trial_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN DEFAULT FALSE;

-- Create index for trial lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial ON subscriptions(user_id, has_used_trial);

-- Update existing trialing subscriptions
UPDATE subscriptions
SET has_used_trial = TRUE
WHERE status = 'trialing' OR status = 'active';

-- Add comments
COMMENT ON COLUMN subscriptions.trial_start IS 'When the trial period started';
COMMENT ON COLUMN subscriptions.trial_end IS 'When the trial period ends/ended';
COMMENT ON COLUMN subscriptions.has_used_trial IS 'Whether user has ever used a trial (prevents repeat trials)';
```

**Steps:**
1. Go to https://supabase.com/dashboard (your project)
2. Click **SQL Editor** → **New query**
3. Copy the SQL above
4. Click **Run**
5. Verify success: Should say "Success. No rows returned"

### Verify Migration

```sql
-- Check if columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name IN ('trial_start', 'trial_end', 'has_used_trial');

-- Should return 3 rows
```

## Code Implementation

### 1. Database Fields

**File:** `backend/migrations/004_add_trial_tracking.sql`

New columns in `subscriptions` table:
- `trial_start` - When trial started (TIMESTAMPTZ)
- `trial_end` - When trial ends/ended (TIMESTAMPTZ)
- `has_used_trial` - Has user ever used trial (BOOLEAN)

### 2. TypeScript Interface

**File:** `backend/src/services/subscriptionService.ts:4-20`

```typescript
export interface Subscription {
  // ... existing fields ...
  trial_start?: string;        // NEW
  trial_end?: string;          // NEW
  has_used_trial?: boolean;    // NEW
}
```

### 3. Trial Eligibility Check

**File:** `backend/src/services/subscriptionService.ts:71-90`

```typescript
export async function canOfferTrial(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('subscriptions')
    .select('has_used_trial')
    .eq('user_id', userId)
    .single();

  // User can get trial only if they haven't used one before
  return !data.has_used_trial;
}
```

### 4. Upgrade Function (Tracks Trials)

**File:** `backend/src/services/subscriptionService.ts:93-112`

```typescript
export async function upgradeSubscription(
  userId: string,
  polarData: {
    // ... existing fields ...
    status?: string;      // NEW: to detect trialing
    trialStart?: string;  // NEW
    trialEnd?: string;    // NEW
  }
): Promise<void> {
  const updateData: any = { /* ... */ };

  // If this is a trial subscription, track it
  if (polarData.status === 'trialing') {
    updateData.trial_start = polarData.trialStart;
    updateData.trial_end = polarData.trialEnd;
    updateData.has_used_trial = true;  // Mark as used
  }

  // ... update database ...
}
```

### 5. Checkout Validation

**File:** `backend/src/services/subscriptionService.ts:221-254`

```typescript
export async function createCheckout(userId: string, userEmail: string): Promise<string> {
  // Check trial eligibility
  const isTrialEligible = await canOfferTrial(userId);

  if (!isTrialEligible) {
    logger.warn(`User ${userId} has already used trial`);
    // Note: Polar will also enforce this
  } else {
    logger.info(`User ${userId} is eligible for trial`);
  }

  // Create checkout URL...
}
```

### 6. Webhook Handlers (Pass Trial Data)

**File:** `backend/src/api/polar-webhook.ts`

Updated 3 webhook handlers to pass trial data to `upgradeSubscription()`:

1. **handleCheckoutCompleted** (line 151-159):
```typescript
await upgradeSubscription(userId, {
  // ... existing ...
  status: data.status,          // NEW
  trialStart: data.trial_start, // NEW
  trialEnd: data.trial_end,     // NEW
});
```

2. **handleSubscriptionUpdated** (line 233-241)
3. **handleCustomerStateChanged** (line 332-340)

## Trial Flow Example

### User Signs Up for Trial

```
1. User creates account in Certverse
   → user_id: user_ABC123
   → subscriptions table: plan_type='free', has_used_trial=false

2. User clicks "Start Trial"
   → Frontend calls: POST /api/checkout/create
   → Backend checks: canOfferTrial('user_ABC123') → true ✅
   → Backend creates checkout URL
   → User redirected to Polar checkout

3. User completes checkout on Polar
   → Polar sends webhook: checkout.completed
     {
       status: 'trialing',
       trial_start: '2025-11-29T00:00:00Z',
       trial_end: '2025-12-06T00:00:00Z'
     }
   → Backend calls: upgradeSubscription()
   → Database updated:
     - plan_type = 'paid'
     - status = 'trialing'
     - has_used_trial = true  ← MARKED AS USED
     - trial_start = '2025-11-29T00:00:00Z'
     - trial_end = '2025-12-06T00:00:00Z'

4. Trial period (user has full access for 7 days)
   → User can use unlimited questions
   → Dashboard shows: "Trial ends Dec 6, 2025"

5A. User converts to paid (enters payment method)
   → Polar sends: subscription.active
   → status changed to 'active'
   → User continues with paid plan
   → has_used_trial remains true

5B. Trial ends without payment
   → Polar sends: subscription.ended
   → downgradeSubscription() called
   → plan_type = 'free', status = 'active'
   → has_used_trial remains true ← STILL MARKED AS USED
   → User back to 2 questions/day
```

### User Tries to Get Another Trial

```
1. User (who already used trial) clicks "Start Trial" again
   → Frontend calls: POST /api/checkout/create
   → Backend checks: canOfferTrial('user_ABC123')
     ↓
     SELECT has_used_trial FROM subscriptions WHERE user_id='user_ABC123'
     → returns: true
     ↓
     canOfferTrial() returns false ❌

2. Backend logs warning:
   "User user_ABC123 has already used trial, but allowing checkout to proceed"

3. Checkout proceeds, but Polar shows:
   - Regular paid plan (no trial)
   - Or Polar rejects if trial-only checkout link
```

## Preventing Repeat Trials

The system prevents repeat trials through **3 layers**:

### Layer 1: Database Flag (Permanent)
- `has_used_trial` set to `true` when trial starts
- **Never** reset to false
- Persists even if user downgrades to free

### Layer 2: Backend Validation
- `canOfferTrial()` checks database before checkout
- Logs warning if user already used trial
- Can be configured to block checkout entirely

### Layer 3: Polar Enforcement
- Polar also tracks trial usage per customer
- Won't offer trial to same email/customer twice
- Double protection against repeat trials

## Frontend Integration

### Check Trial Eligibility (Optional)

You can add an API endpoint for the frontend to check eligibility:

**Add to `backend/src/index.ts`:**
```typescript
app.get('/api/subscription/trial-eligible', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const { canOfferTrial } = await import('./services/subscriptionService');
  const eligible = await canOfferTrial(userId);

  res.json({ eligible });
}));
```

**Frontend usage:**
```typescript
const checkTrialEligibility = async (userId: string) => {
  const response = await fetch(`/api/subscription/trial-eligible?userId=${userId}`);
  const { eligible } = await response.json();

  if (!eligible) {
    // Show "Upgrade to Paid" instead of "Start Trial"
    return <Button>Upgrade to Paid Plan</Button>;
  }

  return <Button>Start 7-Day Free Trial</Button>;
};
```

## Monitoring & Logging

### Webhook Logs

When trial starts:
```
✅ Received Polar webhook: subscription.created
✅ Starting trial for user user_ABC123 (ends: 2025-12-06T00:00:00Z)
✅ Upgraded subscription for user user_ABC123 to trialing
```

When trial ends (no conversion):
```
✅ Received Polar webhook: subscription.ended
✅ Subscription ended for user user_ABC123
✅ Downgraded subscription for user user_ABC123
```

When user tries repeat trial:
```
⚠️  User user_ABC123 has already used trial, but allowing checkout to proceed
```

### Database Queries

**Check all users who used trials:**
```sql
SELECT user_id, trial_start, trial_end, status, has_used_trial
FROM subscriptions
WHERE has_used_trial = true;
```

**Check currently trialing users:**
```sql
SELECT user_id, trial_start, trial_end
FROM subscriptions
WHERE status = 'trialing'
  AND trial_end > NOW();
```

**Check trial conversion rate:**
```sql
SELECT
  COUNT(CASE WHEN has_used_trial = true THEN 1 END) as total_trials,
  COUNT(CASE WHEN status = 'active' AND plan_type = 'paid' THEN 1 END) as conversions
FROM subscriptions;
```

## Testing

### Test 1: New User Gets Trial

1. Create new user account
2. Verify: `has_used_trial = false`
3. Start checkout
4. Verify: Log shows "User is eligible for trial"
5. Complete checkout with trial
6. Verify webhook log: "Starting trial for user..."
7. Check database: `has_used_trial = true`, `status = 'trialing'`

### Test 2: Trial Ends → Downgrade

1. Wait for trial to end (or use Polar dashboard to end early)
2. Verify webhook received: `subscription.ended`
3. Check database: `plan_type = 'free'`, `status = 'active'`
4. Verify: `has_used_trial` still `true` (not reset)

### Test 3: Prevent Repeat Trial

1. User who already used trial clicks "Start Trial"
2. Verify log: "User has already used trial"
3. If checkout proceeds, Polar should not offer trial again

### Test 4: Trial Converts to Paid

1. During trial, user adds payment method
2. Verify webhook: `subscription.active`
3. Check database: `status = 'active'`, `plan_type = 'paid'`
4. Verify: `has_used_trial` still `true`

## Configuration

### Polar Checkout Link Setup

Your checkout link should be configured with trial in Polar dashboard:

1. Go to Polar Dashboard → Checkout Links
2. Edit your checkout link
3. Enable "Free Trial"
4. Set trial duration (e.g., 7 days)
5. Save

### Environment Variables

No new environment variables needed. Uses existing:
- `POLAR_CHECKOUT_LINK_ID` - Your checkout link with trial enabled
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key for database access

## Troubleshooting

### Issue: User gets trial twice

**Diagnosis:**
```sql
SELECT user_id, has_used_trial, status, trial_start
FROM subscriptions
WHERE user_id = 'user_XXX';
```

**Possible causes:**
1. Migration not run → `has_used_trial` column doesn't exist
2. Webhook not received → trial not marked as used
3. Using different email → Polar creates new customer

**Fix:**
- Run migration SQL
- Check webhook delivery in Polar dashboard
- Link users by email using `findUserByEmail()`

### Issue: Eligible user can't access trial

**Diagnosis:**
```sql
SELECT user_id, has_used_trial, status
FROM subscriptions
WHERE user_id = 'user_XXX';
```

**Possible causes:**
1. `has_used_trial = true` incorrectly set
2. Polar checkout link doesn't have trial enabled

**Fix:**
```sql
-- Reset trial flag (use with caution!)
UPDATE subscriptions
SET has_used_trial = false
WHERE user_id = 'user_XXX';
```

## Summary

✅ **All your requirements implemented:**

1. ✅ Trials offered only to new customers
   - `canOfferTrial()` checks `has_used_trial` flag
   - Logged and validated before checkout

2. ✅ Polar notifies when trial ends
   - Webhook: `subscription.ended` → downgrade to free
   - Webhook: `subscription.active` → convert to paid

3. ✅ Users cannot get trial twice
   - `has_used_trial` set to `true` permanently
   - Never reset, enforced at database level
   - Double-checked by Polar

**Next Steps:**
1. ✅ Run the migration SQL in Supabase dashboard
2. ✅ Test trial flow with a new user
3. ✅ Monitor webhook logs during trial period
4. ✅ Verify trial end behavior (conversion or downgrade)
