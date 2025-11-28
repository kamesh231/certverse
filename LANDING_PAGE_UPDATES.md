# Landing Page Updates - Pricing Integration

## Summary of Changes

✅ **Added pricing section to landing page**
✅ **Updated navbar navigation**
✅ **Removed dashboard shortcuts from navbar**
✅ **Updated footer links**

---

## Changes Made

### 1. Navbar (`frontend/components/navbar.tsx`)

**REMOVED:**
- Dashboard, Study, Practice, Settings links (these are now only in dashboard sidebar)

**ADDED:**
- "Pricing" link (visible to all users) - scrolls to #pricing on home page
- "Dashboard" link (visible only when signed in)

**Navigation Now Shows:**
- For signed out users: **Pricing** | Sign In
- For signed in users: **Pricing** | **Dashboard** | User Profile

---

### 2. Landing Page (`frontend/app/page.tsx`)

**ADDED:**
- New pricing section with id="pricing" for anchor linking
- 3 pricing tiers displayed with cards:
  - **Free Plan**: $0/forever - 2 questions/day
  - **Premium Plan**: $29/month - Unlimited (highlighted as "Most Popular")
  - **Coach Plan**: $39/month - Coming Soon

**UPDATED:**
- Footer "Pricing" link now goes to `#pricing` (scrolls to pricing section)

---

## How It Works

### Landing Page Flow:

1. **User visits homepage** → Sees hero, stats, features sections
2. **Scrolls down** → Sees pricing section with 3 tiers
3. **Clicks "Pricing" in navbar** → Smoothly scrolls to pricing section
4. **Clicks "Upgrade to Premium"** → Redirects to `/pricing` (full pricing page with FAQ)
5. **Clicks "Get Started Free"** → Redirects to `/dashboard`

### Navbar Behavior:

- **Signed out:** Shows Pricing link (scrolls to #pricing on home, or goes to /pricing if on another page)
- **Signed in:** Shows Pricing + Dashboard links
- **Dashboard removed:** Users access it via the "Dashboard" link in navbar or sidebar

---

## Testing

### Test 1: Landing Page Pricing Section

```bash
# Start frontend
cd frontend
npm run dev
```

1. Visit http://localhost:3000
2. Scroll down to see pricing section
3. Verify 3 pricing cards are displayed
4. Click "Pricing" in navbar → should scroll to pricing section

### Test 2: Navbar Navigation

**Signed Out:**
- Navbar shows: Logo | **Pricing** | Sign In
- Click "Pricing" → scrolls to pricing on homepage

**Signed In:**
- Navbar shows: Logo | **Pricing** | **Dashboard** | User Avatar
- Click "Pricing" → scrolls to pricing section
- Click "Dashboard" → goes to dashboard

### Test 3: Pricing Cards

**Free Plan:**
- Shows $0/forever
- Button says "Get Started Free"
- Links to `/dashboard`

**Premium Plan:**
- Shows $29/month
- Has "Most Popular" badge
- Button says "Upgrade to Premium"
- Links to `/pricing` (full pricing page)

**Coach Plan:**
- Shows $39/month
- Has "Coming Q2 2025" badge
- Button is disabled

---

## Files Modified

### Modified:
1. `frontend/components/navbar.tsx` - Simplified navigation
2. `frontend/app/page.tsx` - Added pricing section

### No New Files Created

---

## Visual Checklist

- [ ] Pricing section appears on landing page
- [ ] Pricing section has id="pricing" for anchor linking
- [ ] Navbar shows "Pricing" link
- [ ] Navbar no longer shows Study/Practice/Results/Settings
- [ ] Premium plan has "Most Popular" badge
- [ ] Coach plan has "Coming Soon" badge
- [ ] Footer "Pricing" link goes to #pricing
- [ ] Smooth scroll to pricing section works
- [ ] Responsive design works on mobile

---

## Benefits

1. **Cleaner Navigation**: Navbar is simpler, dashboard features are in dashboard sidebar
2. **Better UX**: Users can see pricing immediately on landing page
3. **Clear Hierarchy**:
   - Landing page → Overview & pricing
   - Dashboard → Full app features
   - Pricing page → Detailed comparison & FAQ
4. **SEO Friendly**: Pricing visible on main page for search engines

---

## Next Steps

Continue with remaining milestones:
- Milestone 8: Polar webhook handler
- Milestone 9: Settings/subscription page
- Milestone 10: End-to-end testing
