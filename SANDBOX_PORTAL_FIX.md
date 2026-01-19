# Sandbox Portal URL Fix - Implementation Summary

**Status:** ✅ Complete
**Date:** January 18, 2026

---

## Problem

The "Manage Subscription" button was generating incorrect portal URLs:
- ❌ Generated: `https://polar.sh/schedlynksandbox/portal` (404 error)
- ✅ Correct: `https://sandbox.polar.sh/schedlynksandbox/portal`

**Root Cause:** Code didn't differentiate between sandbox and production portal domains.

---

## Solution Implemented

Added **sandbox-aware** portal URL generation that automatically uses the correct domain based on environment.

### Code Changes

**File:** `frontend/app/(dashboard)/settings/page.tsx`

**Before:**
```typescript
const orgSlug = process.env.NEXT_PUBLIC_POLAR_ORG_SLUG || 'schedlynksandbox';
window.open(`https://polar.sh/${orgSlug}/portal`, '_blank');
```

**After:**
```typescript
const isSandbox = process.env.NEXT_PUBLIC_POLAR_SANDBOX === 'true';
const portalDomain = isSandbox ? 'sandbox.polar.sh' : 'polar.sh';
const orgSlug = process.env.NEXT_PUBLIC_POLAR_ORG_SLUG || 'schedlynksandbox';
window.open(`https://${portalDomain}/${orgSlug}/portal`, '_blank');
```

---

## Environment Variables Required

### Add to `frontend/.env.local`:

```bash
# Polar Organization Slug
NEXT_PUBLIC_POLAR_ORG_SLUG=schedlynksandbox

# Polar Environment (true for sandbox, false for production)
NEXT_PUBLIC_POLAR_SANDBOX=true
```

---

## How It Works Now

### Sandbox Mode (Current)
When `NEXT_PUBLIC_POLAR_SANDBOX=true`:
- Portal URL: `https://sandbox.polar.sh/schedlynksandbox/portal` ✅
- API: `https://sandbox-api.polar.sh` ✅

### Production Mode (Future)
When `NEXT_PUBLIC_POLAR_SANDBOX=false` or not set:
- Portal URL: `https://polar.sh/certverse/portal` ✅
- API: `https://api.polar.sh` ✅

---

## Testing Steps

### 1. Add Environment Variables
```bash
cd frontend
# Add to .env.local:
NEXT_PUBLIC_POLAR_ORG_SLUG=schedlynksandbox
NEXT_PUBLIC_POLAR_SANDBOX=true
```

### 2. Restart Dev Server
```bash
npm run dev
```

### 3. Test the Button
1. Log in as a Premium user
2. Go to Settings → Subscription tab
3. Click "Manage Subscription"
4. Should open: `https://sandbox.polar.sh/schedlynksandbox/portal`

### 4. Verify Portal Loads
- Portal login page should appear
- You can enter your email to access subscriptions

---

## Production Migration Path

When moving to production:

### 1. Update Vercel Environment Variables

**Change:**
```bash
NEXT_PUBLIC_POLAR_ORG_SLUG=certverse  # Your production org slug
NEXT_PUBLIC_POLAR_SANDBOX=false
```

### 2. Backend Also Updates
Backend already has similar logic:
```typescript
const POLAR_API_BASE = process.env.POLAR_SANDBOX === 'true'
  ? 'https://sandbox-api.polar.sh'
  : 'https://api.polar.sh';
```

Just set `POLAR_SANDBOX=false` in production.

---

## Files Modified

1. ✅ `frontend/app/(dashboard)/settings/page.tsx`
   - Added sandbox-aware domain logic (2 places)
   - Lines 676-678 and 682-684

2. ✅ `SUBSCRIPTION_PORTAL_SETUP.md`
   - Updated all environment variable examples
   - Added sandbox/production URL examples

3. ✅ `SETUP_POLAR_ORG_SLUG.md`
   - Added `NEXT_PUBLIC_POLAR_SANDBOX` variable
   - Updated instructions

4. ✅ `SANDBOX_PORTAL_FIX.md` (this file)
   - New implementation summary

---

## Portal URL Reference

| Environment | Domain | Example URL |
|------------|--------|-------------|
| Sandbox | `sandbox.polar.sh` | `https://sandbox.polar.sh/schedlynksandbox/portal` |
| Production | `polar.sh` | `https://polar.sh/certverse/portal` |

---

## Benefits

- ✅ Works in both sandbox and production
- ✅ No code changes needed when migrating to production
- ✅ Just update environment variables
- ✅ Consistent with backend's sandbox/production logic
- ✅ Easy to test before going live

---

## Related Documentation

- Main guide: `SUBSCRIPTION_PORTAL_SETUP.md`
- Quick setup: `SETUP_POLAR_ORG_SLUG.md`
- Polar docs: https://polar.sh/docs/features/customer-portal

---

## Next Steps

1. ✅ Code updated
2. ⏳ **Add environment variables** (you do this)
3. ⏳ Restart dev server
4. ⏳ Test button functionality
5. ⏳ Verify portal URL is correct

---

**Status:** ✅ Ready to Test

The "Manage Subscription" button will now generate the correct sandbox portal URL!
