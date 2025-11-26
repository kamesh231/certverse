# Week 3 Implementation - Deployment Guide

**Date:** 2025-01-26
**Status:** ✅ Code Complete - Ready for Testing

---

## What We Built

Week 3 feature: **"I can only practice X questions per day"**

### Features Implemented

✅ **Backend:**
- `user_stats` table migration
- Unlock service with daily limit logic (5 Q/day)
- GET `/api/unlock/remaining` - Returns remaining questions
- GET `/api/stats/enhanced` - Returns stats with streak
- Auto-update stats after each answer submission
- Streak tracking (consecutive days)

✅ **Frontend:**
- Questions remaining counter (e.g., "3/5")
- Streak badge with 🔥 flame icon (when >= 3 days)
- Limit reached UI with countdown timer
- Updated dashboard with streak and "questions today" cards
- Auto-refresh when timer reaches 0

---

## Deployment Steps

### Step 1: Run Database Migration (5 minutes)

**Option A: Supabase Dashboard (Recommended)**

1. Go to https://supabase.com/dashboard
2. Select your Certverse project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy the contents of `backend/migrations/002_user_stats.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. Verify success message appears

**Verify Migration:**

```sql
-- Check if table exists
SELECT * FROM user_stats LIMIT 1;

-- Should see columns: user_id, current_streak, questions_unlocked_today, etc.
```

If you see an empty table (no rows), that's perfect! It will populate when users start answering questions.

---

### Step 2: Deploy Backend (10 minutes)

**Railway Auto-Deploy:**

```bash
# From project root
cd backend

# Commit changes
git add .
git commit -m "Add Week 3 features: daily unlock limits and streak tracking"
git push origin master

# Railway will auto-deploy in ~2-3 minutes
```

**Verify Backend Deployment:**

1. Go to Railway dashboard
2. Check deployment logs for success
3. Test new endpoints:

```bash
# Test unlock endpoint (replace with your Railway URL)
curl "https://certverse-production.up.railway.app/api/unlock/remaining?userId=test_user"

# Should return:
# {"remaining":5,"total":5,"resetsAt":"2025-01-27T00:00:00.000Z","streak":0}
```

---

### Step 3: Deploy Frontend (10 minutes)

**Vercel Auto-Deploy:**

```bash
# From project root
cd frontend

# Commit changes
git add .
git commit -m "Add Week 3 UI: question counter, streak, and limit reached screen"
git push origin master

# Vercel will auto-deploy in ~1-2 minutes
```

**Verify Frontend Deployment:**

1. Go to Vercel dashboard
2. Check deployment logs
3. Visit your app: https://certverse.vercel.app/

---

## Testing Checklist

### Test 1: First User Experience (10 minutes)

**Scenario:** Brand new user signs up and answers questions

**Steps:**
1. Sign in to the app (use incognito/private window for fresh user)
2. Go to `/question` page
3. ✅ Verify you see: "Questions today: 0/5"
4. ✅ Verify you see: "Streak: 0 days" (or no streak badge if 0)
5. Answer 1 question
6. ✅ Verify counter updates: "Questions today: 1/5"
7. Check dashboard
8. ✅ Verify "Current Streak" shows "1 day"
9. ✅ Verify "Questions Today" shows "1"

**Expected Result:** All counters update correctly, streak starts at 1

---

### Test 2: Daily Limit Enforcement (15 minutes)

**Scenario:** User hits the 5 question/day limit

**Steps:**
1. Continue from Test 1, or start fresh
2. Answer questions until counter shows "5/5"
3. Submit the 5th answer
4. ✅ Verify you see "Great work today! 🎉" message
5. ✅ Verify you see countdown timer (e.g., "23h 45m 12s")
6. ✅ Verify "View Your Progress" button appears
7. Try to load another question (refresh page)
8. ✅ Verify you still see limit reached screen (no new question)

**Expected Result:** Cannot answer more than 5 questions, countdown timer shows correct time

---

### Test 3: Streak Tracking (2 days required)

**Scenario:** User answers questions on consecutive days

**Day 1:**
1. Sign in and answer 1 question
2. ✅ Verify streak = 1 day
3. Sign out

**Day 2 (next day):**
1. Sign in again (same user)
2. Go to `/question`
3. ✅ Verify counter reset to "0/5"
4. Answer 1 question
5. ✅ Verify streak = 2 days
6. Check dashboard
7. ✅ Verify "Current Streak" shows "2 days"

**Day 3 (if streak >= 3):**
1. Answer 1 question
2. ✅ Verify streak badge shows 🔥 flame icon
3. ✅ Verify streak card on dashboard shows orange/red color

**Expected Result:** Streak increments each day, flame icon appears at 3 days

---

### Test 4: Streak Reset (Skip a Day)

**Scenario:** User skips a day, streak resets

**Steps:**
1. Answer questions today (streak = 1)
2. Don't answer questions tomorrow
3. Come back the day after (2 days later)
4. Answer a question
5. ✅ Verify streak = 1 (reset, not 2)

**Expected Result:** Streak resets to 1 after missing a day

---

### Test 5: Daily Reset at Midnight UTC

**Scenario:** Verify questions unlock at midnight UTC

**Steps:**
1. Answer 3 questions today (remaining: 2/5)
2. Note the reset time in countdown timer
3. Wait until exactly midnight UTC (or manually update `last_unlock_reset` in DB)
4. Refresh the page
5. ✅ Verify counter shows "0/5" again
6. ✅ Verify you can answer 5 new questions

**Expected Result:** Counter resets to 5 questions at midnight UTC

---

### Test 6: Backend API Endpoints

**Scenario:** Test all new API endpoints directly

**Test GET /api/unlock/remaining:**
```bash
curl "https://certverse-production.up.railway.app/api/unlock/remaining?userId=YOUR_CLERK_USER_ID"

# Expected response:
{
  "remaining": 3,
  "total": 5,
  "resetsAt": "2025-01-27T00:00:00.000Z",
  "streak": 2
}
```

**Test GET /api/stats/enhanced:**
```bash
curl "https://certverse-production.up.railway.app/api/stats/enhanced?userId=YOUR_CLERK_USER_ID"

# Expected response:
{
  "totalAnswered": 15,
  "totalCorrect": 10,
  "accuracy": 66.67,
  "currentStreak": 2,
  "longestStreak": 3,
  "questionsToday": 2
}
```

**Test POST /api/submit (verify stats update):**
```bash
curl -X POST https://certverse-production.up.railway.app/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "questionId": "QUESTION_ID",
    "selectedChoice": "A"
  }'

# After this, check /api/unlock/remaining again
# Verify remaining decreased by 1
```

---

## Manual Database Checks

### Check user_stats Table

```sql
-- View your stats
SELECT * FROM user_stats WHERE user_id = 'your_clerk_user_id';

-- Should see:
-- user_id, total_questions_attempted, current_streak, questions_unlocked_today, etc.
```

### Manually Reset Daily Unlock (for testing)

```sql
-- Set last_unlock_reset to yesterday to trigger reset
UPDATE user_stats
SET last_unlock_reset = NOW() - INTERVAL '1 day'
WHERE user_id = 'your_clerk_user_id';

-- Refresh app, should see 5/5 questions available again
```

### Manually Set Streak (for testing)

```sql
-- Set streak to 5 days to test flame icon
UPDATE user_stats
SET current_streak = 5
WHERE user_id = 'your_clerk_user_id';

-- Refresh dashboard, should see 🔥 icon
```

---

## Troubleshooting

### Issue: "Questions today: 0/0" or undefined

**Cause:** Frontend can't fetch unlock status

**Fix:**
```bash
# Check backend logs in Railway for errors
# Verify API endpoint is accessible:
curl https://certverse-production.up.railway.app/api/unlock/remaining?userId=test

# If 404, backend not deployed correctly
# If 500, check Sentry or Railway logs
```

---

### Issue: Counter not updating after submit

**Cause:** `fetchUnlockStatus()` not called after submit

**Fix:** Already implemented in `question/page.tsx:71`
- Verify code deployed
- Check browser console for errors

---

### Issue: Streak not incrementing

**Cause 1:** `updateStatsAfterAnswer()` not being called

**Fix:** Check Railway backend logs after submitting answer
- Should see: `✅ Updated stats for user_xxx: streak=2, total=10`

**Cause 2:** Same-day answers not incrementing

**Expected:** Answering multiple questions same day = streak stays same
- Streak only increments on CONSECUTIVE DAYS, not same-day questions

---

### Issue: "relation 'user_stats' does not exist"

**Cause:** Migration not run

**Fix:** Go back to Step 1 and run the migration SQL in Supabase

---

### Issue: Countdown timer shows negative time

**Cause:** Timezone mismatch (user local time vs UTC)

**Fix:** Already handled in code (`getNextResetTime()` uses UTC)
- If issue persists, check browser console for `resetsAt` value
- Should be UTC ISO string like "2025-01-27T00:00:00.000Z"

---

### Issue: Flame icon not showing at 3 day streak

**Cause:** Conditional not working

**Fix:** Check in dashboard and question page:
```tsx
{unlockStatus.streak >= 3 && <Flame className="..." />}
```

Verify `unlockStatus.streak` value in console:
```javascript
console.log('Streak:', unlockStatus.streak)
```

---

## Performance Checks

### Database Query Performance

After a few hundred users:

```sql
-- Check if index exists on user_stats.user_id
\d user_stats

-- Should see: idx_user_stats_user_id

-- If missing, create it:
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
```

### API Response Time

Use Railway metrics or test manually:

```bash
time curl "https://certverse-production.up.railway.app/api/unlock/remaining?userId=test"

# Should complete in < 300ms
```

---

## Success Criteria

✅ **Week 3 is successful if:**

1. New users can answer exactly 5 questions per day
2. Counter shows "Questions today: X/5" correctly
3. After 5 questions, "limit reached" screen appears
4. Countdown timer shows accurate time until midnight UTC
5. Streak increments on consecutive days
6. Streak shows 🔥 flame icon at 3+ days
7. Dashboard displays streak and "questions today" stats
8. No errors in Sentry or backend logs
9. All API endpoints return 200 OK
10. Stats update correctly after each answer

---

## Next Steps After Testing

Once all tests pass:

### 1. Demo Video (30 minutes)

Record a 2-minute video showing:
- Sign in
- Answer 5 questions
- See counter update (0/5 → 5/5)
- Hit daily limit
- See countdown timer
- Check dashboard (streak, questions today)

Post on LinkedIn: "Just shipped Week 3 of my CISA prep app! Daily unlock limits + streak tracking to build study habits."

### 2. Beta Testing (Week 7)

Invite 5-10 people to test:
- Send them the deployed URL
- Ask them to use it for 3 consecutive days
- Collect feedback on:
  - Is 5 Q/day too few or too many?
  - Does streak motivate them?
  - Any bugs or UX issues?

### 3. Monitor Metrics

Track in a spreadsheet (daily for 1 week):
- How many users hit 5 Q/day limit?
- Average streak length
- % of users who return next day
- Any error spikes in Sentry

### 4. Iterate

Based on feedback:
- If users want more questions: Increase to 7-10 for free tier
- If streak feels meaningless: Add rewards (badges, achievements)
- If too many drop-offs: Add push notifications for streaks

---

## Week 4 Preview

After Week 3 is stable, you'll build:

**Week 4: "Free users see paywall, paid users get unlimited"**

- Free: 2 Q/day (down from 5)
- Paid: Unlimited + explanations
- Stripe checkout integration
- Plan enforcement middleware

But for now, **focus on testing and validating Week 3!**

---

## Quick Reference

**Migration file:** `backend/migrations/002_user_stats.sql`
**Unlock service:** `backend/src/services/unlockService.ts`
**API endpoints:** `backend/src/index.ts:162-188`
**Question page:** `frontend/app/(dashboard)/question/page.tsx`
**Dashboard:** `frontend/app/(dashboard)/dashboard/page.tsx`
**API client:** `frontend/lib/api.ts`

**Key Functions:**
- `getRemainingQuestions(userId)` - Get unlock status
- `updateStatsAfterAnswer(userId, isCorrect)` - Update stats + streak
- `getEnhancedUserStats(userId)` - Get stats with streak
- `CountdownTimer({ resetsAt })` - Countdown UI component

---

**Ready to deploy!** Follow the steps above and let me know if you hit any issues.

Good luck! 🚀
