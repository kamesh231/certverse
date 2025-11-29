# Polar Webhook Setup Guide

## Problem
When users cancel subscriptions in the Polar customer portal, the database doesn't update because webhooks aren't configured.

## Solution: Set Up Webhooks

### Step 1: Get Your Webhook URL

Your webhook endpoint is:
```
https://YOUR_RAILWAY_APP.up.railway.app/api/webhooks/polar
```

Replace `YOUR_RAILWAY_APP` with your actual Railway URL.

### Step 2: Configure in Polar Dashboard

#### For Sandbox Environment:
1. Go to https://sandbox.polar.sh/dashboard/YOUR_ORG/settings
2. Click on "Webhooks" tab
3. Click "Add Webhook"
4. Enter your webhook URL: `https://YOUR_APP.railway.app/api/webhooks/polar`
5. **Copy the webhook secret** (looks like: `whsec_xxx...`)
6. Select these events:
   - ✅ `checkout.completed`
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.canceled`
   - ✅ `subscription.ended`
   - ✅ `payment.failed`
7. Save

#### For Production Environment:
Same steps but at: https://polar.sh/dashboard/YOUR_ORG/settings

### Step 3: Update Environment Variables

Add/update in Railway:
```bash
POLAR_WEBHOOK_SECRET=whsec_xxx...  # The secret from Step 2
```

**Important:** The webhook secret is **different** for sandbox vs production!

### Step 4: Test Webhooks

#### Option A: Using Polar Dashboard
1. Go to Polar Dashboard → Webhooks
2. Find your webhook
3. Click "Send Test Event"
4. Check your Railway logs for webhook received

#### Option B: Make a real change
1. Go to customer portal as a test user
2. Cancel subscription
3. Check Railway logs - you should see:
   ```
   Received Polar webhook: subscription.canceled
   Subscription canceled for user user_xxx
   ```

### Step 5: Check Webhook Logs

In Railway:
```bash
# View logs
railway logs

# Filter for webhooks
railway logs | grep "webhook"
```

Look for:
- ✅ `Received Polar webhook: subscription.canceled`
- ✅ `Subscription canceled for user xxx`

## Troubleshooting

### Webhook Not Receiving Events

**Check 1: Is webhook URL correct?**
```bash
curl https://YOUR_APP.railway.app/api/webhooks/polar
# Should return: {"error":"Invalid signature"} (that's good - endpoint exists!)
```

**Check 2: Is webhook secret correct?**
- Must match between Polar dashboard and `POLAR_WEBHOOK_SECRET` in Railway
- Sandbox and production have **different** secrets

**Check 3: Is backend deployed?**
```bash
curl https://YOUR_APP.railway.app/health
# Should return: {"status":"ok","timestamp":"..."}
```

**Check 4: Check Polar webhook delivery logs**
- Go to Polar Dashboard → Webhooks
- Click on your webhook
- View "Recent Deliveries"
- Look for failed deliveries and error messages

### Common Errors

#### Error: "Invalid signature"
- **Cause:** `POLAR_WEBHOOK_SECRET` doesn't match
- **Fix:** Copy secret from Polar dashboard and update in Railway

#### Error: 404 Not Found
- **Cause:** Webhook URL is wrong
- **Fix:** Verify URL is `/api/webhooks/polar` (not `/webhook` or `/webhooks`)

#### Error: Timeout
- **Cause:** Backend not responding fast enough
- **Fix:** Check Railway logs for crashes/errors

## Manual Sync (Temporary Solution)

Until webhooks are set up, manually sync cancellations:

### Quick SQL Fix:
```sql
-- Mark subscription as canceled (still has access until period end)
UPDATE subscriptions
SET
  status = 'canceled',
  cancel_at = current_period_end,
  updated_at = NOW()
WHERE user_id = 'user_35w9rEJ46QL5Zl50DRx5URfYcn7';
```

### Verify:
```sql
SELECT user_id, plan_type, status, cancel_at, current_period_end
FROM subscriptions
WHERE user_id = 'user_35w9rEJ46QL5Zl50DRx5URfYcn7';
```

## What Each Event Does

| Event | What It Does |
|-------|--------------|
| `checkout.completed` | User completes payment → Upgrade to paid |
| `subscription.created` | New subscription created (usually with checkout) |
| `subscription.updated` | Subscription details changed |
| `subscription.canceled` | User cancels → Mark as canceling, keep access until period end |
| `subscription.ended` | Subscription ends → Downgrade to free |
| `payment.failed` | Payment fails → Mark as past_due |

## Expected User Flow

### When User Cancels:

1. **User clicks "Cancel" in customer portal**
2. **Polar sends `subscription.canceled` webhook**
3. **Backend receives webhook:**
   ```typescript
   // polar-webhook.ts:121-135
   handleSubscriptionCanceled(data)
   → updateSubscriptionStatus(userId, 'canceled', { cancelAt: ... })
   ```
4. **Database updates:**
   - `status` → `'canceled'`
   - `cancel_at` → `current_period_end`
5. **User sees in dashboard:**
   - "Subscription Canceling"
   - "Access until Dec 6, 2025"
6. **On Dec 6, Polar sends `subscription.ended`**
7. **Backend downgrade to free:**
   ```typescript
   handleSubscriptionEnded(data)
   → downgradeSubscription(userId)
   ```
8. **User now has free plan (2 questions/day)**

## Current State

### Without Webhooks:
- ❌ Cancellations don't sync
- ❌ Upgrades might not sync
- ❌ User sees wrong status

### With Webhooks:
- ✅ Real-time sync
- ✅ Accurate billing status
- ✅ Automatic downgrades
- ✅ No manual intervention

## Next Steps

1. ✅ Fix TypeScript errors (already done)
2. ✅ Fix customer portal URL (already done)
3. ⚠️  **Set up webhooks** (do this now!)
4. ⚠️  Fix environment mismatch (sandbox vs production tokens)
5. ⚠️  Test full flow (upgrade → cancel → downgrade)
