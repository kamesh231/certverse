# Review Mistakes Mode - Testing Guide

**Feature:** Review Mistakes Mode
**Status:** Ready for Testing
**Date:** January 18, 2026

---

## Quick Test Scripts

### Backend API Testing (via curl)

```bash
# Set your variables
export API_URL="https://certverse-production.up.railway.app"
export TOKEN="your_clerk_jwt_token_here"
export USER_EMAIL="your_email@example.com"

# Test 1: Normal question (should work)
curl -X GET "${API_URL}/api/question?userEmail=${USER_EMAIL}" \
  -H "Authorization: Bearer ${TOKEN}"

# Test 2: Review mode question (should return incorrect questions or 404)
curl -X GET "${API_URL}/api/question?userEmail=${USER_EMAIL}&incorrectOnly=true" \
  -H "Authorization: Bearer ${TOKEN}"

# Test 3: Review mode with domain filter
curl -X GET "${API_URL}/api/question?userEmail=${USER_EMAIL}&incorrectOnly=true&domain=1" \
  -H "Authorization: Bearer ${TOKEN}"

# Test 4: Get user history (to see incorrect answers)
curl -X GET "${API_URL}/api/history?limit=20" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Frontend Console Testing

Open the browser console on the study page:

```javascript
// Test 1: Check incorrect count
async function testIncorrectCount() {
  const { getIncorrectAnswersCount } = await import('/lib/api');
  const token = 'your_token'; // Get from Clerk
  const userId = 'your_user_id';
  
  const count = await getIncorrectAnswersCount(userId, token);
  console.log('Incorrect answer count:', count);
}
testIncorrectCount();

// Test 2: Fetch review question
async function testReviewQuestion() {
  const { fetchQuestion } = await import('/lib/api');
  const token = 'your_token';
  const userId = 'your_user_id';
  const userEmail = 'your_email@example.com';
  
  try {
    const question = await fetchQuestion(userId, userEmail, undefined, true, token);
    console.log('Review question:', question);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
testReviewQuestion();
```

---

## Manual Testing Checklist

### Setup Phase

- [ ] Ensure you have a test account
- [ ] Answer at least 5-10 questions
- [ ] Ensure at least 2-3 answers are incorrect
- [ ] Clear browser cache for fresh start

### Test 1: Study Page - With Incorrect Answers

**Steps:**
1. Navigate to `/study`
2. Wait for page to load (spinner appears)

**Expected Results:**
- [ ] Orange badge appears on "Review Mistakes" card
- [ ] Badge shows correct count (e.g., "3")
- [ ] "Start Review" button is enabled (blue, not grayed out)
- [ ] Text shows: "You have X incorrect answer(s) to review"

**Screenshot:** Take screenshot showing badge and enabled button

### Test 2: Study Page - No Incorrect Answers

**Steps:**
1. Use account with 100% accuracy or new account
2. Navigate to `/study`

**Expected Results:**
- [ ] No badge appears on "Review Mistakes" card
- [ ] Button shows "No Mistakes to Review"
- [ ] Button is disabled (grayed out)
- [ ] Text shows: "No incorrect answers yet. Keep practicing!"

### Test 3: Enter Review Mode

**Steps:**
1. From study page (with incorrect answers)
2. Click "Start Review" button

**Expected Results:**
- [ ] Navigate to `/question?incorrectOnly=true`
- [ ] Orange banner appears at top
- [ ] Banner text: "Review Mistakes Mode"
- [ ] Banner subtitle: "You're reviewing questions you answered incorrectly. Daily limits don't apply in this mode."
- [ ] Domain selector is hidden (not shown in review mode)
- [ ] Question loads and displays

### Test 4: Review Mode Question is Actually Incorrect

**Steps:**
1. In review mode, note the question ID or text
2. Open new tab, go to Developer Tools → Console
3. Check your history:
```javascript
const { getUserHistory } = await import('/lib/api');
const history = await getUserHistory(userId, 100, token);
const incorrectIds = history.filter(r => !r.correct).map(r => r.question_id);
console.log('Incorrect question IDs:', incorrectIds);
```

**Expected Results:**
- [ ] Current question ID is in the list of incorrect IDs
- [ ] Question is one you actually got wrong

### Test 5: Next Question in Review Mode

**Steps:**
1. In review mode, answer the question
2. Click "Next Question"
3. Repeat 3-5 times

**Expected Results:**
- [ ] Each question is from your incorrect answers
- [ ] Questions may repeat (random selection)
- [ ] No daily limit error appears
- [ ] Banner remains visible on each question

### Test 6: Daily Limit Doesn't Apply

**Steps:**
1. As free user, answer your daily limit (2 questions)
2. Try to get a new regular question
3. Verify you get "Daily limit reached" error
4. Navigate to review mode: `/question?incorrectOnly=true`

**Expected Results:**
- [ ] Regular mode: Shows daily limit error
- [ ] Review mode: Questions load successfully
- [ ] No limit error in review mode
- [ ] Can continue reviewing unlimited times

### Test 7: No Incorrect Answers in Review Mode

**Steps:**
1. Use account that answered all questions correctly
2. Navigate to `/question?incorrectOnly=true`

**Expected Results:**
- [ ] Error message appears
- [ ] Message: "You haven't answered any questions incorrectly yet. Keep practicing!"
- [ ] "Try Again" button appears
- [ ] Or redirects to study page

### Test 8: Count Updates (Partial)

**Steps:**
1. Note incorrect count on study page (e.g., 3)
2. Navigate to regular question practice
3. Answer 2 questions incorrectly
4. Return to study page (don't refresh)

**Expected Results:**
- [ ] Count still shows old value (3) - this is expected (cached)
- [ ] Refresh page (F5)
- [ ] Count updates to new value (5)

**Note:** Real-time updates not implemented (feature for v2)

### Test 9: Mobile Responsiveness

**Steps:**
1. Open DevTools mobile emulation (iPhone 12 Pro)
2. Navigate to `/study`
3. Check Review Mistakes card
4. Enter review mode
5. Answer question

**Expected Results:**
- [ ] Badge visible and not cut off
- [ ] Button text readable
- [ ] Review banner fits on screen
- [ ] Question card scrollable
- [ ] Touch targets large enough (44px minimum)

### Test 10: Error Handling

**Steps:**
1. Disconnect network (DevTools → Network → Offline)
2. Try to load study page count
3. Try to load review question

**Expected Results:**
- [ ] Loading spinner appears
- [ ] Eventually shows error or timeout
- [ ] Error message is user-friendly
- [ ] No console errors that crash the app
- [ ] Can retry when network restored

---

## Performance Testing

### Load Time Measurements

**Study Page:**
- [ ] Time to load incorrect count: ____ms (should be < 500ms)
- [ ] Time to render full page: ____ms (should be < 1000ms)

**Question Page (Review Mode):**
- [ ] Time to fetch review question: ____ms (should be < 400ms)
- [ ] Time to show banner: ____ms (should be < 50ms)

**Tools:** Use Chrome DevTools → Network tab, Performance tab

### Concurrent Users Test

**Steps:**
1. Open 3 browser tabs
2. Sign in to different accounts in each
3. All navigate to review mode simultaneously
4. Answer questions in all tabs

**Expected Results:**
- [ ] All tabs work correctly
- [ ] No race conditions
- [ ] Questions don't overlap between users
- [ ] Database handles concurrent requests

---

## Security Testing

### Test 1: Can't Access Other Users' Mistakes

**Steps:**
1. Get your incorrect question IDs
2. Sign in as different user (or manipulate JWT)
3. Try to access those question IDs

**Expected Results:**
- [ ] Can only see own incorrect answers
- [ ] JWT verification prevents access to other users' data
- [ ] 401 Unauthorized if JWT invalid

### Test 2: SQL Injection Attempt

**Steps:**
1. Try malicious input:
```bash
curl "${API_URL}/api/question?userEmail=test@test.com&incorrectOnly=true'; DROP TABLE responses;--"
```

**Expected Results:**
- [ ] 400 Bad Request (validation error)
- [ ] Query is sanitized
- [ ] No database damage
- [ ] Error logged in Sentry

### Test 3: Rate Limiting

**Steps:**
1. Write script to call review endpoint 101 times rapidly
```bash
for i in {1..101}; do
  curl "${API_URL}/api/question?userEmail=${EMAIL}&incorrectOnly=true" \
    -H "Authorization: Bearer ${TOKEN}"
done
```

**Expected Results:**
- [ ] First 100 requests succeed (within 15 min window)
- [ ] 101st request returns 429 Too Many Requests
- [ ] Rate limiting still applies to review mode

---

## Browser Compatibility Testing

Test in each browser:

### Chrome (Latest)
- [ ] Study page loads correctly
- [ ] Badge appears
- [ ] Review mode works
- [ ] No console errors

### Firefox (Latest)
- [ ] Study page loads correctly
- [ ] Badge appears
- [ ] Review mode works
- [ ] No console errors

### Safari (Latest)
- [ ] Study page loads correctly
- [ ] Badge appears
- [ ] Review mode works
- [ ] No console errors

### Mobile Safari (iOS)
- [ ] Study page responsive
- [ ] Badge visible
- [ ] Review mode works
- [ ] Touch events work

### Mobile Chrome (Android)
- [ ] Study page responsive
- [ ] Badge visible
- [ ] Review mode works
- [ ] Touch events work

---

## Accessibility Testing

### Keyboard Navigation

**Steps:**
1. Tab through study page
2. Tab to "Start Review" button
3. Press Enter to activate

**Expected Results:**
- [ ] Can reach all interactive elements with Tab
- [ ] Focus indicators visible
- [ ] Enter/Space activates buttons
- [ ] Can navigate without mouse

### Screen Reader

**Steps:**
1. Enable VoiceOver (Mac) or NVDA (Windows)
2. Navigate to study page
3. Tab to Review Mistakes card

**Expected Results:**
- [ ] Badge count is announced
- [ ] Button label is announced
- [ ] Card title is announced
- [ ] Review mode banner is announced

### Color Contrast

**Tools:** Use WAVE browser extension or Chrome Lighthouse

**Expected Results:**
- [ ] Text passes WCAG AA (4.5:1 contrast)
- [ ] Badge text readable
- [ ] Orange banner text readable (on light and dark theme)

---

## Edge Cases Testing

### Edge Case 1: Exactly 1 Incorrect Answer

**Steps:**
1. Answer 10 questions, get exactly 1 incorrect
2. Go to review mode
3. Answer that question multiple times

**Expected Results:**
- [ ] Badge shows "1"
- [ ] Text: "You have 1 incorrect answer to review"
- [ ] Same question repeats each time (only one to choose from)

### Edge Case 2: All Questions Incorrect

**Steps:**
1. Answer 5 questions, all incorrect
2. Go to review mode

**Expected Results:**
- [ ] Badge shows "5"
- [ ] All 5 questions appear in review mode
- [ ] Random selection from all 5

### Edge Case 3: Answer Review Question Correctly

**Steps:**
1. In review mode, answer incorrect question correctly this time
2. Click next question

**Expected Results:**
- [ ] Question still appears in review pool (based on history)
- [ ] Count doesn't update until page refresh
- [ ] User can see question again

**Note:** To remove from review pool, would need real-time update (v2 feature)

### Edge Case 4: Very Long Question Text

**Steps:**
1. Find or create question with 500+ character text
2. Answer incorrectly
3. View in review mode

**Expected Results:**
- [ ] Text wraps correctly
- [ ] Card doesn't break layout
- [ ] Scrollable if needed
- [ ] Still readable on mobile

---

## Regression Testing

Ensure existing features still work:

### Regular Question Practice

- [ ] Can still fetch regular questions
- [ ] Daily limits still apply (non-review mode)
- [ ] Domain filter still works
- [ ] Answer submission still works
- [ ] Explanations still shown

### Study Page Other Modes

- [ ] Study Mode button works
- [ ] Practice Mode with domain works
- [ ] Test Mode still shows "Coming Soon"
- [ ] Navigation to dashboard works

---

## Load Testing (Optional)

**Scenario:** 100 concurrent users in review mode

**Tools:** k6, Apache Bench, or Postman Runner

**Script Example (k6):**
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 100,
  duration: '30s',
};

export default function() {
  const params = {
    headers: {
      'Authorization': `Bearer ${__ENV.TOKEN}`,
    },
  };
  
  const res = http.get(
    `${__ENV.API_URL}/api/question?userEmail=${__ENV.EMAIL}&incorrectOnly=true`,
    params
  );
  
  check(res, {
    'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

**Expected Results:**
- [ ] 95% of requests < 500ms
- [ ] 99% of requests < 1000ms
- [ ] 0% error rate (or < 1%)
- [ ] Server remains responsive

---

## Bug Report Template

If you find issues, report them with this format:

```
**Title:** [Brief description]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots:**
[Attach if applicable]

**Browser/Device:**
- Browser: Chrome 120
- OS: macOS 14
- Device: Desktop

**Console Errors:**
```
[Paste any console errors]
```

**Additional Context:**
[Any other relevant information]
```

---

## Sign-Off

After completing all tests:

**Tested By:** ___________________
**Date:** ___________________
**Environment:** [ ] Local [ ] Staging [ ] Production

**Summary:**
- Total Tests Run: ___
- Tests Passed: ___
- Tests Failed: ___
- Blockers Found: ___

**Ready for Production:** [ ] Yes [ ] No

**Notes:**
_________________________________
_________________________________
_________________________________

---

**Status:** ✅ Ready for Testing
