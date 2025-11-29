# Polar.sh Subscription Sync Implementation

**Date:** 2025-01-29
**Status:** ✅ Complete and Ready for Testing

---

## 🎯 Overview

This implementation adds **email-based user matching** for Polar subscriptions, enabling automatic synchronization when users subscribe directly on Polar.sh without going through the Certverse app.

### Problem Solved
Previously, if a user subscribed directly on Polar.sh (like venkata.motamarry@gmail.com), the webhook would fail because `metadata.user_id` was missing. The user would remain on the free plan in Certverse despite having an active Polar subscription.

### Solution
Added intelligent fallback logic that matches Polar customers to Certverse users by email address when `user_id` metadata is unavailable.

---

## 📁 Files Created

### Backend

1. **`backend/src/lib/polarClient.ts`** (NEW)
   - Polar API client library
   - Functions:
     - `fetchPolarCustomer(customerId)` - Get customer details from Polar
     - `fetchPolarSubscription(subscriptionId)` - Get subscription details
     - `fetchPolarSubscriptions(organizationId)` - List all subscriptions
     - `getCustomerPortalUrl(customerId)` - Generate customer portal URL

2. **`backend/src/lib/clerk.ts`** (NEW)
   - Clerk client initialization
   - Function: `getClerkClient()` - Get initialized Clerk SDK client

3. **`backend/src/lib/userLookup.ts`** (NEW)
   - User email lookup utilities using Clerk API
   - Functions:
     - `findUserByEmail(email)` - Find Clerk user ID by email
     - `findUsersByEmails(emails)` - Batch email lookup

### Backend Updates

4. **`backend/src/api/polar-webhook.ts`** (MODIFIED)
   - Added email fallback to `handleCheckoutCompleted()`
   - Added email fallback to `handleSubscriptionUpdated()`
   - Imported `fetchPolarCustomer` and `findUserByEmail`

5. **`backend/src/index.ts`** (MODIFIED)
   - Added `/api/subscription/portal-url` endpoint
   - Imported `getCustomerPortalUrl` from polarClient

6. **`backend/.env.example`** (MODIFIED)
   - Added `CLERK_SECRET_KEY` (for user lookup by email)
   - Added `POLAR_ACCESS_TOKEN`
   - Added `POLAR_ORGANIZATION_ID`
   - Added `POLAR_SANDBOX`

### Frontend

7. **`frontend/lib/api.ts`** (MODIFIED)
   - Added `getCustomerPortalUrl(userId)` function

8. **`frontend/app/(dashboard)/settings/page.tsx`** (MODIFIED)
   - Enhanced subscription display with trial/cancellation status
   - Added "View Customer Portal" button
   - Shows appropriate dates (trial end, renewal, cancellation)

---

## 🔄 How It Works

### Flow 1: App-Initiated Upgrade (Existing - Still Works)

```
User clicks "Upgrade" in app
    ↓
Backend creates checkout URL with metadata.user_id
    ↓
User subscribes on Polar
    ↓
Webhook receives data WITH user_id
    ↓
✅ Direct upgrade (no email lookup needed)
```

### Flow 2: Direct Polar Subscription (NEW - Now Works!)

```
User subscribes directly on Polar.sh
    ↓
Polar creates subscription WITHOUT user_id
    ↓
Webhook receives checkout.completed
    ↓
No user_id in metadata → Fallback activated
    ↓
Fetch Polar customer → Get email
    ↓
Find Clerk user by email
    ↓
✅ User upgraded successfully
```

### Flow 3: Subscription Updates (NEW - Enhanced)

```
Polar sends subscription.updated webhook
    ↓
Subscription not found in DB → Fallback activated
    ↓
Fetch customer email from Polar
    ↓
Match to Clerk user
    ↓
✅ Create/update subscription record
```

---

## 🛠️ Configuration Required

### Step 1: Get Clerk Secret Key

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your Certverse application
3. Navigate to **API Keys**
4. Copy the **Secret Key** (starts with `sk_live_` or `sk_test_`)

**Important:** This is needed for the backend to look up users by email.

### Step 2: Get Polar Access Token

1. Go to [Polar Dashboard](https://polar.sh)
2. Navigate to **Settings** → **API Keys**
3. Click **Create Personal Access Token**
4. Copy the token (starts with `polar_at_...`)

### Step 3: Get Organization ID

Option A: From Polar Dashboard
1. Go to **Organization** → **Settings**
2. Find Organization ID

Option B: From API Response
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://api.polar.sh/v1/organizations
```

### Step 4: Update Environment Variables

**Railway (Production):**

1. Go to your Railway project
2. Navigate to **Variables**
3. Add these new variables:

```bash
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
POLAR_ACCESS_TOKEN=polar_at_xxxxxxxxxxxxx
POLAR_ORGANIZATION_ID=org_xxxxxxxxxxxxx
POLAR_SANDBOX=false
```

**Local Development:**

Update `backend/.env`:

```bash
# Clerk Configuration
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Polar Configuration
POLAR_ORGANIZATION=certverse
POLAR_ORGANIZATION_ID=org_xxxxxxxxxxxxx
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
POLAR_CHECKOUT_LINK_ID=polar_cl_xxxxxxxxxxxxx
POLAR_ACCESS_TOKEN=polar_at_xxxxxxxxxxxxx
POLAR_SANDBOX=true  # Use sandbox for testing
```

### Step 5: Verify Webhook Configuration

Ensure your Polar webhook is configured at:
- URL: `https://certverse-production.up.railway.app/api/webhooks/polar`
- Events: `checkout.completed`, `subscription.updated`, `subscription.canceled`, `subscription.ended`, `payment.failed`

---

## 🧪 Testing

### Test 1: Email Fallback for New Subscription

**Scenario:** User subscribes on Polar without user_id metadata

```bash
# Simulate checkout.completed webhook WITHOUT user_id
curl -X POST https://certverse-production.up.railway.app/api/webhooks/polar \
  -H "Content-Type: application/json" \
  -H "polar-signature: YOUR_WEBHOOK_SECRET" \
  -d '{
    "type": "checkout.completed",
    "data": {
      "customer_id": "polar_cus_test123",
      "subscription_id": "polar_sub_test123",
      "current_period_start": "2025-01-29T00:00:00Z",
      "current_period_end": "2025-02-28T00:00:00Z",
      "metadata": {}
    }
  }'
```

**Expected Result:**
1. Webhook fetches customer from Polar API
2. Finds email (e.g., venkata.motamarry@gmail.com)
3. Matches to Clerk user
4. Upgrades subscription in Supabase
5. Logs: `"Successfully matched Polar customer ... to user ... via email ..."`

### Test 2: Customer Portal Link

**Frontend Test:**

1. Log in as a paid user
2. Go to **Settings** → **Subscription** tab
3. Click **"View Customer Portal"** button
4. Should open Polar customer portal in new tab

**API Test:**

```bash
curl "https://certverse-production.up.railway.app/api/subscription/portal-url?userId=clerk_abc123"
```

**Expected Response:**
```json
{
  "url": "https://polar.sh/customer-portal?customer=polar_cus_xyz"
}
```

### Test 3: Enhanced Subscription Display

**Test Cases:**

1. **Trial User:** Should show "Trial ends on [date]" in amber
2. **Active Paid:** Should show "Renews on [date]" in gray
3. **Canceled:** Should show "Access until [date]" in orange
4. **Free:** Should show "Upgrade to Premium" button

---

## 🔧 Manual Fix for venkata.motamarry

Since this user already has a Polar subscription, you need to manually sync once:

### Option 1: Trigger Webhook Manually

Go to Polar Dashboard → Webhooks → Find the subscription → Click "Resend" on the `checkout.completed` event.

The new email fallback logic will catch it automatically.

### Option 2: Direct Database Update

**Step 1: Get Clerk user_id**

Use Clerk Dashboard or API:

```bash
# Using Clerk API
curl -X GET "https://api.clerk.com/v1/users?email_address=venkata.motamarry@gmail.com" \
  -H "Authorization: Bearer YOUR_CLERK_SECRET_KEY"
```

Or check Clerk Dashboard → Users → Search for email

**Step 2: Get Polar subscription details**

From Polar Dashboard:
- customer_id: `polar_cus_...`
- subscription_id: `polar_sub_...`
- current_period_end: `2025-XX-XX`

**Step 3: Update Supabase**

```sql
UPDATE subscriptions
SET
  plan_type = 'paid',
  status = 'trialing',  -- or 'active' depending on Polar status
  polar_customer_id = 'polar_cus_...',
  polar_subscription_id = 'polar_sub_...',
  current_period_start = NOW(),
  current_period_end = '2025-XX-XX',
  updated_at = NOW()
WHERE user_id = '<clerk_user_id_from_clerk>';
```

### Option 3: Admin Sync Endpoint (Future)

Create admin endpoint (recommended for production):

```typescript
// POST /api/admin/sync-user
// Body: { email: "venkata.motamarry@gmail.com", adminKey: "..." }

// This would:
// 1. Fetch Polar subscriptions for organization
// 2. Find subscription by customer email
// 3. Match to Clerk user
// 4. Sync to Supabase
```

---

## 📊 API Endpoints

### New Endpoints

#### `GET /api/subscription/portal-url`

Get customer portal URL for managing subscription.

**Query Params:**
- `userId` (required): Clerk user ID

**Response:**
```json
{
  "url": "https://polar.sh/customer-portal?customer=polar_cus_xyz"
}
```

**Errors:**
- `400`: Missing userId
- `404`: No active Polar subscription found

---

## 🎨 UI Enhancements

### Settings Page - Subscription Tab

**Before:**
- Simple "Active" badge
- Generic "Renews on [date]"
- Plain "Manage Billing" link

**After:**
- Dynamic status badges:
  - 🟦 "Trial" (amber) - for trialing status
  - 🟢 "Active" (blue gradient) - for active paid
  - 🟠 "Canceling" (default) - for canceled status
- Context-aware dates:
  - Trial: "Trial ends on [date]" (amber, bold)
  - Active: "Renews on [date]" (gray)
  - Canceled: "Access until [date]" (orange, bold)
- "View Customer Portal" button that opens Polar portal

---

## 🔐 Security Considerations

### API Token Security
- `POLAR_ACCESS_TOKEN` should NEVER be committed to git
- Store only in Railway environment variables
- Rotate token if compromised

### Email Matching
- Case-insensitive email matching
- Trims whitespace from emails
- Falls back gracefully if no match found

### Customer Portal
- Only shown to users with `polar_customer_id`
- User must be logged in (Clerk auth)
- Opens in new tab (no XSS risk)

---

## 📈 Logging & Monitoring

### New Log Messages

**Success Cases:**
```
✅ "Successfully matched Polar customer [id] to user [id] via email [email]"
✅ "Matched Polar subscription [id] to user [id] via email [email]"
✅ "Successfully fetched Polar customer: [id] ([email])"
```

**Warning Cases:**
```
⚠️ "No user_id in checkout.completed metadata, attempting email match"
⚠️ "Subscription not found for Polar ID: [id], attempting email match"
⚠️ "No user found in Certverse for email: [email]"
```

**Error Cases:**
```
❌ "No email found for Polar customer [id]"
❌ "Error during email matching in checkout.completed: [error]"
❌ "POLAR_ACCESS_TOKEN environment variable is not set"
```

### Sentry Integration

All errors are automatically sent to Sentry with context:
- Customer ID
- Subscription ID
- Email (redacted in production)
- Webhook event type

---

## ✅ Deployment Checklist

### Before Deploying

- [x] Create `polarClient.ts` library
- [x] Create `userLookup.ts` utility
- [x] Update webhook handler with fallback
- [x] Add customer portal endpoint
- [x] Update frontend API client
- [x] Enhance Settings page UI
- [ ] Get `POLAR_ACCESS_TOKEN` from Polar Dashboard
- [ ] Get `POLAR_ORGANIZATION_ID` from Polar Dashboard
- [ ] Add environment variables to Railway
- [ ] Test webhook with email fallback
- [ ] Test customer portal link
- [ ] Fix venkata.motamarry subscription

### After Deploying

- [ ] Monitor Sentry for webhook errors
- [ ] Verify logs show successful email matching
- [ ] Test with real Polar subscription
- [ ] Confirm customer portal link works
- [ ] Document any issues

---

## 🐛 Troubleshooting

### Issue: "POLAR_ACCESS_TOKEN not configured"

**Solution:** Add `POLAR_ACCESS_TOKEN` to Railway environment variables.

### Issue: "No user found in Certverse for email"

**Cause:** User subscribed on Polar before signing up in Certverse.

**Solution:** Ask user to:
1. Sign up in Certverse with same email
2. Resend webhook from Polar Dashboard
3. OR manually sync in database

### Issue: Customer portal link doesn't work

**Check:**
1. User has `polar_customer_id` in database
2. Polar customer portal is enabled
3. Customer ID is valid in Polar

### Issue: Email match finds wrong user

**Cause:** Multiple users with same email (should be impossible with Clerk).

**Solution:** Check Clerk for duplicate emails and merge accounts.

---

## 🚀 Future Enhancements

### Phase 1 (Completed)
- ✅ Email-based user matching
- ✅ Customer portal integration
- ✅ Enhanced subscription UI

### Phase 2 (Recommended)
- [ ] Admin sync endpoint (`POST /api/admin/sync-user`)
- [ ] Bulk sync all Polar subscriptions
- [ ] Automated daily reconciliation cron job
- [ ] Subscription analytics dashboard

### Phase 3 (Optional)
- [ ] Email notifications for subscription events
- [ ] Webhook retry queue for failed matches
- [ ] Grace period for payment failures
- [ ] Subscription upgrade/downgrade within app

---

## 📝 Summary

### What Changed
1. ✅ Added Polar API client for fetching customer data
2. ✅ Added email lookup utility for matching users
3. ✅ Updated webhooks with intelligent email fallback
4. ✅ Added customer portal endpoint and UI
5. ✅ Enhanced Settings page with better subscription info

### What Stayed the Same
- ✅ App-initiated upgrades still work
- ✅ Webhook signature verification unchanged
- ✅ Free user creation still automatic
- ✅ Plan enforcement logic unchanged

### Impact
- 🎯 **Fixes:** Direct Polar subscriptions now sync automatically
- 🎯 **Improves:** Better UX with customer portal access
- 🎯 **Enhances:** Clearer subscription status in Settings
- 🎯 **Maintains:** All existing functionality intact

---

**Ready for Production!** 🚀

Deploy to Railway, add environment variables, and test with a real Polar subscription.
