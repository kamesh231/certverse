# Subscription Sync Fix Guide

## Problem
You upgraded `venkata.motamarry@gmail.com` to Paid in Polar, but the change didn't sync to Supabase.

## Root Cause
The webhook from Polar either:
1. Wasn't configured
2. Failed due to missing user in Clerk
3. Failed due to missing environment variables

## Quick Fix Options

### Option 1: Manual Database Update (Fastest)

If you know the Polar customer ID and subscription ID, you can manually update the database:

\`\`\`sql
-- First, check if user exists in Clerk and get their user_id
-- You'll need to look this up in your Clerk dashboard for venkata.motamarry@gmail.com

-- Then run this in Supabase SQL Editor:
UPDATE subscriptions
SET
  plan_type = 'paid',
  status = 'active',
  polar_customer_id = 'YOUR_POLAR_CUSTOMER_ID',
  polar_subscription_id = 'YOUR_POLAR_SUBSCRIPTION_ID',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 month',
  updated_at = NOW()
WHERE user_id = 'CLERK_USER_ID_HERE';

-- If no subscription exists, create one:
INSERT INTO subscriptions (user_id, plan_type, status, polar_customer_id, polar_subscription_id, current_period_start, current_period_end)
VALUES (
  'CLERK_USER_ID_HERE',
  'paid',
  'active',
  'YOUR_POLAR_CUSTOMER_ID',
  'YOUR_POLAR_SUBSCRIPTION_ID',
  NOW(),
  NOW() + INTERVAL '1 month'
);
\`\`\`

### Option 2: Use the Manual Sync Script

1. **Get the Clerk user ID:**
   - Go to Clerk Dashboard → Users
   - Find venkata.motamarry@gmail.com
   - Copy the User ID (looks like: user_2xxxxx...)

2. **Edit the sync script:**
   \`\`\`bash
   # Edit backend/scripts/manual-sync-subscription.ts
   # Update line 6:
   const userId = 'user_2qCE0bQ39BT0XdM3R6qJWFpkwsy'; // Replace with actual ID
   \`\`\`

3. **Run the script:**
   \`\`\`bash
   cd backend
   npx tsx scripts/manual-sync-subscription.ts
   \`\`\`

### Option 3: Fix Webhook for Future (Recommended)

1. **Check environment variables in Railway/your deployment:**
   \`\`\`
   POLAR_ACCESS_TOKEN=polar_at_...
   POLAR_WEBHOOK_SECRET=whsec_...
   POLAR_ORGANIZATION_ID=org_...
   CLERK_SECRET_KEY=sk_live_...
   \`\`\`

2. **Configure webhook in Polar dashboard:**
   - Go to Polar Dashboard → Settings → Webhooks
   - Add webhook URL: \`https://your-backend.railway.app/api/webhooks/polar\`
   - Copy the webhook secret and update \`POLAR_WEBHOOK_SECRET\` in Railway
   - Enable events:
     - checkout.completed
     - subscription.updated
     - subscription.canceled
     - subscription.ended
     - payment.failed

3. **Test webhook:**
   - Make a small change in Polar (like updating subscription notes)
   - Check backend logs in Railway
   - You should see: "Received Polar webhook: subscription.updated"

## Troubleshooting

### User doesn't exist in Clerk
**Problem:** venkata.motamarry@gmail.com hasn't signed up in your app yet.

**Solution:**
1. Have them sign up at your app first
2. Then manually sync the subscription using Option 1 or 2

### Can't find Polar Customer ID
**Find it by:**
1. Go to Polar Dashboard → Customers
2. Search for venkata.motamarry@gmail.com
3. Click on the customer → Copy the ID (starts with \`cus_\`)

### Can't find Polar Subscription ID
**Find it by:**
1. Go to Polar Dashboard → Subscriptions
2. Find the subscription for venkata.motamarry
3. Click on it → Copy the ID (starts with \`sub_\`)

## Verification

After fixing, verify the subscription:

\`\`\`bash
cd backend
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

(async () => {
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', 'CLERK_USER_ID_HERE')
    .single();

  console.log('Subscription:', data);
  console.log('Is Paid:', data?.plan_type === 'paid' && data?.status === 'active');
})();
"
\`\`\`

## Why auth.users is Empty

**This is normal!** Your app uses:
- **Clerk** for authentication (user accounts live there)
- **Supabase** only for database storage (subscriptions, stats, etc.)

The \`auth.users\` table is part of Supabase Auth, which you're not using.
