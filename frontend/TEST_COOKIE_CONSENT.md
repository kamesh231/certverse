# Cookie Consent Testing Guide

**Purpose:** Verify GDPR-compliant cookie consent is working correctly
**Status:** Ready for Testing
**Last Updated:** January 18, 2026

---

## Quick Test Script

Copy and paste these commands in the browser console to test cookie consent:

### Test 1: Clear Consent & Reload
```javascript
// Clear all consent data
localStorage.removeItem('cookie-consent');
localStorage.removeItem('cookie-preferences');
localStorage.removeItem('cookie-consent-date');
console.log('✅ Consent cleared. Reload page to see banner.');
location.reload();
```

### Test 2: Check Current Consent
```javascript
// Check current consent status
const consent = localStorage.getItem('cookie-consent');
const preferences = JSON.parse(localStorage.getItem('cookie-preferences') || '{}');
const date = localStorage.getItem('cookie-consent-date');

console.log('📋 Cookie Consent Status:');
console.log('Consent Given:', consent === 'true');
console.log('Preferences:', preferences);
console.log('Consent Date:', date);
console.log('Analytics Enabled:', preferences.analytics === true);
console.log('Marketing Enabled:', preferences.marketing === true);
```

### Test 3: Simulate Accept All
```javascript
// Simulate user accepting all cookies
const allAccepted = {
  necessary: true,
  analytics: true,
  marketing: true
};

localStorage.setItem('cookie-consent', 'true');
localStorage.setItem('cookie-preferences', JSON.stringify(allAccepted));
localStorage.setItem('cookie-consent-date', new Date().toISOString());
window.dispatchEvent(new Event('cookie-consent-updated'));

console.log('✅ All cookies accepted. Analytics should initialize.');
```

### Test 4: Simulate Reject All
```javascript
// Simulate user rejecting optional cookies
const onlyNecessary = {
  necessary: true,
  analytics: false,
  marketing: false
};

localStorage.setItem('cookie-consent', 'true');
localStorage.setItem('cookie-preferences', JSON.stringify(onlyNecessary));
localStorage.setItem('cookie-consent-date', new Date().toISOString());
window.dispatchEvent(new Event('cookie-consent-updated'));

console.log('✅ Optional cookies rejected. Analytics should NOT load.');
```

### Test 5: Check if Google Analytics is Loading
```javascript
// Check if Google Analytics is loaded
const gaLoaded = typeof window.gtag !== 'undefined' || 
                 typeof window.ga !== 'undefined' ||
                 document.querySelector('script[src*="google-analytics"]') !== null;

console.log('📊 Google Analytics:', gaLoaded ? '✅ Loaded' : '❌ Not Loaded');

// Check if PostHog is loaded
const posthogLoaded = typeof window.posthog !== 'undefined';
console.log('📊 PostHog:', posthogLoaded ? '✅ Loaded' : '❌ Not Loaded');
```

### Test 6: Verify Network Requests
```javascript
// Check Network tab for analytics requests
console.log('📡 Check Network tab for:');
console.log('- google-analytics.com (if analytics consent given)');
console.log('- app.posthog.com (if analytics consent given)');
console.log('- sentry.io (if analytics consent given)');
console.log('');
console.log('If consent NOT given, these should NOT appear.');
```

---

## Manual Testing Checklist

### ✅ Pre-Test Setup
- [ ] Open browser in incognito/private mode
- [ ] Visit: https://certverse.vercel.app
- [ ] Open Developer Tools (F12)
- [ ] Go to Application → Local Storage

### ✅ Test 1: First Visit Banner
- [ ] Banner appears at bottom of page
- [ ] Banner has "Accept All" button
- [ ] Banner has "Customize" button  
- [ ] Banner has "Reject All" button
- [ ] Banner has X close button
- [ ] Links to Privacy, Terms, Cookies work
- [ ] Banner is responsive on mobile

### ✅ Test 2: Accept All
- [ ] Click "Accept All"
- [ ] Banner disappears
- [ ] localStorage has `cookie-consent: "true"`
- [ ] localStorage has preferences with analytics: true
- [ ] localStorage has consent date
- [ ] Refresh page - banner doesn't reappear
- [ ] Network tab shows analytics requests (GA, PostHog)

### ✅ Test 3: Reject All
**Setup:** Clear localStorage, reload page
- [ ] Click "Reject All"
- [ ] Banner disappears
- [ ] localStorage shows analytics: false
- [ ] Refresh page - banner doesn't reappear
- [ ] Network tab shows NO analytics requests

### ✅ Test 4: Customize Preferences
**Setup:** Clear localStorage, reload page
- [ ] Click "Customize"
- [ ] Preferences UI appears
- [ ] "Necessary Cookies" has checkmark (not toggleable)
- [ ] "Analytics Cookies" has checkbox (toggleable)
- [ ] "Marketing Cookies" has checkbox (toggleable)
- [ ] Toggle Analytics ON
- [ ] Click "Save Preferences"
- [ ] Banner disappears
- [ ] Preferences saved correctly in localStorage

### ✅ Test 5: Cancel Customize
**Setup:** Clear localStorage, reload page
- [ ] Click "Customize"
- [ ] Toggle some preferences
- [ ] Click "Cancel"
- [ ] Returns to main banner view
- [ ] Previous toggles not saved

### ✅ Test 6: Cross-Tab Sync
- [ ] Open site in Tab 1 and Tab 2
- [ ] In Tab 1: Clear localStorage and reload
- [ ] In Tab 1: Accept cookies
- [ ] In Tab 2: Reload page
- [ ] Banner should NOT appear in Tab 2
- [ ] Preferences synced across tabs

### ✅ Test 7: Cookie Policy Page
- [ ] Visit /cookies
- [ ] Page loads successfully
- [ ] All sections present:
  - [ ] What Are Cookies
  - [ ] How We Use Cookies
  - [ ] Types of Cookies
  - [ ] Third-Party Cookies
  - [ ] Google Analytics section
  - [ ] PostHog section
  - [ ] Managing Preferences
  - [ ] Browser Settings
  - [ ] Updates to Policy
  - [ ] Contact Us
- [ ] External links work (Google, PostHog privacy policies)
- [ ] Browser settings links work
- [ ] "Back to Home" link works

### ✅ Test 8: Sentry Consent Check
**Setup:** Have Sentry DSN configured
- [ ] Reject cookies
- [ ] Trigger an error (e.g., throw new Error('test'))
- [ ] Check Network tab - Sentry request should NOT be sent
- [ ] Accept cookies
- [ ] Trigger an error again
- [ ] Check Network tab - Sentry request SHOULD be sent

### ✅ Test 9: PostHog Opt-In/Out
- [ ] Reject cookies initially
- [ ] Open console and check: `window.posthog` should be undefined
- [ ] Accept cookies
- [ ] Wait 2 seconds
- [ ] Open console and check: `window.posthog` should be defined
- [ ] Check `window.posthog.__loaded` should be true

### ✅ Test 10: Mobile Responsiveness
- [ ] Open DevTools mobile emulation
- [ ] Visit site
- [ ] Banner displays correctly on small screen
- [ ] Buttons stack vertically on mobile
- [ ] Customize view is scrollable
- [ ] Text is readable
- [ ] Touch targets are large enough (44x44px min)

---

## Automated Testing Script

Save this as `test-cookie-consent.html` and open in browser:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Cookie Consent Test</title>
  <style>
    body { font-family: monospace; padding: 20px; }
    .pass { color: green; }
    .fail { color: red; }
    .info { color: blue; }
  </style>
</head>
<body>
  <h1>Cookie Consent Automated Test</h1>
  <div id="results"></div>

  <script>
    const results = document.getElementById('results');

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

    // Run tests
    log('Starting Cookie Consent Tests...', 'info');
    log('', 'info');

    // Test 1: localStorage functions
    test(
      'localStorage is accessible',
      typeof localStorage !== 'undefined'
    );

    // Test 2: Clear state
    localStorage.removeItem('cookie-consent');
    localStorage.removeItem('cookie-preferences');
    test(
      'Can clear cookie consent from localStorage',
      !localStorage.getItem('cookie-consent')
    );

    // Test 3: Set consent
    localStorage.setItem('cookie-consent', 'true');
    test(
      'Can set cookie consent in localStorage',
      localStorage.getItem('cookie-consent') === 'true'
    );

    // Test 4: Set preferences
    const prefs = { necessary: true, analytics: true, marketing: false };
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    const savedPrefs = JSON.parse(localStorage.getItem('cookie-preferences'));
    test(
      'Can save and retrieve preferences',
      savedPrefs.necessary === true && 
      savedPrefs.analytics === true && 
      savedPrefs.marketing === false
    );

    // Test 5: Event dispatching
    let eventFired = false;
    window.addEventListener('cookie-consent-updated', () => {
      eventFired = true;
    });
    window.dispatchEvent(new Event('cookie-consent-updated'));
    test(
      'Custom event dispatches correctly',
      eventFired
    );

    // Test 6: Date storage
    const date = new Date().toISOString();
    localStorage.setItem('cookie-consent-date', date);
    test(
      'Can store consent date',
      localStorage.getItem('cookie-consent-date') === date
    );

    log('', 'info');
    log('Tests completed!', 'info');
    log('Open Certverse to test UI interactions.', 'info');
  </script>
</body>
</html>
```

---

## Expected Behavior Matrix

| User Action | Banner Visible | localStorage Set | Analytics Loads | Network Requests |
|-------------|----------------|------------------|-----------------|------------------|
| First visit | ✅ Yes | ❌ No | ❌ No | None |
| Accept All | ❌ No | ✅ Yes (all true) | ✅ Yes | GA, PostHog, Sentry |
| Reject All | ❌ No | ✅ Yes (only necessary) | ❌ No | None |
| Customize (analytics ON) | ❌ No | ✅ Yes (analytics true) | ✅ Yes | GA, PostHog, Sentry |
| Customize (analytics OFF) | ❌ No | ✅ Yes (analytics false) | ❌ No | None |
| Return visit (consented) | ❌ No | ✅ Yes | Based on prefs | Based on prefs |
| Close banner (X) | ❌ No | ❌ No | ❌ No | None |

---

## Common Issues & Solutions

### Issue: Banner doesn't appear
**Solution:** Check localStorage - if consent exists, clear it

### Issue: Analytics loads without consent
**Solution:** Check AnalyticsProvider - verify consent check before loading

### Issue: Preferences not saving
**Solution:** Check browser console for errors, verify localStorage not blocked

### Issue: Banner appears on every visit
**Solution:** Check if localStorage is being cleared on browser close

### Issue: Sentry events sent without consent
**Solution:** Check `beforeSend` hook in sentry.client.config.ts

---

## Performance Checklist

- [ ] Banner loads in < 100ms
- [ ] No layout shift when banner appears
- [ ] Analytics initialization < 500ms after consent
- [ ] PostHog lazy loads (not blocking initial render)
- [ ] No console errors or warnings

---

## Accessibility Checklist

- [ ] Banner is keyboard navigable (Tab key)
- [ ] Buttons have focus indicators
- [ ] Screen reader announces banner
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Text is readable at 200% zoom
- [ ] All interactive elements have labels

---

## Legal Compliance Checklist

### GDPR (EU)
- [ ] Consent before non-essential cookies
- [ ] Clear information about cookies
- [ ] Easy opt-out mechanism
- [ ] Granular consent options
- [ ] Consent withdrawal possible
- [ ] Records consent date

### CCPA (California)
- [ ] "Do Not Sell" equivalent provided
- [ ] Clear disclosure of data collection
- [ ] Opt-out mechanism provided

### ePrivacy Directive
- [ ] Cookie notice on first visit
- [ ] Consent before non-essential cookies
- [ ] Information about cookie purposes

---

## Sign-Off

After completing all tests above, sign off on production readiness:

**Tested By:** ___________________
**Date:** ___________________
**Browser:** ___________________
**All Tests Passed:** [ ] Yes [ ] No

**Notes:**
_________________________________
_________________________________
_________________________________

---

**Status:** ✅ Ready for Production Testing
