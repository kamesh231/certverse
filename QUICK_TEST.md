# Quick Testing Guide - Week 3 Features

## Pre-Flight Checklist

Before testing, make sure you've completed:

### 1. Run Database Migration ⏱️ 2 minutes

**Go to Supabase:**
1. Visit https://supabase.com/dashboard
2. Select your Certverse project
3. Click "SQL Editor" (left sidebar)
4. Click "New Query"
5. Copy/paste this:

```sql
-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  total_questions_attempted INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  questions_unlocked_today INTEGER DEFAULT 5,
  last_unlock_reset TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON user_stats
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON user_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON user_stats
  FOR UPDATE USING (true);
```

6. Click "Run" or press Cmd/Ctrl + Enter

**Verify it worked:**
```sql
SELECT * FROM user_stats LIMIT 1;
```
Should show an empty table (0 rows) with all the columns. That's good!

---

### 2. Deploy Backend ⏱️ 3 minutes

```bash
cd /Users/kamesh/Documents/SideProjects/certverse

# Add all changes
git add .

# Commit
git commit -m "Week 3: Add daily unlock limits, streak tracking, and countdown timer"

# Push (Railway auto-deploys)
git push origin master
```

**Wait 2-3 minutes**, then verify:
```bash
# Test new endpoint (replace with your Railway URL)
curl "https://certverse-production.up.railway.app/api/unlock/remaining?userId=test"

# Should return JSON with: remaining, total, resetsAt, streak
```

---

### 3. Deploy Frontend ⏱️ 1 minute

Already deployed with backend! Vercel auto-deploys on push.

Check Vercel dashboard for deployment status (should be done in ~1 minute).

---

## Testing Sequence

### Test 1: First Question Counter ⏱️ 2 minutes

**Steps:**
1. Open browser to https://certverse.vercel.app/
2. Sign in with Clerk
3. Go to `/question` page

**What to check:**
- [ ] See badge: "Questions today: 0/5"
- [ ] See badge: "Streak: 0 days" OR no streak badge (if streak is 0)
- [ ] Question loads normally

**Screenshot this!** 📸

---

### Test 2: Counter Updates ⏱️ 3 minutes

**Steps:**
1. Answer the question (pick any choice)
2. Click submit
3. Watch the counter

**What to check:**
- [ ] Counter updates to "1/5" immediately
- [ ] Streak badge shows "Streak: 1 day"
- [ ] Click "Next Question"
- [ ] New question loads
- [ ] Counter stays at "1/5" (correct - you answered 1 question)

**Try this:** Answer 2-3 more questions, verify counter increments each time.

---

### Test 3: Daily Limit Screen ⏱️ 5 minutes

**Steps:**
1. Keep answering questions until you hit 5 total
2. After submitting the 5th answer, wait for next question to load

**What to check:**
- [ ] Counter shows "5/5"
- [ ] See card: "Great work today! 🎉"
- [ ] See text: "You've completed all 5 questions for today"
- [ ] See countdown timer (example: "23h 45m 32s")
- [ ] See button: "View Your Progress"
- [ ] Timer is counting down (watch seconds decrease)

**Screenshot this!** 📸

**Try this:** Refresh the page → Should still see limit screen (not a new question)

---

### Test 4: Dashboard Stats ⏱️ 2 minutes

**Steps:**
1. Click "View Your Progress" button (or go to `/dashboard`)

**What to check:**
- [ ] "Questions Answered" card shows total (e.g., "5")
- [ ] "Accuracy Rate" card shows % (e.g., "60%")
- [ ] "Current Streak" card shows "1 day"
- [ ] "Questions Today" card shows "5"
- [ ] No errors in console

**Screenshot this!** 📸

---

### Test 5: Bypass Limit (Testing Only) ⏱️ 3 minutes

**This tests the daily reset logic**

**Steps:**
1. Open Supabase dashboard
2. Go to Table Editor → `user_stats`
3. Find your row (look for your Clerk user_id)
4. Click to edit
5. Set `last_unlock_reset` to yesterday's date
   - Example: If today is 2025-01-26, set to `2025-01-25T00:00:00.000Z`
6. Click Save

7. **Go back to your app**
8. Refresh `/question` page

**What to check:**
- [ ] Counter resets to "0/5"
- [ ] Limit screen is gone
- [ ] New question loads
- [ ] You can answer 5 more questions

This proves the daily reset logic works!

---

### Test 6: Streak Tracking (Multi-Day Test) ⏱️ 2 days

**Day 1 (Today):**
1. Answer at least 1 question
2. Check streak: Should be "1 day"
3. Note the time (important!)

**Day 2 (Tomorrow):**
1. Sign in again
2. Go to `/question`
3. Check counter: Should be "0/5" (reset)
4. Answer 1 question
5. Check streak: Should be "2 days"

**Day 3 (Day after tomorrow):**
1. Answer 1 question
2. Check streak: Should be "3 days"
3. **Look for 🔥 flame icon** next to streak badge
4. Check dashboard: Streak card should be orange/red color with flame

**What to check:**
- [ ] Streak increments each consecutive day
- [ ] Flame icon appears at 3+ days
- [ ] Streak card color changes at 3+ days

---

### Test 7: Streak Reset (Optional) ⏱️ 1 day

**Skip a day to test streak reset**

**Day 1:** Answer 1 question (streak = 1)
**Day 2:** Don't use the app
**Day 3:** Answer 1 question

**What to check:**
- [ ] Streak resets to "1 day" (not 2)

This proves streak resets after missing a day.

---

## Quick Checks (Browser DevTools)

**Open browser console (F12) and check:**

```javascript
// After answering a question, check network tab
// Look for these API calls:
// POST /api/submit → Should return 200
// GET /api/unlock/remaining → Should return 200

// Check response of /api/unlock/remaining:
{
  "remaining": 4,  // Decreases after each answer
  "total": 5,
  "resetsAt": "2025-01-27T00:00:00.000Z",  // Tomorrow at midnight UTC
  "streak": 1
}
```

---

## Troubleshooting

### Issue: "Questions today: undefined/undefined"

**Cause:** Backend not deployed or API call failing

**Fix:**
1. Check Railway deployment status
2. Open browser console (F12)
3. Look for red errors
4. Check Network tab → Find `/api/unlock/remaining` call
5. If 404: Backend not deployed
6. If 500: Check Railway logs

**Quick test:**
```bash
curl "https://certverse-production.up.railway.app/api/unlock/remaining?userId=test"
```
Should return JSON, not 404.

---

### Issue: Counter not updating after submit

**Fix:**
1. Open browser console (F12)
2. Submit an answer
3. Check Network tab
4. Look for `/api/unlock/remaining` call after submit
5. If missing: Code not deployed
6. If error: Check response

---

### Issue: Countdown timer shows weird time

**Check:**
1. Open console
2. Type: `new Date("2025-01-27T00:00:00.000Z")`
3. Should show tomorrow at midnight UTC
4. If shows past time: Your system clock is wrong

---

### Issue: Migration fails "relation already exists"

**Cause:** Table already created

**Fix:**
```sql
DROP TABLE IF EXISTS user_stats CASCADE;
-- Then re-run the migration
```

---

### Issue: "permission denied" when running migration

**Fix:**
1. Make sure you're in the correct Supabase project
2. Make sure you're using the SQL Editor (not psql)
3. Try running as smaller chunks (CREATE TABLE first, then indexes)

---

## Success Checklist

Week 3 is complete when all these work:

- [ ] Migration ran successfully (user_stats table exists)
- [ ] Backend deployed (no Railway errors)
- [ ] Frontend deployed (no Vercel errors)
- [ ] Question counter shows "X/5"
- [ ] Counter updates after each answer
- [ ] Limit screen appears at 5 questions
- [ ] Countdown timer shows and counts down
- [ ] Dashboard shows streak and "questions today"
- [ ] Streak increments on consecutive days
- [ ] Flame icon appears at 3+ day streak
- [ ] Daily reset works (questions reset at midnight UTC)

---

## What to Do After Testing

### If Everything Works ✅

1. **Take screenshots** of:
   - Question counter
   - Limit reached screen
   - Dashboard with streak

2. **Record a demo video** (2 minutes)
   - Show answering questions
   - Show counter updating
   - Show hitting limit
   - Show dashboard

3. **Post update** on LinkedIn/Twitter:
   ```
   Just shipped Week 3 of my CISA exam prep app! 🚀

   New features:
   ✅ Daily unlock limits (5 Q/day)
   ✅ Streak tracking with 🔥 badges
   ✅ Countdown timer for daily reset

   Building in public. Next up: Free vs Paid tiers!
   ```

4. **Invite 2-3 friends** to test for 3 days:
   - Ask for feedback on daily limit
   - Ask if streak motivates them
   - Track: Do they return next day?

### If Issues Found 🐛

1. **Document the issue:**
   - What were you doing?
   - What did you expect?
   - What actually happened?
   - Screenshot/screen recording

2. **Check these common fixes:**
   - Clear browser cache
   - Check Railway/Vercel logs
   - Verify migration ran
   - Test API endpoints directly with curl

3. **Let me know!** Share:
   - The issue description
   - Error messages (console, Railway, Vercel)
   - Screenshots

---

## Time Estimate

**Total testing time:**
- Migration + Deploy: 5 minutes
- Test 1-5 (single day): 15 minutes
- Test 6 (streak): 2-3 days (1 min/day)
- Test 7 (skip day): Optional

**You can complete Tests 1-5 in ~20 minutes total!**

Tests 6-7 require multiple days, but only take 1 minute each day.

---

**Ready to start?** Begin with the Pre-Flight Checklist above! 🚀
