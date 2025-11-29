# Webhook 401 Error Debugging Guide

## Current Issue
Webhooks are returning 401 "Invalid signature" error, even after fixing the signature verification code.

## Most Likely Cause
**The updated code hasn't been deployed to Railway yet** OR **POLAR_WEBHOOK_SECRET mismatch**

## Debugging Steps

### Step 1: Verify Code is Deployed to Railway

1. Check your latest Railway deployment:
   ```bash
   railway logs --limit 50
   ```

2. Look for the recent deployment log showing the new code

3. If not deployed, deploy now:
   ```bash
   git add .
   git commit -m "Fix webhook signature verification and add trial tracking"
   git push
   ```

4. Railway should auto-deploy. Wait for build to complete.

### Step 2: Verify POLAR_WEBHOOK_SECRET

**In Polar Dashboard:**
1. Go to https://sandbox.polar.sh/dashboard (or production)
2. Navigate to **Developers** → **Webhooks**
3. Click on your webhook
4. Find the **Webhook Secret** (it should start with `whsec_...`)
5. **Copy this exact value**

**In Railway:**
1. Go to Railway dashboard → Your project
2. Click **Variables** tab
3. Find `POLAR_WEBHOOK_SECRET`
4. **Verify it matches** the value from Polar dashboard (character by character)

**IMPORTANT:** The secret should be the **raw secret** (like `whsec_abc123...`), NOT base64 encoded, NOT modified.

### Step 3: Check Railway Logs After Deployment

After deploying, trigger a test webhook from Polar dashboard and check Railway logs:

```bash
railway logs --filter webhook
```

You should now see the enhanced debug logs:
```
=== WEBHOOK DEBUG INFO ===
Signature received: abc123...
Webhook secret configured: YES (length: 64)
Raw body type: string
Raw body length: 1234
Body type: object
Expected signature: abc123...
Signatures match: true/false
```

### Step 4: Verify Environment Variables in Railway

Check all Polar-related environment variables are set:

```bash
railway variables
```

Required variables:
- ✅ `POLAR_WEBHOOK_SECRET` - From Polar dashboard → Webhooks
- ✅ `POLAR_ACCESS_TOKEN` - From Polar dashboard → API keys
- ✅ `POLAR_CHECKOUT_LINK_ID` - Your checkout link ID
- ✅ `POLAR_SANDBOX` - Set to `true` for sandbox mode

### Step 5: Test Webhook After Deployment

1. Go to Polar Dashboard → Webhooks → Your webhook
2. Click **Send test event**
3. Select `customer.state_changed`
4. Click **Send**
5. Check Railway logs immediately:
   ```bash
   railway logs --tail
   ```

Expected successful output:
```
=== WEBHOOK DEBUG INFO ===
Signature received: [signature]
Webhook secret configured: YES (length: 64)
Raw body type: string
Raw body length: 2486
Body type: object
Expected signature: [same as received]
Signatures match: true
✅ Received Polar webhook: customer.state_changed
✅ Customer state changed for customer 5e8e02a7...
```

## Common Issues & Fixes

### Issue 1: Signatures Don't Match

**Symptom:**
```
Expected signature: abc123...
Signature received: xyz789...
Signatures match: false
```

**Fix:**
1. Copy webhook secret from Polar dashboard
2. Update in Railway: `POLAR_WEBHOOK_SECRET=whsec_...`
3. Restart Railway service
4. Test again

### Issue 2: Raw Body Not Found

**Symptom:**
```
Raw body type: undefined
❌ Raw body not found for signature verification
```

**Fix:**
Code not deployed yet. The old code is still running.
1. Commit and push changes
2. Wait for Railway deployment
3. Verify deployment in Railway logs

### Issue 3: Webhook Secret Not Configured

**Symptom:**
```
Webhook secret configured: NO
❌ POLAR_WEBHOOK_SECRET not configured
```

**Fix:**
1. Go to Railway → Variables
2. Add `POLAR_WEBHOOK_SECRET` with value from Polar dashboard
3. Railway will auto-restart

### Issue 4: Code Shows Old Behavior

**Symptom:**
No debug logs appearing, still seeing basic 401 error

**Fix:**
Railway hasn't picked up the new code yet:
```bash
# Force rebuild and deploy
git add .
git commit -m "Force redeploy" --allow-empty
git push
```

## Quick Deployment Checklist

Before testing webhooks, ensure:

- [ ] All code changes committed
- [ ] Code pushed to repository
- [ ] Railway build completed successfully
- [ ] Railway deployment shows "Active"
- [ ] Environment variables set in Railway
- [ ] Webhook secret matches Polar dashboard
- [ ] Test webhook sent from Polar
- [ ] Railway logs show debug information

## Deployment Commands

```bash
# 1. Check current git status
git status

# 2. Commit all changes
git add .
git commit -m "Fix webhook signature verification and add trial tracking"

# 3. Push to trigger Railway deployment
git push

# 4. Monitor Railway deployment
railway logs --tail

# 5. Wait for "Deployment successful" message

# 6. Test webhook from Polar dashboard

# 7. Check logs for debug info
railway logs --filter "WEBHOOK DEBUG"
```

## Expected Log Output (Success)

After deploying and sending a test webhook, you should see:

```
=== WEBHOOK DEBUG INFO ===
Signature received: e4f2a1b3c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2
Webhook secret configured: YES (length: 64)
Raw body type: string
Raw body length: 2486
Body type: object
Expected signature: e4f2a1b3c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2
Signatures match: true
✅ Received Polar webhook: customer.state_changed
✅ Customer state changed for customer 5e8e02a7-a1ba-442d-b587-7d44377873fe
✅ No subscription found for Polar ID b33a45a2-f7e6-405f-ba52-9db2b238f39f, attempting email match
✅ Matched Polar subscription b33a45a2-f7e6-405f-ba52-9db2b238f39f to user user_35w9rEJ46QL5Zl50DRx5URfYcn7 via email venkata.motamarry@gmail.com
✅ Starting trial for user user_35w9rEJ46QL5Zl50DRx5URfYcn7 (ends: 2025-12-05T15:35:07.380178Z)
✅ Created/updated subscription for user user_35w9rEJ46QL5Zl50DRx5URfYcn7
```

## Test Payload for Manual Testing

If you want to test locally first:

```bash
# Run backend locally
npm run dev

# In another terminal, send test webhook
curl -X POST http://localhost:3001/api/webhooks/polar \
  -H "Content-Type: application/json" \
  -H "polar-signature: YOUR_SIGNATURE" \
  -d @test-webhook-payload.json
```

But Railway is the real test - Polar only sends to the configured webhook URL.

## Next Steps After Fixing

Once webhooks are working (returning 200):

1. ✅ Run database migration for trial tracking
2. ✅ Test complete trial flow:
   - New user signs up
   - Starts trial checkout
   - Completes on Polar
   - Webhook syncs to database
   - Check `has_used_trial = true`
3. ✅ Test trial end:
   - Cancel trial in Polar
   - Webhook downgrades to free
   - Verify in database
4. ✅ Test repeat trial prevention:
   - Same user tries trial again
   - Check logs for eligibility check
   - Verify no trial offered

## Support

If still getting 401 after all these steps:

1. Share Railway logs showing the debug output
2. Verify Polar webhook secret (first 10 chars)
3. Check Polar webhook configuration (URL, events)
4. Confirm Railway deployment status
