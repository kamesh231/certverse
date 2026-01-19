# Review Mistakes Mode - Testing Guide

**Feature:** Review Mistakes Mode
**Date:** January 18, 2026
**Status:** Ready for Testing

---

## Quick Test Commands

### Backend API Testing

```bash
# Set your JWT token
TOKEN="your_clerk_jwt_token_here"
API_URL="https://certverse-production.up.railway.app"

# Test 1: Get question in review mode (user with mistakes)
curl -X GET "$API_URL/api/question?userEmail=test@example.com&incorrectOnly=true" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Returns a question the user answered incorrectly
# Status: 200 OK

# Test 2: Get question in review mode (user with no mistakes)
curl -X GET "$API_URL/api/question?userEmail=test@example.com&incorrectOnly=true" \
  -H "Authorization: Bearer $TOKEN"

# Expected: {"error":"No incorrect answers found","message":"You haven't answered any questions incorrectly yet. Keep practicing!"}
# Status: 404 Not Found

# Test 3: Get question in review mode with domain filter
curl -X GET "$API_URL/api/question?userEmail=test@example.com&incorrectOnly=true&domain=1" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Returns incorrect question from Domain 1 only
# Status: 200 OK

# Test 4: Verify daily limit bypass
# First reach daily limit with normal questions, then:
curl -X GET "$API_URL/api/question?userEmail=test@example.com&incorrectOnly=true" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Returns question (limit doesn't apply)
# Status: 200 OK
```

---

## Frontend Manual Testing

### Test Suite 1: User with Incorrect Answers

**Prerequisites:**
- User account with at least 3 incorrect answers
- Access to `/study` page

**Steps:**

1. **Navigate to Study Page**
   ```
   URL: /study
   Expected: Page loads
   ```

2. **Verify Badge Display**
   ```
   Location: Review Mistakes card
   Expected: Orange badge showing count (e.g., "3")
   ```

3. **Verify Button State**
   ```
   Expected: "Start Review" button is enabled
   ```

4. **Click Start Review**
   ```
   Action: Click "Start Review" button
   Expected: Navigate to /question?incorrectOnly=true
   ```

5. **Verify Review Mode Banner**
   ```
   Expected: Orange banner at top saying "Review Mistakes Mode"
   Expected: Message "Daily limits don't apply in this mode"
   ```

6. **Verify Domain Selector Hidden**
   ```
   Expected: Domain selector card NOT visible in review mode
   ```

7. **Verify Question Loads**
   ```
   Expected: Question displayed
   Expected: Question is one user answered incorrectly
   ```

8. **Answer Question Correctly**
   ```
   Action: Select correct answer
   Expected: Green highlight on correct answer
   Expected: Explanation shown (if premium user)
   ```

9. **Load Next Question**
   ```
   Action: Click "Next Question"
   Expected: Another incorrect question loads
   Expected: Still in review mode (banner visible)
   ```

10. **Test Multiple Questions**
    ```
    Action: Answer and proceed through 5 questions
    Expected: All questions are from user's incorrect set
    Expected: May see repeats if < 5 incorrect answers
    ```

---

### Test Suite 2: User with No Incorrect Answers

**Prerequisites:**
- New user account OR user with 100% accuracy
- Access to `/study` page

**Steps:**

1. **Navigate to Study Page**
   ```
   URL: /study
   Expected: Page loads
   ```

2. **Verify No Badge**
   ```
   Location: Review Mistakes card
   Expected: NO badge displayed
   ```

3. **Verify Button State**
   ```
   Expected: Button shows "No Mistakes to Review"
   Expected: Button is DISABLED (grayed out)
   ```

4. **Verify Helper Text**
   ```
   Expected: Text "No incorrect answers yet. Keep practicing!"
   ```

5. **Try Clicking Button**
   ```
   Action: Attempt to click disabled button
   Expected: Nothing happens (button disabled)
   ```

---

### Test Suite 3: Daily Limit Bypass

**Prerequisites:**
- Free user account
- User has answered 2 questions today (daily limit reached)
- User has at least 1 incorrect answer from previous days

**Steps:**

1. **Verify Daily Limit Reached**
   ```
   URL: /question
   Expected: "Daily Limit Reached" message
   Expected: Upgrade CTA shown
   ```

2. **Navigate to Study Page**
   ```
   URL: /study
   Expected: Page loads normally
   ```

3. **Verify Review Mode Available**
   ```
   Expected: "Start Review" button enabled
   Expected: Badge shows count of incorrect answers
   ```

4. **Start Review Mode**
   ```
   Action: Click "Start Review"
   Expected: Navigate to /question?incorrectOnly=true
   ```

5. **Verify Question Loads**
   ```
   Expected: Question displayed (no limit error)
   Expected: Review mode banner visible
   ```

6. **Answer Multiple Questions**
   ```
   Action: Answer 3-5 questions in review mode
   Expected: All load successfully
   Expected: No limit errors
   ```

---

### Test Suite 4: Count Updates

**Prerequisites:**
- User with some incorrect answers
- Access to answer questions

**Steps:**

1. **Check Initial Count**
   ```
   URL: /study
   Expected: Badge shows count (e.g., "5")
   Note the count
   ```

2. **Answer New Questions Incorrectly**
   ```
   URL: /question
   Action: Answer 2 questions incorrectly
   ```

3. **Return to Study (Without Refresh)**
   ```
   Action: Navigate back to /study (browser back button)
   Expected: Count UNCHANGED (cached)
   ```

4. **Refresh Study Page**
   ```
   Action: Hard refresh (Ctrl+R or Cmd+R)
   Expected: Count UPDATED (e.g., now "7")
   ```

---

### Test Suite 5: Mobile Responsiveness

**Prerequisites:**
- Mobile device OR DevTools mobile emulation
- User with incorrect answers

**Steps:**

1. **Study Page Mobile View**
   ```
   Device: iPhone 12 (or similar)
   URL: /study
   Expected: Cards stack vertically
   Expected: Badge visible and readable
   Expected: Button full width
   ```

2. **Question Page Mobile View**
   ```
   URL: /question?incorrectOnly=true
   Expected: Review banner responsive
   Expected: Text wraps correctly
   Expected: No horizontal scroll
   ```

3. **Touch Targets**
   ```
   Expected: All buttons at least 44x44px
   Expected: Easy to tap on mobile
   ```

---

### Test Suite 6: Error Scenarios

#### Scenario A: Network Error

**Steps:**
1. Open DevTools → Network tab
2. Go to /study
3. Throttle connection to "Slow 3G"
4. Click "Start Review"
5. **Expected:** Loading spinner shown
6. **Expected:** Error message if timeout
7. **Expected:** "Try Again" button available

#### Scenario B: Unauthorized

**Steps:**
1. Clear browser cookies (log out)
2. Try to visit /question?incorrectOnly=true
3. **Expected:** Redirect to sign-in page
4. **Expected:** No data exposed

#### Scenario C: Database Error

**Steps:**
1. (Requires backend access) Temporarily disable database
2. Try to load review mode
3. **Expected:** User-friendly error message
4. **Expected:** "Try Again" button
5. **Expected:** No stack trace exposed

---

## Automated Testing Script

Save as `test-review-mode.html` and open in browser:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Review Mode Test</title>
  <style>
    body { font-family: monospace; padding: 20px; }
    .pass { color: green; }
    .fail { color: red; }
    .info { color: blue; }
  </style>
</head>
<body>
  <h1>Review Mistakes Mode Test Suite</h1>
  <div id="results"></div>

  <script>
    const results = document.getElementById('results');
    const API_URL = 'http://localhost:3001'; // Change for production

    function log(message, type = 'info') {
      const p = document.createElement('p');
      p.className = type;
      p.textContent = message;
      results.appendChild(p);
    }

    function test(name, condition) {
      if (condition) {
        log(`✅ PASS: ${name}`, 'pass');
        return true;
      } else {
        log(`❌ FAIL: ${name}`, 'fail');
        return false;
      }
    }

    async function runTests() {
      log('Starting Review Mode Tests...', 'info');
      log('', 'info');

      // Get token (you'll need to implement this based on your auth)
      const token = prompt('Enter your Clerk JWT token:');
      if (!token) {
        log('❌ No token provided. Tests aborted.', 'fail');
        return;
      }

      const userEmail = prompt('Enter your email:');
      if (!userEmail) {
        log('❌ No email provided. Tests aborted.', 'fail');
        return;
      }

      // Test 1: Fetch question in review mode
      log('Test 1: Fetch question with incorrectOnly=true...', 'info');
      try {
        const response = await fetch(
          `${API_URL}/api/question?userEmail=${encodeURIComponent(userEmail)}&incorrectOnly=true`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          const question = await response.json();
          test('API returns question in review mode', question.id !== undefined);
          test('Question has domain', question.domain >= 1 && question.domain <= 5);
          test('Question has choices', question.choice_a && question.choice_b);
        } else if (response.status === 404) {
          const error = await response.json();
          test('API returns 404 for no mistakes', error.error === 'No incorrect answers found');
          log('ℹ️  User has no incorrect answers', 'info');
        } else {
          test('API returns valid status code', false);
        }
      } catch (error) {
        log(`❌ Test 1 failed: ${error.message}`, 'fail');
      }

      // Test 2: Verify normal mode still works
      log('', 'info');
      log('Test 2: Fetch question without incorrectOnly...', 'info');
      try {
        const response = await fetch(
          `${API_URL}/api/question?userEmail=${encodeURIComponent(userEmail)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        const question = await response.json();
        test('Normal mode still works', response.status === 200 || response.status === 403);
      } catch (error) {
        log(`❌ Test 2 failed: ${error.message}`, 'fail');
      }

      log('', 'info');
      log('Tests completed!', 'info');
      log('Check manual tests in browser for full coverage.', 'info');
    }

    runTests();
  </script>
</body>
</html>
```

---

## Performance Testing

### Load Time Benchmarks

**Acceptable Performance:**
- Study page load: < 2 seconds
- Incorrect count fetch: < 500ms
- Review mode question fetch: < 500ms

**Test Commands:**
```bash
# Measure study page load time
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/study"

# Measure API response time
curl -w "Time: %{time_total}s\n" -o /dev/null -s \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/question?userEmail=test@test.com&incorrectOnly=true"
```

---

## Accessibility Testing

### Checklist

- [ ] Keyboard navigation works (Tab through all elements)
- [ ] Screen reader announces "Review Mistakes Mode" banner
- [ ] Badge has appropriate aria-label
- [ ] Button states announced (enabled/disabled)
- [ ] Focus indicators visible on all interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Zoom to 200% - all text readable
- [ ] No keyboard traps

### Tools

- Chrome DevTools Lighthouse (Accessibility score)
- WAVE browser extension
- NVDA/JAWS screen reader testing

---

## Browser Compatibility

Test on:
- [ ] Chrome 120+ (Windows/Mac)
- [ ] Firefox 120+ (Windows/Mac)
- [ ] Safari 17+ (Mac/iOS)
- [ ] Edge 120+ (Windows)
- [ ] Mobile Safari (iOS 16+)
- [ ] Mobile Chrome (Android)

---

## Sign-Off

After completing all tests, sign off on production readiness:

**Tested By:** ___________________
**Date:** ___________________
**Environment:** [ ] Local [ ] Staging [ ] Production

**Test Results:**
- Test Suite 1 (With Mistakes): [ ] Pass [ ] Fail
- Test Suite 2 (No Mistakes): [ ] Pass [ ] Fail
- Test Suite 3 (Limit Bypass): [ ] Pass [ ] Fail
- Test Suite 4 (Count Updates): [ ] Pass [ ] Fail
- Test Suite 5 (Mobile): [ ] Pass [ ] Fail
- Test Suite 6 (Errors): [ ] Pass [ ] Fail

**Issues Found:**
_________________________________
_________________________________
_________________________________

**Ready for Production:** [ ] Yes [ ] No

---

**Status:** ✅ Ready for Testing
