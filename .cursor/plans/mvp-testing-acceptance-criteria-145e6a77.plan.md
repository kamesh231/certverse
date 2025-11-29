<!-- 145e6a77-59a9-435f-b647-fba8c9ace495 752c7091-f497-416b-83ed-9902cedbd157 -->
# Weekly Business Milestone Plan - CISA Practice App MVP

## Overview

6-week iterative plan with weekly milestones that produce tangible, verifiable outcomes for non-technical stakeholders. Each milestone includes:

- **Deliverable**: What gets shipped
- **Business Outcome**: Why it matters
- **Verification Method**: How non-tech stakeholders can verify
- **Success Metrics**: Measurable indicators

---

## Week 1: Foundation & User Onboarding

**Theme**: "Users can sign up and set their exam goals"

### Deliverables

1. **Working sign-up/sign-in flow** (Clerk integration)
2. **Onboarding form** capturing:

- Exam date (date picker)
- Daily study time (10/20/30/60 min selector)
- Optional goal score

3. **User profile storage** in database
4. **Post-onboarding CTA** prompting diagnostic test

### Business Outcome

- Users can create accounts and express intent (exam date = commitment signal)
- Foundation for personalized experience

### Verification (Non-Tech)

- **Demo**: Sign up as new user → complete onboarding → see dashboard
- **Checklist**:
- [ ] Can create account with email
- [ ] Can select exam date (future date)
- [ ] Can select study time preference
- [ ] After onboarding, see "Take Diagnostic Test" button
- [ ] User data appears in database/admin panel

### Success Metrics

- 10+ test sign-ups completed
- 100% onboarding completion rate (if started)
- Zero sign-up errors

### Technical Tasks

- Set up user profiles table (exam_date, daily_study_time, goal_score, plan_type)
- Implement onboarding UI flow
- Store onboarding data
- Create post-onboarding redirect logic

---

## Week 2: Diagnostic Test & Domain Insights

**Theme**: "Users complete diagnostic and see their starting point"

### Deliverables

1. **10-question diagnostic test** (balanced across 4 domains)
2. **Diagnostic results page** showing:

- Domain accuracy breakdown (4 bars/chart)
- Weakest domain highlighted
- Overall score

3. **"Start Daily Plan" CTA** after diagnostic
4. **Diagnostic completion tracking** in database

### Business Outcome

- Users understand their baseline competency
- Creates "aha moment" (weakest domain = motivation to improve)
- Diagnostic completion = high-intent user signal

### Verification (Non-Tech)

- **Demo**: Complete diagnostic → see results page with domain scores
- **Checklist**:
- [ ] Can start diagnostic from onboarding or dashboard
- [ ] Diagnostic shows 10 questions (mix of domains)
- [ ] After completion, see 4 domain scores
- [ ] Weakest domain is clearly highlighted
- [ ] "Start Daily Plan" button appears
- [ ] Diagnostic completion tracked (can query database)

### Success Metrics

- 25% of signed-up users complete diagnostic (MVP goal)
- Average diagnostic completion time < 15 minutes
- All 4 domains represented in results

### Technical Tasks

- Create diagnostic test logic (10 questions, balanced domains)
- Build results page UI
- Calculate domain accuracy
- Store diagnostic responses
- Identify weakest domain algorithm

---

## Week 3: Daily Unlock System & Question Practice

**Theme**: "Users can practice questions with daily pacing"

### Deliverables

1. **Daily unlock calculation** based on:

- Remaining questions
- Days until exam
- Current streak

2. **Question practice flow**:

- Show question
- User selects answer
- Show correct/wrong + explanation
- Track response

3. **Streak tracking** (increases on completion, decreases on miss)
4. **"X questions unlocked today"** display on dashboard

### Business Outcome

- Users engage daily (streak = habit formation)
- Pacing prevents burnout (adaptive unlock)
- Foundation for paid conversion (unlock limits = upgrade trigger)

### Verification (Non-Tech)

- **Demo**: Complete diagnostic → see "5 questions unlocked today" → practice 3 → streak shows "1 day"
- **Checklist**:
- [ ] Dashboard shows "X questions unlocked today"
- [ ] Can start practicing questions
- [ ] After answering, see if correct/wrong
- [ ] Explanation appears after answer
- [ ] Streak counter updates (visible on dashboard)
- [ ] Unlock count decreases after each question
- [ ] Missing a day decreases streak

### Success Metrics

- 50% of diagnostic completers attempt at least 1 practice question
- Average 3+ questions answered per active user
- Streak tracking works correctly (test: complete day 1, skip day 2, verify streak resets)

### Technical Tasks

- Implement daily unlock formula
- Build question practice UI
- Add streak calculation logic
- Store responses with timestamps
- Update unlock count after each answer

---

## Week 4: Dashboard & Preparedness Score

**Theme**: "Users see their progress and readiness"

### Deliverables

1. **Preparedness dashboard** showing:

- Domain accuracy % (4 domains)
- Overall preparedness score (0-100)
- Current streak
- Questions unlocked today
- Weakest domain highlight
- Recent performance chart (last 7 days)

2. **Preparedness formula**:

- 50% overall accuracy
- 30% recent accuracy (last 10 questions)
- 20% streak/7 (normalized)

3. **Domain performance visualization** (bar chart)

### Business Outcome

- Users see tangible progress (preparedness score = gamification)
- Weakest domain = focus area (drives engagement)
- Dashboard = daily return reason

### Verification (Non-Tech)

- **Demo**: Answer 10+ questions → view dashboard → see all metrics populated
- **Checklist**:
- [ ] Dashboard shows domain accuracy % for all 4 domains
- [ ] Preparedness score displays (0-100)
- [ ] Streak counter visible
- [ ] "X questions unlocked today" shown
- [ ] Weakest domain highlighted with visual indicator
- [ ] Recent performance chart shows last 7 days
- [ ] All numbers update after answering questions

### Success Metrics

- 70% of active users view dashboard at least once
- Preparedness score updates correctly (test with known inputs)
- Domain accuracy matches manual calculation

### Technical Tasks

- Calculate domain accuracy from responses
- Implement preparedness formula
- Build dashboard UI components
- Create performance chart (7-day rolling)
- Add weakest domain detection

---

## Week 5: Free vs Paid Plan Enforcement

**Theme**: "Free users hit limits, paid users get unlimited access"

### Deliverables

1. **Plan assignment** (free by default, paid via subscription)
2. **Free plan restrictions**:

- 2 questions/day limit
- No explanations (or limited)
- No dashboard access (or limited)
- No diagnostic (or make it free to drive upgrade)

3. **Paid plan features**:

- Unlimited questions
- Full explanations
- Full dashboard
- Reasoning score
- Daily unlock pacing
- Domain selection

4. **Upgrade prompts** when free users hit limits
5. **Subscription management** (Stripe integration or mock)

### Business Outcome

- Free users experience value but hit friction (conversion trigger)
- Paid users get full experience (retention)
- Foundation for monetization validation

### Verification (Non-Tech)

- **Demo**: 
- Free user: Answer 2 questions → see "Upgrade for more" message
- Paid user: Answer unlimited questions → see all features
- **Checklist**:
- [ ] Free users can answer max 2 questions/day
- [ ] After 2 questions, upgrade CTA appears
- [ ] Paid users can answer unlimited questions
- [ ] Free users see limited/no explanations
- [ ] Paid users see full explanations
- [ ] Free users see limited dashboard
- [ ] Paid users see full dashboard
- [ ] Plan status visible in settings

### Success Metrics

- 10% free → paid conversion rate (MVP goal)
- Free users hit 2-question limit correctly
- Paid users report no restrictions

### Technical Tasks

- Add plan_type to user profiles
- Implement question limit check (free: 2/day)
- Add feature gating (explanations, dashboard)
- Create upgrade flow UI
- Integrate Stripe (or mock subscription)

---

## Week 6: Reasoning Score & Anti-Leak Measures

**Theme**: "AI-powered feedback and content protection"

### Deliverables

1. **Reasoning score** (0-1) from Claude API:

- User provides optional reasoning text
- Claude evaluates reasoning quality
- Score displayed with feedback

2. **Anti-leak measures**:

- Visible watermark with user email
- Zero-width characters in question text (server-side)
- Question access logging

3. **Reasoning input UI** (optional text field after answer)
4. **Reasoning score display** (paid users only)

### Business Outcome

- AI feedback = premium value (differentiation)
- Anti-leak = content protection (business requirement)
- Reasoning score = engagement driver (users want to improve)

### Verification (Non-Tech)

- **Demo**: 
- Answer question → enter reasoning → see score (0-1)
- View question → see email watermark
- Check logs → see question access records
- **Checklist**:
- [ ] After answering, can optionally enter reasoning
- [ ] Reasoning score appears (0-1 scale)
- [ ] Questions display user email watermark
- [ ] Question text contains hidden characters (verify in source)
- [ ] Question accesses logged (check database/logs)
- [ ] Reasoning score only for paid users

### Success Metrics

- 30% of paid users provide reasoning
- Average reasoning score > 0.5 (indicates quality)
- Zero content leaks reported
- Claude API spend < $40/month (MVP goal)

### Technical Tasks

- Integrate Claude API for reasoning evaluation
- Add reasoning input field to question UI
- Implement watermarking (email in question display)
- Insert zero-width characters in question text
- Log question accesses
- Add reasoning score to responses table

---

## Weekly Milestone Template (For Future Weeks)

### Week X: [Theme]

**Deliverable**: [What ships]
**Business Outcome**: [Why it matters]
**Verification**:

- Demo: [Step-by-step demo script]
- Checklist: [Non-tech verifiable items]
**Success Metrics**: [Measurable indicators]
**Technical Tasks**: [Implementation items]

---

## Cross-Week Dependencies

- **Week 1** → Week 2: User profiles needed for diagnostic
- **Week 2** → Week 3: Diagnostic completion unlocks daily practice
- **Week 3** → Week 4: Responses needed for dashboard calculations
- **Week 4** → Week 5: Dashboard needed to show plan differences
- **Week 5** → Week 6: Paid plan needed for reasoning score access

---

## Success Criteria Summary (MVP Goals)

By end of Week 6:

- ✅ 25% diagnostic completion rate
- ✅ 10% free → paid conversion
- ✅ 50% return next-day usage (paid users)
- ✅ Claude spend < $40/month
- ✅ All core features functional
- ✅ Zero critical bugs
- ✅ Content protection active

---

## Non-Technical Verification Guide

### How to Verify Each Milestone

1. **User Journey Test**: Complete full user flow as new user
2. **Database Check**: Query database to verify data storage
3. **UI Inspection**: Verify all UI elements render correctly
4. **Feature Test**: Test each feature in isolation
5. **Edge Case Test**: Test boundary conditions (exam date in past, etc.)

### Tools for Non-Tech Verification

- **Postman/Insomnia**: Test API endpoints
- **Database Admin Panel**: Query user data
- **Browser DevTools**: Inspect network requests
- **Stripe Dashboard**: Verify subscriptions
- **Sentry/Logs**: Check error rates

---

## Risk Mitigation

- **Week 1 Risk**: Clerk integration issues → Have backup auth plan
- **Week 2 Risk**: Diagnostic questions not balanced → Pre-validate question distribution
- **Week 3 Risk**: Unlock formula too complex → Simplify and test edge cases
- **Week 4 Risk**: Preparedness formula unclear → Add tooltips/explanations
- **Week 5 Risk**: Stripe integration delays → Use mock subscriptions initially
- **Week 6 Risk**: Claude API costs spike → Add rate limiting and caching

### To-dos

- [ ] Week 1: Implement user onboarding flow with exam date, study time, and goal score capture
- [ ] Week 2: Build 10-question diagnostic test with domain-balanced questions and results page
- [ ] Week 3: Implement daily unlock system with streak tracking and question practice flow
- [ ] Week 4: Create preparedness dashboard with domain accuracy, preparedness score, and performance charts
- [ ] Week 5: Implement free vs paid plan enforcement with feature gating and upgrade prompts
- [ ] Week 6: Add Claude reasoning score evaluation and anti-leak measures (watermark, logging)