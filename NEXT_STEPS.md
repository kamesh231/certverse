# Certverse MVP - Development Roadmap

## Product Mission
Build a focused, adaptive CISA practice app to **validate core engagement and willingness to pay** before scaling.

**Target:** 500 questions, daily unlock limits, diagnostic test, and preparedness dashboard.

---

## MVP Success Criteria

Track these metrics to validate the concept:

- **25%** diagnostic test completion rate
- **10%** free → paid conversion rate
- **50%** next-day return rate (paid users)
- **<$40/month** Claude API costs in early stage

---

## Feature Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1-2)

#### 1.1 Database Schema Updates

**Priority: Critical**

Update database to support MVP features:

```sql
-- Add user preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  exam_date DATE,
  daily_study_time INTEGER, -- 10, 20, 30, or 60 minutes
  goal_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add diagnostic results table
CREATE TABLE diagnostic_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  question_id UUID REFERENCES questions(id),
  selected_choice TEXT,
  is_correct BOOLEAN,
  user_reasoning TEXT,
  reasoning_score DECIMAL(3,2), -- 0.00 to 1.00
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add user stats table
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  total_questions_attempted INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  diagnostic_completed BOOLEAN DEFAULT FALSE,
  domain_1_correct INTEGER DEFAULT 0,
  domain_1_total INTEGER DEFAULT 0,
  domain_2_correct INTEGER DEFAULT 0,
  domain_2_total INTEGER DEFAULT 0,
  domain_3_correct INTEGER DEFAULT 0,
  domain_3_total INTEGER DEFAULT 0,
  domain_4_correct INTEGER DEFAULT 0,
  domain_4_total INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add subscription tracking
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  plan_type TEXT NOT NULL, -- 'free' or 'paid'
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Add anti-leak tracking
CREATE TABLE question_accesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  question_id UUID REFERENCES questions(id),
  ip_address TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update questions table
ALTER TABLE questions
  ADD COLUMN watermark_seed TEXT,
  ADD COLUMN is_diagnostic BOOLEAN DEFAULT FALSE;
```

**Tasks:**
- [ ] Create migration files for new tables
- [ ] Add RLS policies for all tables
- [ ] Seed 10 diagnostic questions (balanced across 4 domains)
- [ ] Test data integrity

---

#### 1.2 Onboarding Flow

**Priority: Critical**

Build the user onboarding experience:

**Frontend:**
- [ ] Create `/onboarding` page
- [ ] Multi-step form:
  - Step 1: Exam date picker
  - Step 2: Daily study time selector (10/20/30/60 mins)
  - Step 3: Optional goal score
- [ ] Store preferences in database
- [ ] Redirect to diagnostic CTA after completion

**Backend:**
- [ ] `POST /api/onboarding` - Save user preferences
- [ ] Validation: exam_date must be future, study_time in [10,20,30,60]

---

#### 1.3 Diagnostic Test (10 Questions)

**Priority: Critical**

**Frontend:**
- [ ] Create `/diagnostic` page
- [ ] Question flow UI (1 question at a time)
- [ ] Optional reasoning input field
- [ ] Show progress (1/10, 2/10, etc.)
- [ ] Results page showing:
  - Domain accuracy breakdown
  - Weakest domain highlighted
  - "Start your daily practice" CTA

**Backend:**
- [ ] `GET /api/diagnostic/questions` - Return 10 balanced questions
- [ ] `POST /api/diagnostic/submit` - Store results
- [ ] `POST /api/diagnostic/analyze` - Claude reasoning score
  - Use basic Claude prompt: "Rate this reasoning 0-1"
  - Store reasoning_score in diagnostic_results
- [ ] Mark diagnostic_completed in user_stats

**Claude Integration:**
- [ ] Create reasoning prompt template
- [ ] Implement caching to reduce costs
- [ ] Add timeout/fallback if Claude is slow

---

### Phase 2: Daily Practice Engine (Week 3)

#### 2.1 Daily Unlock Logic

**Priority: Critical**

Implement the daily question unlock algorithm:

```typescript
// backend/src/services/unlockService.ts
function calculateDailyUnlock(userId: string): number {
  const stats = getUserStats(userId);
  const prefs = getUserPreferences(userId);

  const totalQuestions = 500; // or query from DB
  const attempted = stats.total_questions_attempted;
  const remaining = totalQuestions - attempted;

  const daysLeft = Math.max(1,
    Math.floor((prefs.exam_date - new Date()) / (1000*60*60*24))
  );

  const base = Math.max(3, Math.min(20,
    Math.ceil(remaining / daysLeft)
  ));

  const streakPenalty = Math.max(0, 3 - stats.current_streak);
  const unlockedToday = Math.max(1, base - streakPenalty);

  return unlockedToday;
}
```

**Tasks:**
- [ ] Implement unlock calculation service
- [ ] Add endpoint `GET /api/unlock/count` - Return unlocked count
- [ ] Track daily unlock resets (midnight UTC)
- [ ] Update user_stats with unlock data

---

#### 2.2 Question Practice Flow

**Priority: Critical**

**Frontend:**
- [ ] Create `/practice` page
- [ ] Display unlocked question count
- [ ] Question UI:
  - Show question text with watermark (user email in bottom-right)
  - 4 multiple choice buttons
  - Submit button
- [ ] After submit:
  - Show correct/incorrect
  - Show explanation (paid only)
  - Show domain stats update
  - "Next question" button
- [ ] Disable questions when daily limit reached

**Backend:**
- [ ] `GET /api/practice/next` - Return next random question (not attempted today)
- [ ] `POST /api/practice/submit` - Record answer, update stats
- [ ] Apply watermark to question text:
  ```typescript
  function watermarkQuestion(text: string, email: string): string {
    return text + '\n\n' + '​'.repeat(10) + email; // zero-width chars + email
  }
  ```
- [ ] Update streak logic:
  - Increment streak if user completes daily unlock
  - Reset to 0 if user misses a day

---

#### 2.3 Dashboard

**Priority: High**

**Frontend:**
- [ ] Create `/dashboard` page
- [ ] Display metrics:
  - Domain accuracy % (4 domains)
  - Preparedness score (0-100)
  - Current streak (with fire emoji if >3)
  - Questions unlocked today
  - Weakest domain
  - Recent performance chart (last 7 days)

**Backend:**
- [ ] `GET /api/dashboard/stats` - Return all dashboard data
- [ ] Implement preparedness formula:
  ```typescript
  function calculatePreparedness(stats: UserStats): number {
    const overallAccuracy = stats.correct_answers / stats.total_questions_attempted;
    const recentAccuracy = getRecentAccuracy(stats.user_id, 20); // last 20 Qs
    const streakFactor = Math.min(stats.current_streak / 7, 1);

    const score = (0.5 * overallAccuracy) +
                  (0.3 * recentAccuracy) +
                  (0.2 * streakFactor);

    return Math.round(Math.max(0, Math.min(100, score * 100)));
  }
  ```
- [ ] Cache dashboard data (Redis or in-memory) to reduce DB load

---

### Phase 3: Monetization (Week 4)

#### 3.1 Free vs Paid Plans

**Free Plan Limits:**
- 2 questions/day (hardcoded)
- No explanations shown
- No domain selection
- No dashboard access
- No diagnostic (or keep diagnostic free to push upgrade)

**Paid Plan ($19-39/mo):**
- Unlimited questions
- Full explanations
- Dashboard + domain insights
- Reasoning scores
- Daily unlock pacing
- Future Coach/Mentor visibility (coming soon)

**Tasks:**
- [ ] Add plan enforcement middleware
- [ ] Update frontend to hide/show features based on plan
- [ ] Create upgrade CTA banners in free tier

---

#### 3.2 Stripe Integration

**Priority: High**

**Setup:**
- [ ] Create Stripe account
- [ ] Create product: "Certverse Premium - $29/mo"
- [ ] Get API keys (test + live)
- [ ] Add to environment variables:
  ```
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
  ```

**Backend:**
- [ ] `POST /api/stripe/create-checkout` - Create Stripe checkout session
- [ ] `POST /api/stripe/webhook` - Handle subscription events:
  - `checkout.session.completed` → Activate subscription
  - `customer.subscription.updated` → Update status
  - `customer.subscription.deleted` → Downgrade to free
- [ ] Update subscriptions table on events

**Frontend:**
- [ ] Create `/pricing` page
- [ ] Implement checkout redirect
- [ ] Handle success/cancel redirects
- [ ] Show subscription status in settings

---

#### 3.3 "Coach" & "Mentor" Placeholders

**Priority: Low**

Display these features as "Coming Soon" - NO implementation required.

**Frontend:**
- [ ] Add "Coach" card on pricing page:
  ```
  Coach Plan - $39/mo (Coming Soon)
  - AI Reasoning Tutor
  - Adaptive domain correction
  - Socratic Q&A
  - Personalized study plan
  ```
- [ ] Add "Mentor" section:
  ```
  Human Coaching (Coming Soon)
  - 1 free 30-min call with Coach plan
  - Additional sessions at subsidized rates
  - Expert CISA instructors
  ```
- [ ] Add visual badges/tags: "Launching Q2 2025"

**Purpose:** Satisfy mentor agreement + increase perceived value without building features yet.

---

### Phase 4: Anti-Leak Measures (Week 4)

#### 4.1 Lightweight Protection

**Priority: Medium**

**Tasks:**
- [ ] Visual watermark: Add user email in light gray to bottom-right of question text (CSS)
- [ ] Zero-width characters: Insert user_id encoded in zero-width Unicode into question text
  ```typescript
  function encodeWatermark(text: string, userId: string): string {
    const zwc = userId.split('').map(c =>
      String.fromCharCode(0x200B + c.charCodeAt(0) % 4)
    ).join('');
    return text.slice(0, 50) + zwc + text.slice(50);
  }
  ```
- [ ] Log all question accesses in question_accesses table
- [ ] No image rendering or steganography (out of scope)

---

### Phase 5: Security Hardening (Week 5)

**Priority: Critical - Before Launch**

#### 5.1 Re-enable Row-Level Security

```sql
-- responses table
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own responses"
ON responses FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Users can read own responses"
ON responses FOR SELECT
TO authenticated, anon
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Repeat for all tables
```

**Tasks:**
- [ ] Enable RLS on all tables
- [ ] Test with Clerk JWT claims
- [ ] Verify users can't access other users' data

---

#### 5.2 Clerk JWT Verification

**Priority: Critical**

**Backend:**
```typescript
// backend/src/middleware/auth.ts
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

export const requireAuth = ClerkExpressRequireAuth({
  onError: (error) => {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
});

// Apply to protected routes
app.get('/api/practice/next', requireAuth, asyncHandler(...));
app.post('/api/practice/submit', requireAuth, asyncHandler(...));
```

**Tasks:**
- [ ] Install @clerk/clerk-sdk-node
- [ ] Add CLERK_SECRET_KEY to Railway env vars
- [ ] Apply requireAuth to all protected endpoints
- [ ] Test with invalid/expired tokens

---

#### 5.3 Input Validation

**Priority: High**

```bash
npm install zod
```

```typescript
// Example validation schema
import { z } from 'zod';

const submitAnswerSchema = z.object({
  question_id: z.string().uuid(),
  selected_choice: z.enum(['A', 'B', 'C', 'D']),
  user_reasoning: z.string().max(500).optional()
});

// In route handler
const validated = submitAnswerSchema.parse(req.body);
```

**Tasks:**
- [ ] Add validation schemas for all endpoints
- [ ] Return 400 with clear error messages on invalid input
- [ ] Prevent SQL injection, XSS attacks

---

## Content Sourcing (Parallel Track)

### Question Database Requirements

**Minimum:** 500 questions across 4 CISA domains
**Recommended:** 1000+ questions

**Quality checklist per question:**
- [ ] Clear question text (no ambiguity)
- [ ] 4 multiple choice options (A, B, C, D)
- [ ] Correct answer marked
- [ ] Detailed explanation (2-4 sentences)
- [ ] Domain tagged (1-4)
- [ ] Difficulty level (easy/medium/hard)

### Sourcing Options

**Option 1: Purchase Question Bank**
- Pros: Fast, professional, legally cleared
- Cons: Expensive ($500-$2000)
- Timeline: 1-2 weeks

**Option 2: Create Your Own**
- Pros: Free, full control
- Cons: Time-intensive (80-100 hours for 500 questions)
- Timeline: 4-6 weeks

**Option 3: Partner with CISA Instructors**
- Pros: Quality + credibility
- Cons: Revenue sharing, need to find partners
- Timeline: 2-4 weeks

### Seeding Format

```sql
INSERT INTO questions (
  question,
  choice_a,
  choice_b,
  choice_c,
  choice_d,
  correct_answer,
  explanation,
  domain,
  difficulty,
  is_diagnostic
)
VALUES
('What is the PRIMARY role of an IS auditor?',
 'Implement security controls',
 'Provide independent assurance',
 'Configure firewalls',
 'Train employees',
 'B',
 'An IS auditor primarily provides independent assurance on IT controls and processes, rather than implementing controls themselves.',
 1,
 'medium',
 false);
```

---

## Monitoring & DevOps Setup

### Immediate Setup (1-2 hours)

#### 1. Create Sentry Account
1. Go to https://sentry.io/
2. Create 2 projects:
   - Backend (Node.js)
   - Frontend (Next.js)
3. Copy DSNs

#### 2. Add Environment Variables

**Railway (Backend):**
```
SENTRY_DSN=https://...@sentry.io/...
NODE_ENV=production
LOG_LEVEL=info
CLERK_SECRET_KEY=sk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Vercel (Frontend):**
```
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

#### 3. Uptime Monitoring

Use UptimeRobot (free):
- Monitor frontend: https://certverse.vercel.app/
- Monitor backend: https://certverse-production.up.railway.app/health
- Alert email on downtime

---

## MVP Launch Checklist

### Pre-Launch (Week 6)

**Testing:**
- [ ] QA test all user flows (onboarding → diagnostic → practice → upgrade)
- [ ] Test free plan limits (2 Q/day enforcement)
- [ ] Test paid plan features (unlimited, explanations)
- [ ] Load test (simulate 100 concurrent users)
- [ ] Security audit (XSS, SQL injection, auth bypass attempts)

**Content:**
- [ ] 500+ questions seeded
- [ ] 10 diagnostic questions validated
- [ ] All explanations reviewed for quality

**Legal:**
- [ ] Privacy Policy page
- [ ] Terms of Service page
- [ ] Cookie consent banner (if tracking EU users)

**Beta Testing:**
- [ ] Invite 10-20 beta users
- [ ] Collect feedback on UX
- [ ] Monitor error rates in Sentry
- [ ] Fix critical bugs

### Launch Day

**Pre-Flight:**
- [ ] Verify all env vars in production
- [ ] Test Stripe checkout in production mode
- [ ] Enable uptime monitoring alerts
- [ ] Set up daily Sentry digest emails

**Go Live:**
- [ ] Announce on LinkedIn/Twitter
- [ ] Product Hunt launch (optional)
- [ ] Share in CISA study groups/forums
- [ ] Monitor dashboard hourly for first 24h

---

## Success Metrics Tracking

### Daily Monitoring (First 2 Weeks)

Track in spreadsheet or analytics dashboard:

**Engagement:**
- Sign-ups today
- Diagnostic completions
- Questions answered today
- Active users (DAU)

**Conversion:**
- Free users
- Paid conversions
- Conversion rate %

**Technical:**
- Error count (Sentry)
- API response time (p95)
- Uptime %

**Claude Costs:**
- API calls today
- Total spend
- Cost per user

### Weekly Review (Weeks 3-8)

**Validate MVP Goals:**
- ✅ 25% diagnostic completion? (target: 25%)
- ✅ 10% free→paid conversion? (target: 10%)
- ✅ 50% next-day return (paid)? (target: 50%)
- ✅ Claude spend <$40/mo? (target: <$40)

**Iterate based on data:**
- If diagnostic completion <25%: Simplify onboarding
- If conversion <10%: Improve free→paid CTAs
- If retention <50%: Improve daily unlock algorithm
- If costs >$40: Reduce Claude calls, add caching

---

## Out of Scope (Do NOT Build Yet)

Explicitly excluded until Phase 2:

- ❌ Multi-turn AI tutor (full reasoning coach)
- ❌ Adaptive difficulty engine
- ❌ RAG pipelines for study materials
- ❌ Mentor scheduling system
- ❌ Mock exams / timed tests
- ❌ Flashcards
- ❌ User-uploaded study materials
- ❌ Leaderboards
- ❌ Notes / bookmarking
- ❌ Advanced anti-leak (image steganography)

**Rule:** If it's not in the locked feature scope above, don't build it.

---

## Development Timeline

### Week 1-2: Infrastructure
- Database schema
- Onboarding flow
- Diagnostic test

### Week 3: Daily Practice
- Unlock algorithm
- Question practice flow
- Streak tracking

### Week 4: Monetization
- Stripe integration
- Plan enforcement
- Upgrade CTAs

### Week 5: Polish & Security
- RLS policies
- Clerk JWT verification
- Input validation
- Anti-leak measures

### Week 6: Launch Prep
- Beta testing
- Legal pages
- Marketing materials
- Production testing

### Week 7: Soft Launch
- Beta user launch
- Monitor metrics
- Fix critical bugs

### Week 8: Public Launch
- Product Hunt
- Social media
- CISA communities
- Scale monitoring

---

## Quick Wins (Next 24 Hours)

Get immediate value:

- [ ] Set up Sentry (15 min)
- [ ] Add Sentry DSNs to Railway/Vercel (10 min)
- [ ] Enable Vercel Analytics (2 min)
- [ ] Set up UptimeRobot (10 min)
- [ ] Create database migration plan (30 min)
- [ ] Research question sourcing options (30 min)

**Total: ~2 hours**

---

## Getting Help

**Documentation:**
- `MONITORING_SETUP.md` - Sentry & logging setup
- `PRODUCTION_READINESS.md` - Infrastructure checklist
- This file - Feature roadmap

**Community:**
- Next.js Discord
- Clerk Community
- Stripe Discord

---

## Current Status

✅ **Completed:**
- Backend monitoring (Sentry, Winston, rate limiting)
- Frontend skeleton
- Database schema (basic)
- Clerk authentication
- Railway + Vercel deployment

⏳ **In Progress:**
- Question database sourcing

🎯 **Next Priority:**
- Database schema updates
- Onboarding flow
- Diagnostic test

---

**Last Updated:** 2025-01-25
**MVP Target Launch:** Week 8 (End of February 2025)
