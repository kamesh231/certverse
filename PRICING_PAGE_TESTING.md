# Pricing Page Testing Guide

## What's Been Built

✅ **Pricing Page UI** - Beautiful, responsive pricing page with 3 tiers
✅ **Navigation Link** - Added "Pricing" to sidebar navigation
✅ **Checkout Integration** - "Upgrade to Premium" button generates Polar.sh checkout URL

---

## Files Created/Modified

### New Files:
- `frontend/app/(dashboard)/pricing/page.tsx` - Pricing page component

### Modified Files:
- `frontend/components/dashboard-sidebar.tsx` - Added pricing link to navigation

---

## How to Test

### Step 1: Start Frontend

```bash
cd frontend
npm run dev
```

Visit: http://localhost:3000

### Step 2: Navigate to Pricing Page

1. Sign in to your account
2. Look for "Pricing" in the sidebar (with sparkles ✨ icon)
3. Click on "Pricing"

**Expected:** You should see the pricing page with 3 plans:
- **Free**: $0/forever
- **Premium**: $29/month (highlighted as "Most Popular")
- **Coach**: $39/month (Coming Soon)

### Step 3: Test Plan Display

**Verify each plan shows:**
- ✅ Plan name and price
- ✅ Green checkmarks for included features
- ✅ Red X marks for free plan limitations
- ✅ CTA buttons at the bottom

### Step 4: Test Checkout Button

1. Make sure backend is running: `cd backend && npm run dev`
2. On pricing page, click **"Upgrade to Premium"**
3. Open browser console (F12)
4. Watch for:
   - API call to `/api/checkout/create`
   - Checkout URL being generated
   - Page redirect to Polar.sh

**Expected Console Output:**
```
Checkout URL: https://polar.sh/certverse/checkout?metadata[user_id]=user_xxx&prefilled_email=xxx@example.com
```

**Expected Behavior:**
- Button shows loading spinner
- Page redirects to Polar.sh checkout page
- Email is pre-filled in checkout form

### Step 5: Test Responsiveness

1. Resize browser window to mobile size (< 768px)
2. Verify:
   - Cards stack vertically
   - Text remains readable
   - Buttons are full-width
   - FAQ section stacks properly

### Step 6: Test Other Buttons

**Free Plan Button:**
- Should be disabled
- Shows "Current Plan"

**Coach Plan Button:**
- Should be disabled
- Shows "Join Waitlist"
- Badge shows "Coming Q2 2025"

---

## Visual Checklist

- [ ] Pricing page loads without errors
- [ ] "Pricing" link appears in sidebar navigation
- [ ] Premium plan has "Most Popular" badge
- [ ] Coach plan has "Coming Soon" badge
- [ ] All feature lists display with proper icons
- [ ] FAQ section shows 3 questions
- [ ] Page is responsive on mobile
- [ ] Upgrade button triggers checkout flow
- [ ] Loading state shows when clicking upgrade
- [ ] User email is passed to checkout URL

---

## FAQ Content

The page includes answers to:
1. **Can I cancel anytime?** - Yes, with access until billing period ends
2. **What happens after I cancel?** - Downgrade to free plan, progress preserved
3. **Do you offer refunds?** - 7-day money-back guarantee

---

## Next Steps After Testing

If everything works:
1. Continue with **Milestone 8**: Polar webhook handler
2. Then **Milestone 9**: Settings/subscription management page
3. Finally **Milestone 10**: End-to-end testing

---

## Troubleshooting

**Pricing page not loading:**
- Check console for errors
- Verify frontend dev server is running
- Check that you're signed in with Clerk

**Checkout button not working:**
- Verify backend is running on port 3001
- Check API_URL in `frontend/lib/api.ts`
- Check browser console for API errors

**Styles look broken:**
- Verify Tailwind CSS is configured correctly
- Check that UI components are properly installed
- Try hard refresh (Cmd/Ctrl + Shift + R)

---

## Environment Variables

No new environment variables needed for the pricing page!

When you set up Polar.sh later, you'll need:
- `POLAR_ORGANIZATION=certverse` (backend)
- `POLAR_WEBHOOK_SECRET=xxx` (backend)
