# Week 3 Testing - Quick Summary

## 📚 Test Documentation Created

I've created comprehensive testing documentation:

1. **`WEEK3_TEST_CASES.md`** - 50+ detailed test cases
2. **`CURL_COMMANDS.md`** - API testing commands
3. **`test-backend-week3.sh`** - Automated backend tests
4. **`test-deployment.sh`** - Quick deployment check

---

## 🎯 9 Test Categories

### 1. **First-Time User** (4 tests)
- Sign up flow
- First question load
- First answer
- Dashboard check

### 2. **Daily Unlock Limits** (5 tests)
- Answer 5 questions → hit limit
- Verify limit persists (refresh, new tab)
- Countdown timer accuracy
- Bypass attempt

### 3. **Daily Reset** (2 tests)
- Reset at midnight UTC
- Stats persist after reset

### 4. **Streak Tracking** (6 tests)
- Day 1 streak start
- Day 2 consecutive
- Day 3 flame icon appears
- Same-day doesn't increment
- Streak resets after skip
- Longest streak preserved

### 5. **Dashboard Stats** (4 tests)
- All stats load correctly
- Accuracy calculation
- Recent activity feed
- Domain performance chart

### 6. **UI/UX** (4 tests)
- Question page layout
- Limit reached card design
- Mobile responsive (question)
- Mobile responsive (dashboard)

### 7. **Edge Cases** (7 tests)
- No questions in DB
- Network error
- Answered all questions
- Same question twice
- Spam clicking
- Very long streak (100+ days)
- Timezone differences

### 8. **Performance** (2 tests)
- Page load time < 2s
- Multiple concurrent requests

### 9. **Backend API** (3 tests)
- GET /api/unlock/remaining
- GET /api/stats/enhanced
- POST /api/submit updates stats

---

## ⚡ Quick Start (Choose One)

### Option A: 5-Minute Critical Test (Recommended First)

Run just the 10 most important tests:

```
✅ TC-001: New user can sign in
✅ TC-002: Question loads with badges
✅ TC-003: Answer submission works
✅ TC-101: Can answer 5 questions
✅ TC-102: Limit screen appears
✅ TC-104: Countdown timer works
✅ TC-301: Streak starts at 1
✅ TC-401: Dashboard loads stats
✅ TC-501: UI looks correct
✅ TC-801: API endpoint works
```

**If all 10 pass:** Week 3 is ready! ✅

---

### Option B: Automated Backend Test

```bash
./test-backend-week3.sh
```

**Time:** 30 seconds
**Tests:** 7 backend endpoints
**Output:** Color-coded pass/fail

---

### Option C: Full Manual Testing

Follow `WEEK3_TEST_CASES.md` step by step.

**Time:** 2-3 hours
**Tests:** 50+
**Coverage:** Complete

---

## 📋 Before You Start

### Step 1: Run Migration (2 min)

**Must do first!** Go to Supabase SQL Editor and run:

```sql
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
CREATE POLICY "Enable read access for all users" ON user_stats FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON user_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON user_stats FOR UPDATE USING (true);
```

### Step 2: Verify Deployment

Check Railway shows "Active" status at:
https://railway.app/dashboard

Check Vercel shows "Ready" status at:
https://vercel.com/dashboard

---

## 🎨 What You're Testing

### Visual Elements
- ✅ "Questions today: 0/5" badge
- ✅ "Streak: X days" badge
- ✅ 🔥 Flame icon (at 3+ day streak)
- ✅ "Great work today! 🎉" limit card
- ✅ Countdown timer (HH:MM:SS)
- ✅ Dashboard stat cards

### Functionality
- ✅ Daily 5 question limit
- ✅ Counter increments (0/5 → 1/5 → ... → 5/5)
- ✅ Limit enforced (no 6th question)
- ✅ Streak tracking (consecutive days)
- ✅ Streak resets if skip day
- ✅ Daily reset at midnight UTC

### Data
- ✅ Stats update after each answer
- ✅ Accuracy calculated correctly
- ✅ Streak persists across sessions
- ✅ Questions today resets daily

---

## 🐛 Common Issues & Fixes

### Issue: "Questions today: undefined/undefined"

**Cause:** Backend not responding or migration not run

**Fix:**
1. Check Railway is "Active"
2. Run migration in Supabase
3. Check browser console for errors

---

### Issue: Counter doesn't update after submit

**Cause:** API call failing

**Fix:**
1. Open DevTools → Network tab
2. Submit answer
3. Look for `/api/unlock/remaining` call
4. Check response

---

### Issue: Streak doesn't increment next day

**Cause:** Not actually a new UTC day yet

**Fix:**
1. Check current UTC time: `new Date().toISOString()`
2. Reset happens at midnight UTC, not local time
3. Or manually test by updating DB

---

### Issue: Countdown timer shows wrong time

**Cause:** Timezone confusion

**Fix:**
- Timer should show time until midnight **UTC**, not local midnight
- If currently 6 PM UTC → shows ~6 hours
- If currently 11 PM local but 4 AM UTC → shows ~20 hours

---

## 📊 Success Criteria

Week 3 is **ready for launch** if:

1. ✅ All 10 critical tests pass
2. ✅ No console errors
3. ✅ UI looks professional
4. ✅ Daily limit works
5. ✅ Streak tracking works
6. ✅ Countdown timer counts down
7. ✅ Stats update correctly
8. ✅ Mobile responsive
9. ✅ Backend APIs return 200 OK
10. ✅ Database migration successful

---

## 🚀 Testing Workflow

### Day 1 (Today)
1. Run database migration
2. Run automated backend test
3. Do 5-minute critical test in browser
4. Document any issues

### Day 2 (Tomorrow)
1. Test streak increment (consecutive day)
2. Verify daily reset worked
3. Test on mobile device
4. Full manual testing (optional)

### Day 3 (Optional)
1. Test 3-day streak flame icon
2. Test edge cases
3. Performance testing
4. Final polish

---

## 📝 Test Result Template

After testing, document your results:

```markdown
## Test Results - [Date]

**Tester:** [Your Name]
**Environment:** Production / Staging
**Device:** Desktop / Mobile / Both

### Critical Tests
- [ ] TC-001: Sign in ✅ / ❌
- [ ] TC-002: Question loads ✅ / ❌
- [ ] TC-003: Answer works ✅ / ❌
- [ ] TC-101: 5 questions limit ✅ / ❌
- [ ] TC-102: Limit persists ✅ / ❌
- [ ] TC-104: Timer works ✅ / ❌
- [ ] TC-301: Streak starts ✅ / ❌
- [ ] TC-401: Dashboard ✅ / ❌
- [ ] TC-501: UI correct ✅ / ❌
- [ ] TC-801: API works ✅ / ❌

**Pass Rate:** X / 10

### Issues Found
1. [Issue description]
2. [Issue description]

### Screenshots
- [Link to screenshot 1]
- [Link to screenshot 2]

### Recommendation
✅ Ready to ship
⚠️  Minor fixes needed
❌ Major issues, not ready
```

---

## 🎯 Next Steps After Testing

### If All Tests Pass ✅

1. **Record demo video** (2 min)
   - Show answering 5 questions
   - Show hitting limit
   - Show countdown timer
   - Show dashboard with streak

2. **Invite beta testers** (3-5 people)
   - Friends, colleagues, or Twitter followers
   - Ask them to test for 3 consecutive days
   - Collect feedback

3. **Start Week 4 planning**
   - Free vs Paid tiers
   - Stripe integration
   - Plan enforcement

### If Tests Fail ❌

1. **Document all failing tests**
   - Screenshot each failure
   - Note expected vs actual
   - Check browser console for errors

2. **Share with me**
   - Which tests failed?
   - Error messages?
   - Screenshots?

3. **Fix and retest**
   - I'll help fix issues
   - Run tests again
   - Verify fixes work

---

## 📞 Need Help?

If you encounter issues:

1. **Check `WEEK3_TEST_CASES.md`** for detailed steps
2. **Check `CURL_COMMANDS.md`** for API testing
3. **Run `./test-backend-week3.sh`** for backend check
4. **Share results** with me for debugging

---

**Ready to test?** Start with the 5-minute critical test! 🚀
