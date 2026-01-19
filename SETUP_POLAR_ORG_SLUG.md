# Quick Setup: Add Polar Org Slug

## Action Required

Add these lines to your **`frontend/.env.local`** file:

```bash
NEXT_PUBLIC_POLAR_ORG_SLUG=schedlynksandbox
NEXT_PUBLIC_POLAR_SANDBOX=true
```

## File Location

```
frontend/.env.local
```

## For Production (Vercel)

When deploying to production, add these environment variables in Vercel:

**1. Organization Slug:**
- **Name:** `NEXT_PUBLIC_POLAR_ORG_SLUG`  
- **Value:** `your-production-org-slug` (replace schedlynksandbox)  
- **Environment:** Production

**2. Sandbox Mode:**
- **Name:** `NEXT_PUBLIC_POLAR_SANDBOX`  
- **Value:** `false`  
- **Environment:** Production

---

## That's It!

After adding this:
1. Restart your dev server
2. Visit Settings → Subscription tab
3. You should now see the "Manage Subscription" button!

---

**Current Status:**
- ✅ Code updated
- ⏳ Add environment variable (you do this)
- ⏳ Test button shows up
