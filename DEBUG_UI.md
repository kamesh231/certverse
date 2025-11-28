# UI Not Showing - Debug Steps

## Step 1: Check What You're Seeing

**Go to: https://certverse.vercel.app/question**

What do you see?

### Option A: Just a question (no badges at all)
→ Frontend not deployed with new code

### Option B: Error screen or loading forever
→ API calls failing

### Option C: Question loads but badges show undefined/NaN
→ API returning wrong data

---

## Step 2: Open Browser Console

**Press F12 (or Cmd+Option+I on Mac)**

### Check for Errors

Look in Console tab for red errors. Common ones:

```
❌ Failed to fetch unlock status
❌ getRemainingQuestions is not defined
❌ 404 Not Found: /api/unlock/remaining
```

**See any errors?** → Copy them and share

### Check Network Calls

1. Click "Network" tab in DevTools
2. Refresh the page
3. Look for these API calls:
   - `unlock/remaining`
   - `question`

**Click on `unlock/remaining` call:**
- Status: Should be "200 OK"
- Response: Should show JSON like `{"remaining":5,"total":5,...}`

**What do you see?**

---

## Step 3: Verify Deployment

### Check Frontend Deployment

Go to Vercel dashboard:
- https://vercel.com/dashboard

**Find your certverse project**

**Check:**
- [ ] Latest deployment shows "Ready" status
- [ ] Deployment time is AFTER you pushed code (check timestamp)
- [ ] No build errors

**If deployment is old (before you pushed):**
→ Git push didn't trigger deploy

**Fix:**
```bash
cd frontend
git add .
git commit -m "Force redeploy"
git push origin master
```

### Check Backend Deployment

Go to Railway dashboard:
- https://railway.app/dashboard

**Find your backend service**

**Check:**
- [ ] Latest deployment shows "Active"
- [ ] Deployment time is AFTER you pushed code
- [ ] Logs show "🚀 Certverse API running on port 3001"

**Test backend directly:**
```bash
# Replace with your Railway URL
curl "https://certverse-production.up.railway.app/api/unlock/remaining?userId=test"
```

**Expected:** JSON response
**If 404:** Backend not deployed or endpoint missing

---

## Step 4: Check Migration

**Did you run the database migration?**

Go to Supabase dashboard:
- https://supabase.com/dashboard

**Click Table Editor → Check tables:**
- [ ] Do you see `user_stats` table?

**If NO:**
→ Migration not run

**Run now:**
1. Click "SQL Editor"
2. Paste the migration from `backend/migrations/002_user_stats.sql`
3. Click "Run"

**If YES:**
→ Table exists, good!

---

## Step 5: Manual API Test

Let's test the API manually to see what's happening.

**Get your Clerk user ID:**
1. Sign in to your app
2. Open browser console (F12)
3. Paste this:
```javascript
// In browser console
window.location.pathname = '/api/user'
// Or check Network tab for any API call
// Look for userId in request
```

**Or check Clerk dashboard:**
- Go to https://dashboard.clerk.com
- Users → Click your user → Copy User ID

**Now test the API:**
```bash
# Replace YOUR_USER_ID with actual ID
curl "https://certverse-production.up.railway.app/api/unlock/remaining?userId=YOUR_USER_ID"
```

**What do you get?**

### Expected Response:
```json
{
  "remaining": 5,
  "total": 5,
  "resetsAt": "2025-01-27T00:00:00.000Z",
  "streak": 0
}
```

### Possible Issues:

**404 Not Found:**
→ Endpoint doesn't exist. Backend not deployed with new code.

**500 Internal Server Error:**
→ Backend error. Check Railway logs.

**Error: "relation user_stats does not exist":**
→ Migration not run.

---

## Step 6: Check Actual Frontend Code

**Verify the code was deployed:**

Open browser console and check:

```javascript
// Check if new function exists
console.log(typeof getRemainingQuestions)
// Should say "function", not "undefined"
```

**Or check source:**
1. In browser, right-click → View Page Source
2. Search for "Questions today" or "getRemainingQuestions"
3. If not found → Code not deployed

---

## Common Issues & Fixes

### Issue 1: "Questions today: undefined/undefined"

**Cause:** API call failing or returning wrong data

**Debug:**
1. Open DevTools → Network
2. Refresh page
3. Find `unlock/remaining` call
4. Check response

**Fix:**
- If 404: Deploy backend
- If 500: Check Railway logs, run migration
- If no call at all: Deploy frontend

---

### Issue 2: No badges showing at all

**Cause:** Frontend code not deployed

**Check:**
```bash
# See latest frontend commit
git log --oneline -5
```

Should see your Week 3 commit.

**Fix:**
```bash
# Force redeploy
cd frontend
git commit --allow-empty -m "Force redeploy"
git push origin master

# Wait 2 minutes, check Vercel dashboard
```

---

### Issue 3: Backend 500 error

**Check Railway logs:**
1. Railway dashboard → Your backend service
2. Click "Logs" tab
3. Look for error messages

**Common errors:**

**"relation user_stats does not exist"**
→ Run migration in Supabase

**"Cannot read property 'remaining' of undefined"**
→ unlockService.ts has issues, check syntax

---

### Issue 4: Old version cached

**Clear cache:**
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

**Or:**
1. Open in Incognito/Private window
2. Sign in fresh
3. Check if badges show

---

## What to Share for Help

If still not working, share these:

1. **Screenshot of question page** (what you see)

2. **Browser console errors** (F12 → Console tab, copy red errors)

3. **Network response** for `unlock/remaining`:
   ```
   F12 → Network → Click unlock/remaining → Copy response
   ```

4. **Vercel deployment status**:
   - Screenshot or latest deployment time

5. **Railway logs**:
   - Last 20 lines from Railway logs

6. **Migration status**:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name = 'user_stats';
   ```
   Copy result (should return `user_stats`)

---

## Quick Checklist

Before asking for help, verify:

- [ ] Git commits pushed (`git log` shows Week 3 commit)
- [ ] Vercel shows "Ready" status
- [ ] Railway shows "Active" status
- [ ] Migration ran (user_stats table exists in Supabase)
- [ ] API test returns JSON: `curl .../api/unlock/remaining?userId=test`
- [ ] Browser console open (F12)
- [ ] Cache cleared (hard refresh or incognito)

---

**What are you seeing right now?**

Share:
- Screenshot of /question page
- Any console errors
- Response from: `curl https://certverse-production.up.railway.app/api/unlock/remaining?userId=test`
