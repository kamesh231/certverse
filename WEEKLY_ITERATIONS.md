# Certverse - Weekly Iteration Plan

## Philosophy: Ship Something Usable Every Week

Each week delivers a **working, testable feature** you can demo and validate. No "80% done" weeks.

---

## Week 1: "I can practice questions"
**Goal:** Basic question practice flow working end-to-end

### Deliverable
A working app where you can:
- Sign in with Clerk
- See a random question
- Submit an answer
- See if you got it right

### Tasks

**Database (2 hours):**
- [ ] Create `responses` table if not exists
- [ ] Seed 50 sample questions (any domain, manual or Claude-generated)
- [ ] Add basic indexes

**Backend (4 hours):**
- [ ] `GET /api/questions/random` - Return 1 random question
- [ ] `POST /api/questions/submit` - Store user's answer
- [ ] Return correct/incorrect immediately

**Frontend (6 hours):**
- [ ] Simple `/practice` page
- [ ] Show question text + 4 choices (A/B/C/D buttons)
- [ ] Submit button
- [ ] Show ✅/❌ after submit
- [ ] "Next Question" button

### Success Criteria
- [ ] You can answer 10 questions in a row
- [ ] Responses saved to database
- [ ] No errors in Sentry

### Demo This
Record a 30-second video: "Here's me answering 3 CISA questions in my app"

---

## Week 2: "I can track my stats"
**Goal:** Dashboard showing basic performance metrics

### Deliverable
A dashboard that shows:
- Total questions attempted
- Overall accuracy %
- Breakdown by domain (if domain data exists)

### Tasks

**Database (1 hour):**
- [ ] Create `user_stats` table
- [ ] Add trigger/function to update stats on each response

**Backend (3 hours):**
- [ ] `GET /api/stats` - Return user stats
- [ ] Calculate accuracy % (correct/total)
- [ ] Calculate domain breakdown (if domain column exists)

**Frontend (8 hours):**
- [ ] Create `/dashboard` page
- [ ] Display stats in cards:
  - Total questions: 47
  - Accuracy: 68%
  - Domain 1: 12/20 (60%)
  - Domain 2: 8/10 (80%)
  - etc.
- [ ] Simple bar chart (use Recharts or just CSS bars)
- [ ] Add navigation link from practice page

### Success Criteria
- [ ] After answering 20 questions, dashboard shows accurate stats
- [ ] Stats update in real-time after each answer
- [ ] Works for users with 0 questions attempted (shows 0%)

### Demo This
Screenshot: "My dashboard after answering 50 questions shows 72% accuracy"

---

## Week 3: "I can only practice X questions per day"
**Goal:** Daily unlock limit working (validates core mechanic)

### Deliverable
- Users see "You have 5 questions unlocked today"
- After completing 5, they see "Come back tomorrow!"
- Streak counter starts tracking

### Tasks

**Database (2 hours):**
- [ ] Add to `user_stats`:
  - `questions_unlocked_today`
  - `last_unlock_reset`
  - `current_streak`
- [ ] Create daily reset job (or check on each request)

**Backend (5 hours):**
- [ ] Create `unlockService.ts`:
  ```typescript
  function getDailyUnlock(userId): number {
    // Simple formula for now: 5 questions/day
    return 5;
  }

  function getRemainingToday(userId): number {
    const stats = getUserStats(userId);
    const attempted_today = getQuestionsAttemptedToday(userId);
    return Math.max(0, 5 - attempted_today);
  }
  ```
- [ ] `GET /api/unlock/remaining` - Return questions left today
- [ ] Block `/api/questions/random` if limit reached
- [ ] Reset counter at midnight UTC (cron or lazy check)

**Frontend (5 hours):**
- [ ] Show counter at top: "Questions today: 3/5"
- [ ] When limit reached, show:
  - "Great work! You've completed today's questions."
  - "Come back in X hours" (countdown timer)
  - Current streak: 🔥 3 days
- [ ] Disable "Next Question" button when limit reached

### Success Criteria
- [ ] Can only answer 5 questions per day
- [ ] Counter resets at midnight UTC
- [ ] Streak increments if you complete 5 questions two days in a row
- [ ] Streak resets if you skip a day

### Demo This
Video: "I answered 5 questions, now I'm locked out until tomorrow. My streak is 2 days."

---

## Week 4: "Free users see paywall, paid users get unlimited"
**Goal:** Monetization infrastructure working

### Deliverable
- Free plan: 2 questions/day, no explanations
- Paid plan: Unlimited questions, explanations shown
- Working Stripe checkout (test mode)

### Tasks

**Database (1 hour):**
- [ ] Create `subscriptions` table
- [ ] Seed your user as 'paid' for testing

**Backend (6 hours):**
- [ ] Install Stripe SDK
- [ ] `POST /api/stripe/create-checkout` - Create checkout session
- [ ] `POST /api/stripe/webhook` - Handle events:
  - `checkout.session.completed` → Set plan_type='paid'
  - `customer.subscription.deleted` → Set plan_type='free'
- [ ] Create middleware `getPlanType(userId)`
- [ ] Update unlock logic:
  ```typescript
  function getDailyUnlock(userId) {
    const plan = getPlanType(userId);
    if (plan === 'paid') return 999; // unlimited
    return 2; // free
  }
  ```

**Frontend (5 hours):**
- [ ] Create `/pricing` page:
  - Free: $0 - 2 Q/day
  - Premium: $29/mo - Unlimited + Explanations
- [ ] Add "Upgrade to Premium" banner on free tier
- [ ] Checkout flow:
  - Click "Subscribe"
  - Redirect to Stripe checkout
  - Handle success redirect
- [ ] Show/hide explanations based on plan

**Stripe Setup (30 min):**
- [ ] Create Stripe account
- [ ] Create product in test mode
- [ ] Get test API keys
- [ ] Add webhook endpoint

### Success Criteria
- [ ] Free users limited to 2 Q/day
- [ ] Can complete Stripe checkout (test mode with card 4242 4242 4242 4242)
- [ ] After checkout, plan upgrades to 'paid'
- [ ] Paid users see unlimited questions
- [ ] Free users don't see explanations, paid users do

### Demo This
Video: "As free user, I hit 2 Q/day limit → Upgrade → Checkout → Now unlimited!"

---

## Week 5: "Onboarding + Diagnostic sets my baseline"
**Goal:** New users get personalized setup

### Deliverable
- New user flow: Onboarding → Diagnostic (10 Qs) → Dashboard shows baseline
- Unlock algorithm now uses exam date from onboarding

### Tasks

**Database (2 hours):**
- [ ] Create `user_preferences` table (exam_date, study_time, goal_score)
- [ ] Create `diagnostic_results` table
- [ ] Mark 10 questions as `is_diagnostic = true`

**Backend (5 hours):**
- [ ] `POST /api/onboarding` - Save exam date + study time
- [ ] `GET /api/diagnostic/questions` - Return 10 diagnostic Qs (balanced by domain)
- [ ] `POST /api/diagnostic/submit` - Save all 10 answers at once
- [ ] Calculate baseline domain scores
- [ ] Update unlock algorithm:
  ```typescript
  function getDailyUnlock(userId) {
    const prefs = getUserPreferences(userId);
    const stats = getUserStats(userId);

    if (!prefs.exam_date) return 5; // default

    const daysLeft = Math.max(1, daysBetween(today, prefs.exam_date));
    const remaining = 500 - stats.total_attempted;
    const base = Math.ceil(remaining / daysLeft);

    return clamp(base, 3, 20);
  }
  ```

**Frontend (5 hours):**
- [ ] Create `/onboarding` page (multi-step form):
  - Step 1: "When is your CISA exam?" (date picker)
  - Step 2: "How much time per day?" (10/20/30/60 min buttons)
  - Step 3: "Goal score?" (optional input)
- [ ] Create `/diagnostic` page:
  - Show 1 question at a time
  - Progress bar (1/10, 2/10...)
  - At end, show results:
    - Domain 1: 2/3 (67%)
    - Domain 2: 1/2 (50%)
    - Domain 3: 1/3 (33%) ← Weakest
    - Domain 4: 2/2 (100%)
  - CTA: "Start your daily practice"
- [ ] Redirect new users to onboarding if not completed

### Success Criteria
- [ ] New user completes onboarding in <2 minutes
- [ ] Diagnostic shows domain breakdown
- [ ] Daily unlock adjusts based on exam date (e.g., 30 days = ~17 Q/day, 90 days = ~6 Q/day)
- [ ] Dashboard shows diagnostic baseline vs. current performance

### Demo This
Video: "New user signup → Onboarding (exam in 60 days) → Diagnostic (weak in Domain 3) → Gets 8 Q/day"

---

## Week 6: "Preparedness score + Coach teaser"
**Goal:** Gamification + future feature visibility

### Deliverable
- Dashboard shows "Preparedness Score: 68/100"
- Pricing page shows "Coach Plan - Coming Soon"
- App feels polished and ready for beta users

### Tasks

**Backend (3 hours):**
- [ ] Add to `GET /api/stats`:
  ```typescript
  function calculatePreparedness(userId) {
    const stats = getUserStats(userId);
    const overallAcc = stats.correct / stats.total;
    const recentAcc = getRecentAccuracy(userId, 20); // last 20 Qs
    const streakFactor = Math.min(stats.streak / 7, 1);

    return Math.round(
      50 * overallAcc +
      30 * recentAcc +
      20 * streakFactor
    );
  }
  ```

**Frontend (6 hours):**
- [ ] Add preparedness score to dashboard:
  - Large circular progress indicator (0-100)
  - Color-coded: <50 red, 50-75 yellow, >75 green
  - "You're 68% ready for CISA exam"
- [ ] Add to pricing page:
  ```
  ┌─────────────────────────────────────┐
  │ Coach Plan - $39/mo (Coming Q2)     │
  │ ─────────────────────────────────── │
  │ ✨ AI Reasoning Tutor               │
  │ 🎯 Adaptive Domain Focus            │
  │ 💬 Socratic Q&A                     │
  │ 📞 1 Free Call with CISA Mentor     │
  │                                     │
  │ [Join Waitlist] ←────────────────   │
  └─────────────────────────────────────┘
  ```
- [ ] Polish UI:
  - Consistent spacing/colors
  - Loading states
  - Error messages
  - Empty states ("No questions yet")

**Polish (3 hours):**
- [ ] Add watermark (user email in light gray, bottom-right of questions)
- [ ] Test on mobile (responsive design)
- [ ] Fix any Sentry errors
- [ ] Add basic analytics (Vercel Analytics or Plausible)

### Success Criteria
- [ ] Preparedness score updates after each question
- [ ] Score makes intuitive sense (good performance = high score)
- [ ] Coach plan visible but clearly marked "Coming Soon"
- [ ] App looks professional enough to show beta users

### Demo This
Video: "My preparedness went from 45% to 72% after practicing my weak domains. Excited for Coach plan!"

---

## Week 7: Beta Launch Week
**Goal:** 10-20 real users testing the app

### Deliverable
- App live in production
- Beta users invited
- Feedback collection system

### Tasks

**Pre-Launch (4 hours):**
- [ ] Security audit:
  - Enable RLS on all tables
  - Add Clerk JWT verification to backend
  - Test auth bypass attempts
  - Add input validation (Zod)
- [ ] Create Privacy Policy page (use generator like Termly)
- [ ] Create Terms of Service page
- [ ] Set up error alerting (Sentry email notifications)

**Content (4 hours):**
- [ ] Ensure 100+ quality questions in database
- [ ] Validate all explanations
- [ ] Balance domain distribution

**Launch (4 hours):**
- [ ] Deploy to production
- [ ] Switch Stripe to live mode
- [ ] Test end-to-end in production
- [ ] Invite beta users:
  - Email 10-20 people (CISA study groups, LinkedIn, friends)
  - "Early access - help me test my CISA prep app!"
  - Give them all free premium (1 month comp)
- [ ] Create feedback form (Typeform or Google Form)

### Success Criteria
- [ ] 10+ beta users signed up
- [ ] No critical errors in Sentry
- [ ] At least 3 users complete diagnostic
- [ ] Stripe checkout works in live mode (test with your own card)

### Demo This
Post on LinkedIn: "Just launched Certverse beta! 15 CISA candidates testing it this week."

---

## Week 8+: Iterate Based on Data
**Goal:** Hit MVP success metrics or pivot

### Track Weekly
- Sign-ups
- Diagnostic completion rate (target: 25%)
- Free → Paid conversion (target: 10%)
- Next-day return rate (target: 50%)
- Claude costs (target: <$40/mo)

### Iterate
- **If diagnostic completion <25%:** Simplify diagnostic, make it optional, or add incentive
- **If conversion <10%:** Test pricing ($19 vs $29), improve CTAs, add testimonials
- **If retention <50%:** Improve daily unlock formula, add notifications, gamify streaks
- **If costs >$40:** Add caching, reduce Claude calls, or increase pricing

---

## Success Milestones

### By End of Week 3
✅ You have a working practice app
✅ Daily unlock mechanic validated
✅ You're using it yourself daily

### By End of Week 6
✅ Complete MVP feature set
✅ Professional UI
✅ Ready for beta users
✅ Monetization infrastructure working

### By End of Week 8
✅ 20+ users signed up
✅ 2-3 paying customers
✅ Clear data on what's working/not working
✅ Decision point: Scale or pivot

---

## Weekly Routine

### Every Friday (End of Week)
1. **Demo:** Record 30-sec video of this week's feature
2. **Deploy:** Merge to main, deploy to production
3. **Reflect:** What worked? What didn't?
4. **Plan:** Adjust next week's scope if needed

### Every Monday (Start of Week)
1. **Goal:** Write down this week's deliverable
2. **Breakdown:** List 3-5 key tasks
3. **Focus:** Commit to shipping this ONE thing

---

## What If I Fall Behind?

### If a week takes 2 weeks:
**Don't panic.** Just slide the timeline. The weekly structure still works.

### If you get stuck:
**Cut scope ruthlessly.** Example:
- Week 5 too ambitious? Skip onboarding, just add exam date field to profile.
- Week 6 too much? Skip Coach teaser, just do preparedness score.

### If you want to go faster:
**Simplify, don't add.** Example:
- Use mock Stripe checkout (button that just upgrades plan without real payment)
- Use static unlock formula (always 5/day) instead of dynamic
- Skip diagnostic, just start users with 0% baseline

---

## The Rule: "Done is Better Than Perfect"

Each week, aim for:
- ✅ **Works:** Feature is functional
- ✅ **Tested:** You've tried it yourself
- ✅ **Deployed:** Live in production

Don't aim for:
- ❌ "Pixel perfect" design
- ❌ Edge case handling
- ❌ Premature optimization

You'll polish in Week 6. Until then, ship fast.

---

**Remember:** Every week you ship something usable, you learn. That's the goal.
