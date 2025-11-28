# Week 3 - Complete Test Cases

## Test Coverage Overview

This document covers all test scenarios for Week 3 features:
- ✅ Daily unlock limits (5 questions/day)
- ✅ Streak tracking (consecutive days)
- ✅ Enhanced stats display
- ✅ Limit reached UI
- ✅ Countdown timer
- ✅ Daily reset logic

---

## Setup: Before Testing

### Prerequisites
1. ✅ Run database migration in Supabase (`user_stats` table exists)
2. ✅ Backend deployed on Railway (build successful)
3. ✅ Frontend deployed on Vercel
4. ✅ At least 20 questions in database

### Test Users
Create multiple test accounts for different scenarios:
- **User A**: Fresh user (never used app)
- **User B**: Has 1-day streak
- **User C**: Has 5-day streak
- **User D**: Skipped a day (broken streak)

---

# Test Cases

## Category 1: First-Time User Experience

### TC-001: Brand New User Sign Up
**Precondition:** User has never signed in before

**Steps:**
1. Go to https://certverse.vercel.app/
2. Click "Sign In"
3. Create new account with Clerk
4. Complete Clerk signup flow
5. Redirected to app

**Expected Results:**
- ✅ User successfully signs in
- ✅ No errors in console
- ✅ Redirected to dashboard or question page

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-002: First Question Load
**Precondition:** Fresh user just signed in

**Steps:**
1. Navigate to `/question` page
2. Observe page load

**Expected Results:**
- ✅ Badge shows: "Questions today: 0/5"
- ✅ Badge shows: "Streak: 0 days" OR no streak badge
- ✅ Question loads successfully
- ✅ 4 multiple choice options visible
- ✅ Submit button present

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-003: First Answer Submission
**Precondition:** User on question page, hasn't answered yet

**Steps:**
1. Select any choice (A, B, C, or D)
2. Click "Submit"
3. Wait for response

**Expected Results:**
- ✅ Shows correct/incorrect indicator
- ✅ Shows correct answer
- ✅ Shows explanation
- ✅ "Next Question" button appears
- ✅ Counter updates to "1/5"
- ✅ Streak badge shows "1 day"

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-004: Check Dashboard After First Answer
**Precondition:** User just answered 1 question

**Steps:**
1. Navigate to `/dashboard`
2. Observe stats

**Expected Results:**
- ✅ "Questions Answered" card shows: 1
- ✅ "Accuracy Rate" card shows: 0% or 100% (based on correctness)
- ✅ "Current Streak" card shows: 1 day
- ✅ "Questions Today" card shows: 1
- ✅ Recent activity shows the answered question

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

## Category 2: Daily Unlock Limit Testing

### TC-101: Answer 5 Questions in One Session
**Precondition:** User has 5/5 questions available

**Steps:**
1. Go to `/question`
2. Note counter: "0/5"
3. Answer question #1 → Note counter: "1/5"
4. Click "Next Question"
5. Answer question #2 → Note counter: "2/5"
6. Click "Next Question"
7. Answer question #3 → Note counter: "3/5"
8. Click "Next Question"
9. Answer question #4 → Note counter: "4/5"
10. Click "Next Question"
11. Answer question #5 → Note counter: "5/5"
12. Observe what happens after 5th answer

**Expected Results:**
- ✅ Counter increments: 0/5 → 1/5 → 2/5 → 3/5 → 4/5 → 5/5
- ✅ After 5th question, see "Great work today! 🎉" card
- ✅ Message: "You've completed all 5 questions for today"
- ✅ Countdown timer appears
- ✅ "View Your Progress" button visible
- ✅ NO "Next Question" button
- ✅ Cannot load a 6th question

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-102: Verify Limit Persists After Refresh
**Precondition:** User just hit 5/5 limit

**Steps:**
1. After hitting limit, refresh the page (F5 or Cmd+R)
2. Observe page state

**Expected Results:**
- ✅ Still shows "Great work today!" card
- ✅ Still shows "5/5" counter
- ✅ Countdown timer still running
- ✅ No new question loads

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-103: Verify Limit Persists in New Tab
**Precondition:** User hit 5/5 limit in Tab 1

**Steps:**
1. Open new tab
2. Go to https://certverse.vercel.app/question
3. Sign in (should auto-login if same browser)

**Expected Results:**
- ✅ Shows same "Great work today!" card
- ✅ Shows "5/5" counter
- ✅ No new question available

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-104: Countdown Timer Accuracy
**Precondition:** User hit daily limit

**Steps:**
1. Note the countdown timer time
2. Wait 60 seconds (1 minute)
3. Observe timer update

**Expected Results:**
- ✅ Timer counts down every second
- ✅ Time decreases by ~60 seconds after 1 minute
- ✅ Format: "Xh Ym Zs" (hours, minutes, seconds)
- ✅ Shows correct time until midnight UTC

**Example:**
- If current time is 6:30 PM UTC, timer should show ~5h 30m
- If current time is 11:45 PM UTC, timer should show ~15m

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-105: Try to Bypass Limit (Direct API Call)
**Precondition:** User hit 5/5 limit

**Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Paste this code (replace USER_ID):
```javascript
fetch('https://certverse-production.up.railway.app/api/question?userId=YOUR_CLERK_USER_ID')
  .then(r => r.json())
  .then(console.log)
```
4. Observe response

**Expected Results:**
- ✅ API returns a question (API doesn't enforce limit yet - this is OK for Week 3)
- ✅ BUT frontend doesn't show it (UI enforces limit)
- ⚠️ Note: Full enforcement will come in Week 4 with paid plans

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

**Note:** This is expected behavior for Week 3. API-level enforcement comes later.

---

## Category 3: Daily Reset Testing

### TC-201: Reset at Midnight UTC (Manual Simulation)
**Precondition:** User has answered 3/5 questions today

**Steps:**
1. Go to Supabase dashboard
2. Open Table Editor → `user_stats`
3. Find your user's row
4. Edit `last_unlock_reset` field
5. Set it to yesterday's date (e.g., if today is 2025-01-26, set to `2025-01-25T00:00:00.000Z`)
6. Save
7. Go back to app and refresh `/question` page

**Expected Results:**
- ✅ Counter resets to "0/5"
- ✅ Can answer 5 new questions
- ✅ Previous day's answers still count in total stats
- ✅ Streak remains intact (didn't skip a day)

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-202: Verify Stats Persist After Reset
**Precondition:** Just triggered daily reset (from TC-201)

**Steps:**
1. Go to `/dashboard`
2. Check "Questions Answered" total
3. Check "Questions Today" counter

**Expected Results:**
- ✅ "Questions Answered" shows total from all days (e.g., 8)
- ✅ "Questions Today" shows 0 (reset for new day)
- ✅ Accuracy % is calculated from all-time stats

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

## Category 4: Streak Tracking

### TC-301: Day 1 Streak Start
**Precondition:** Brand new user, never answered a question

**Steps:**
1. Answer 1 question
2. Check streak on question page
3. Check streak on dashboard

**Expected Results:**
- ✅ Question page badge: "Streak: 1 day"
- ✅ Dashboard "Current Streak" card: "1 day"
- ✅ Dashboard "Longest Streak" card: "1 day"
- ✅ NO flame icon (only appears at 3+ days)

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-302: Day 2 Consecutive Streak
**Precondition:** User has 1-day streak from yesterday

**Setup:**
1. Simulate next day (update `last_unlock_reset` in DB to yesterday)
2. Refresh app

**Steps:**
1. Answer 1 question today
2. Check streak

**Expected Results:**
- ✅ Streak increments to 2 days
- ✅ "Current Streak" shows: "2 days"
- ✅ "Longest Streak" shows: "2 days"
- ✅ Still no flame icon (need 3+ days)

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-303: Day 3 Flame Icon Appears
**Precondition:** User has 2-day streak

**Setup:**
1. Simulate next day (update DB)
2. Refresh app

**Steps:**
1. Answer 1 question today
2. Check streak badges

**Expected Results:**
- ✅ Streak shows: "3 days"
- ✅ 🔥 Flame icon appears on question page badge
- ✅ 🔥 Flame icon appears on dashboard card
- ✅ Streak badge color changes to orange/red
- ✅ "Longest Streak" still shows: "3 days"

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-304: Streak Continues Same Day (No Increment)
**Precondition:** User answered 1 question today (streak = 1)

**Steps:**
1. Answer 4 more questions (total 5 for the day)
2. Check streak after each answer

**Expected Results:**
- ✅ Streak STAYS at "1 day" (doesn't increment to 2, 3, 4, 5)
- ✅ Streak only increments on consecutive DAYS, not same-day questions
- ✅ "Questions Today" increments: 1 → 2 → 3 → 4 → 5

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-305: Streak Resets After Skipping a Day
**Precondition:** User has 5-day streak

**Setup:**
1. Don't answer any questions for 2 days
2. Simulate 2 days later (update `last_activity_date` to 3 days ago)
3. Simulate reset for new day

**Steps:**
1. Come back and answer 1 question
2. Check streak

**Expected Results:**
- ✅ "Current Streak" resets to: "1 day"
- ✅ "Longest Streak" STAYS at: "5 days" (preserves best streak)
- ✅ No flame icon (streak < 3)

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-306: Longest Streak Preserved
**Precondition:** User had 7-day streak, then broke it, now has 2-day streak

**Expected Results:**
- ✅ "Current Streak": 2 days
- ✅ "Longest Streak": 7 days (doesn't decrease)

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

## Category 5: Dashboard Stats

### TC-401: Dashboard Loads All Stats
**Precondition:** User has answered some questions

**Steps:**
1. Navigate to `/dashboard`
2. Observe all stat cards

**Expected Results:**
- ✅ 4 stat cards visible:
  1. Questions Answered (shows total number)
  2. Accuracy Rate (shows %)
  3. Current Streak (shows days, flame if >= 3)
  4. Questions Today (shows count)
- ✅ All numbers are accurate
- ✅ No "undefined" or "NaN" values
- ✅ Loading state appears briefly, then stats load

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-402: Accuracy Calculation
**Precondition:** User answered 10 questions: 7 correct, 3 incorrect

**Expected Results:**
- ✅ "Accuracy Rate" shows: 70%
- ✅ Calculation: (7 / 10) * 100 = 70%
- ✅ Rounds to nearest whole number

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-403: Recent Activity Feed
**Precondition:** User has answered at least 5 questions

**Steps:**
1. Scroll to "Recent Activity" section on dashboard
2. Observe entries

**Expected Results:**
- ✅ Shows last 5 answered questions
- ✅ Each entry shows:
  - ✅ or ❌ icon (correct/incorrect)
  - Question ID (truncated)
  - Selected choice (A, B, C, or D)
  - Time ago (e.g., "5 minutes ago", "2 hours ago")
- ✅ Most recent at top
- ✅ Oldest at bottom

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-404: Domain Performance Chart
**Precondition:** User has answered questions across different domains

**Steps:**
1. Check "Domain Performance" bar chart on dashboard

**Expected Results:**
- ✅ Chart shows 5 domains
- ✅ Bars show percentage (0-100%)
- ✅ Hover shows full domain name
- ✅ Chart is readable and styled correctly

**Note:** This currently shows MOCK data. Real data implementation is future work.

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

## Category 6: UI/UX Testing

### TC-501: Question Page Layout
**Steps:**
1. Go to `/question`
2. Check page layout

**Expected Results:**
- ✅ Badges are centered at top
- ✅ Question card is centered
- ✅ 4 choices are clearly visible
- ✅ Submit button is enabled
- ✅ Text is readable (proper contrast)
- ✅ No layout shifts or jumps

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-502: Limit Reached Card Design
**Precondition:** User hit 5/5 limit

**Expected Results:**
- ✅ Card is centered on page
- ✅ Title: "Great work today! 🎉"
- ✅ Subtitle: "You've completed all 5 questions for today"
- ✅ Countdown timer is large and visible
- ✅ "View Your Progress" button is prominent
- ✅ Footer text encourages streak continuation
- ✅ Card has proper spacing and padding

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-503: Mobile Responsive (Question Page)
**Steps:**
1. Open `/question` on mobile device or resize browser to 375px width
2. Check layout

**Expected Results:**
- ✅ Badges stack vertically or wrap properly
- ✅ Question text is readable
- ✅ Choices don't overflow
- ✅ Buttons are tap-friendly (not too small)
- ✅ No horizontal scroll

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-504: Mobile Responsive (Dashboard)
**Steps:**
1. Open `/dashboard` on mobile
2. Check layout

**Expected Results:**
- ✅ Stat cards stack vertically (1 column)
- ✅ Chart is responsive
- ✅ Recent activity is readable
- ✅ No content cut off

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

## Category 7: Edge Cases

### TC-601: No Questions in Database
**Precondition:** Database has 0 questions

**Expected Results:**
- ✅ Shows error message: "No questions available"
- ✅ Doesn't crash
- ✅ Provides helpful message

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-602: Network Error During Submit
**Steps:**
1. Open DevTools → Network tab
2. Enable "Offline" mode
3. Try to submit an answer

**Expected Results:**
- ✅ Shows error message
- ✅ Doesn't crash
- ✅ Can retry after going back online

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-603: Answered All Available Questions
**Precondition:** User has answered all 20 questions in database

**Steps:**
1. Try to load a new question

**Expected Results:**
- ✅ Cycles back to previously answered questions
- ✅ OR shows "You've completed all questions!" message
- ✅ Doesn't crash

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-604: Same Question Twice in One Day
**Precondition:** User answers question #1 today

**Steps:**
1. Note question ID
2. Answer 4 more questions
3. Check if question #1 appears again

**Expected Results:**
- ✅ Should NOT show same question twice in one day
- ✅ Only shows unanswered questions (if available)

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-605: Rapid Answer Submission (Spam Click)
**Steps:**
1. Load a question
2. Quickly click Submit button 5 times in a row

**Expected Results:**
- ✅ Only 1 answer is recorded
- ✅ Button disables after first click
- ✅ No duplicate responses in database
- ✅ Counter increments only once

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-606: Very Long Streak (100+ Days)
**Setup:**
1. Manually set streak to 100 in database

**Expected Results:**
- ✅ Shows "100 days" correctly
- ✅ Flame icon still appears
- ✅ No overflow or layout issues

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-607: User Timezone Differences
**Scenario:** User is in different timezone (e.g., PST, IST, JST)

**Expected Results:**
- ✅ Daily reset still happens at midnight UTC for all users
- ✅ Countdown timer shows correct time until midnight UTC
- ✅ Not dependent on user's local timezone

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

## Category 8: Performance Testing

### TC-701: Page Load Time
**Steps:**
1. Open DevTools → Network tab
2. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
3. Check load time

**Expected Results:**
- ✅ Question page loads in < 2 seconds
- ✅ Dashboard loads in < 2 seconds
- ✅ API calls return in < 500ms

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

### TC-702: Multiple Concurrent Requests
**Steps:**
1. Open 3 tabs
2. All tabs on `/question` page
3. Answer question in all tabs simultaneously

**Expected Results:**
- ✅ All tabs work correctly
- ✅ Counter updates in all tabs
- ✅ No race conditions
- ✅ Database integrity maintained

**Actual Result:** _____

**Status:** ⬜ Pass ⬜ Fail

---

## Category 9: Backend API Testing

### TC-801: GET /api/unlock/remaining
```bash
curl "https://certverse-production.up.railway.app/api/unlock/remaining?userId=test_user"
```

**Expected Response:**
```json
{
  "remaining": 5,
  "total": 5,
  "resetsAt": "2025-01-27T00:00:00.000Z",
  "streak": 0
}
```

**Status:** ⬜ Pass ⬜ Fail

---

### TC-802: GET /api/stats/enhanced
```bash
curl "https://certverse-production.up.railway.app/api/stats/enhanced?userId=test_user"
```

**Expected Response:**
```json
{
  "totalAnswered": 0,
  "totalCorrect": 0,
  "accuracy": 0,
  "currentStreak": 0,
  "longestStreak": 0,
  "questionsToday": 0
}
```

**Status:** ⬜ Pass ⬜ Fail

---

### TC-803: POST /api/submit Updates Stats
**Steps:**
1. Get initial stats
2. Submit an answer
3. Get stats again

**Expected:**
- ✅ `totalAnswered` increments by 1
- ✅ `currentStreak` increments to 1 (if first answer of the day)
- ✅ `questionsToday` increments by 1

**Status:** ⬜ Pass ⬜ Fail

---

## Test Summary Template

After completing all tests, fill this out:

### Overall Results

**Total Tests:** 50+

**Passed:** ___ / 50+

**Failed:** ___ / 50+

**Blocked:** ___ / 50+

### Critical Issues Found

1. _____________________
2. _____________________
3. _____________________

### Minor Issues Found

1. _____________________
2. _____________________
3. _____________________

### Recommendations

1. _____________________
2. _____________________
3. _____________________

---

## Quick Test Checklist (5 Minutes)

If you don't have time for full testing, run these critical tests:

- [ ] TC-001: New user can sign in
- [ ] TC-002: Question loads with badges
- [ ] TC-003: Answer submission works
- [ ] TC-101: Can answer 5 questions
- [ ] TC-102: Limit screen appears after 5
- [ ] TC-104: Countdown timer works
- [ ] TC-301: Streak starts at 1
- [ ] TC-401: Dashboard loads stats
- [ ] TC-501: UI looks correct
- [ ] TC-801: API endpoint works

**If all 10 pass:** Week 3 is ready! ✅

---

## Notes

- Replace `test_user` with actual Clerk user IDs
- Use incognito windows for testing different user scenarios
- Clear cookies between tests if needed
- Document any unexpected behavior
- Take screenshots of failures

**Happy testing! 🧪**
