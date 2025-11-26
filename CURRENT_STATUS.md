# Certverse - Current Project Status

**Last Updated:** 2025-01-26
**Current Week:** End of Week 2 (transitioning to Week 3)

---

## Where You Are Now

### ✅ Completed (Week 1 & 2)

You've successfully completed the foundation of your MVP:

#### Week 1: "I can practice questions" ✅
- **Backend:**
  - ✅ `GET /api/question?userId=xxx` - Returns random unanswered question
  - ✅ `POST /api/submit` - Submits answer and validates correctness
  - ✅ Questions table seeded with 20 CISA questions (across 5 domains)
  - ✅ Responses table storing user answers
  - ✅ Rate limiting, error handling, Sentry integration

- **Frontend:**
  - ✅ `/question` page with QuestionCard component
  - ✅ Shows question with 4 multiple choice options
  - ✅ Submit functionality with immediate correct/incorrect feedback
  - ✅ "Next Question" button to load new question
  - ✅ Clerk authentication working

- **Database:**
  - ✅ `questions` table (id, domain, q_text, choice_a/b/c/d, answer, explanation)
  - ✅ `responses` table (id, user_id, question_id, selected_choice, correct, created_at)

#### Week 2: "I can track my stats" ✅
- **Backend:**
  - ✅ `GET /api/stats?userId=xxx` - Returns totalAnswered, totalCorrect, accuracy
  - ✅ `GET /api/history?userId=xxx&limit=10` - Returns recent responses
  - ✅ Accuracy calculation working

- **Frontend:**
  - ✅ `/dashboard` page with comprehensive stats display
  - ✅ Stats cards showing: Questions Answered, Accuracy Rate, Correct Answers
  - ✅ Domain performance bar chart (mock data)
  - ✅ Recent activity feed (last 5 questions)
  - ✅ Overall progress bar with readiness percentage

#### Infrastructure ✅
- ✅ Backend deployed on Railway
- ✅ Frontend deployed on Vercel
- ✅ Sentry setup (ready for DSN)
- ✅ Winston logging with daily rotation
- ✅ Rate limiting (100 req/15min general, 30/min questions, 20/min submit)
- ✅ Helmet security headers
- ✅ CORS configured
- ✅ Error handling middleware

---

## 🎯 What's Next: Week 3 - Daily Unlock Limits

You're ready to start **Week 3: "I can only practice X questions per day"**

This is a **critical week** because it validates your core engagement mechanic:
- Daily unlock limits create urgency
- Streak tracking builds habit
- Prepares foundation for free vs paid tiers

---

## Week 3 Requirements

### Goal
Users can only answer **5 questions per day**. After completing 5, they see "Come back tomorrow!" with a countdown timer. Streak counter tracks consecutive days.

### What Needs to Be Built

#### 1. Database Schema Updates (2 hours)

Create a new `user_stats` table to track per-user metrics:

```sql
CREATE TABLE user_stats (
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

-- Add index for fast lookups
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);

-- Add RLS policies (for now, keep simple)
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own stats"
ON user_stats FOR SELECT
USING (true);

CREATE POLICY "Users can insert own stats"
ON user_stats FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own stats"
ON user_stats FOR UPDATE
USING (true);
```

**Tasks:**
- [ ] Create migration file or run SQL directly in Supabase dashboard
- [ ] Test that user_stats table exists
- [ ] Seed initial row for your test user

---

#### 2. Backend: Unlock Service (3 hours)

Create `backend/src/services/unlockService.ts`:

```typescript
import { supabase } from '../lib/supabase';

export interface UserStats {
  user_id: string;
  total_questions_attempted: number;
  correct_answers: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  questions_unlocked_today: number;
  last_unlock_reset: string;
}

/**
 * Get or create user stats
 */
export async function getUserStatsRecord(userId: string): Promise<UserStats> {
  // Try to get existing stats
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user stats:', error);
    throw new Error('Failed to fetch user stats');
  }

  // If stats exist, return them
  if (data) {
    return data;
  }

  // Create new stats record
  const { data: newStats, error: createError } = await supabase
    .from('user_stats')
    .insert({
      user_id: userId,
      total_questions_attempted: 0,
      correct_answers: 0,
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
      questions_unlocked_today: 5,
      last_unlock_reset: new Date().toISOString()
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating user stats:', createError);
    throw new Error('Failed to create user stats');
  }

  return newStats;
}

/**
 * Check if unlock needs to be reset (daily reset at midnight UTC)
 */
function shouldResetUnlock(lastReset: string): boolean {
  const lastResetDate = new Date(lastReset);
  const now = new Date();

  // Reset if last reset was on a different UTC day
  return lastResetDate.getUTCDate() !== now.getUTCDate() ||
         lastResetDate.getUTCMonth() !== now.getUTCMonth() ||
         lastResetDate.getUTCFullYear() !== now.getUTCFullYear();
}

/**
 * Calculate daily unlock count (simple version for Week 3)
 */
function calculateDailyUnlock(userId: string): number {
  // For Week 3, always return 5
  // In Week 5, we'll make this dynamic based on exam date
  return 5;
}

/**
 * Get remaining questions for today
 */
export async function getRemainingQuestions(userId: string): Promise<{
  remaining: number;
  total: number;
  resetsAt: string;
}> {
  const stats = await getUserStatsRecord(userId);

  // Check if we need to reset daily unlock
  if (shouldResetUnlock(stats.last_unlock_reset)) {
    const dailyUnlock = calculateDailyUnlock(userId);

    // Reset unlock count
    const { error } = await supabase
      .from('user_stats')
      .update({
        questions_unlocked_today: dailyUnlock,
        last_unlock_reset: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error resetting unlock:', error);
    }

    // Return fresh count
    return {
      remaining: dailyUnlock,
      total: dailyUnlock,
      resetsAt: getNextResetTime()
    };
  }

  // Calculate how many answered today
  const { count, error } = await supabase
    .from('responses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', getTodayStartUTC());

  if (error) {
    console.error('Error counting today responses:', error);
  }

  const answeredToday = count || 0;
  const remaining = Math.max(0, stats.questions_unlocked_today - answeredToday);

  return {
    remaining,
    total: stats.questions_unlocked_today,
    resetsAt: getNextResetTime()
  };
}

/**
 * Update stats after answering a question
 */
export async function updateStatsAfterAnswer(
  userId: string,
  isCorrect: boolean
): Promise<void> {
  const stats = await getUserStatsRecord(userId);
  const today = new Date().toISOString().split('T')[0];
  const lastActivityDate = stats.last_activity_date;

  // Calculate streak
  let newStreak = stats.current_streak;
  if (!lastActivityDate) {
    // First activity ever
    newStreak = 1;
  } else {
    const daysDiff = daysBetween(lastActivityDate, today);
    if (daysDiff === 1) {
      // Consecutive day
      newStreak = stats.current_streak + 1;
    } else if (daysDiff === 0) {
      // Same day, keep streak
      newStreak = stats.current_streak || 1;
    } else {
      // Missed days, reset streak
      newStreak = 1;
    }
  }

  // Update stats
  await supabase
    .from('user_stats')
    .update({
      total_questions_attempted: stats.total_questions_attempted + 1,
      correct_answers: stats.correct_answers + (isCorrect ? 1 : 0),
      current_streak: newStreak,
      longest_streak: Math.max(stats.longest_streak, newStreak),
      last_activity_date: today,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
}

// Helper functions
function getTodayStartUTC(): string {
  const now = new Date();
  const todayStart = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0, 0, 0, 0
  ));
  return todayStart.toISOString();
}

function getNextResetTime(): string {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return tomorrow.toISOString();
}

function daysBetween(date1Str: string, date2Str: string): number {
  const d1 = new Date(date1Str);
  const d2 = new Date(date2Str);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
```

**Add to `backend/src/index.ts`:**

```typescript
import { getRemainingQuestions, updateStatsAfterAnswer } from './services/unlockService';

// Add new endpoint
app.get('/api/unlock/remaining', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }

  const unlock = await getRemainingQuestions(userId);
  res.json(unlock);
}));
```

**Update submit endpoint to update stats:**

```typescript
// In submit-answer.ts, after saving response:
import { updateStatsAfterAnswer } from '../services/unlockService';

// After successful save:
await updateStatsAfterAnswer(userId, isCorrect);
```

**Tasks:**
- [ ] Create `unlockService.ts` file
- [ ] Add `/api/unlock/remaining` endpoint
- [ ] Update submit logic to call `updateStatsAfterAnswer`
- [ ] Test with Postman/curl

---

#### 3. Frontend: Question Counter (3 hours)

Update `/question` page to show remaining questions:

```typescript
// In app/(dashboard)/question/page.tsx

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

export default function QuestionPage() {
  const { user } = useUser();
  const [remaining, setRemaining] = useState<number | null>(null);
  const [total, setTotal] = useState(5);
  const [resetsAt, setResetsAt] = useState<string>('');

  // Fetch remaining questions
  const fetchRemaining = async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/unlock/remaining?userId=${user.id}`
      );
      const data = await res.json();
      setRemaining(data.remaining);
      setTotal(data.total);
      setResetsAt(data.resetsAt);
    } catch (err) {
      console.error('Failed to fetch remaining:', err);
    }
  };

  useEffect(() => {
    fetchRemaining();
  }, [user?.id]);

  const handleSubmit = async (choice: "A" | "B" | "C" | "D") => {
    // ... existing submit logic ...

    // After submit, refresh remaining count
    await fetchRemaining();

    return result;
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        {/* Add counter at top */}
        {remaining !== null && (
          <div className="mb-6 flex justify-center">
            <Badge variant={remaining > 0 ? "default" : "secondary"} className="text-lg px-4 py-2">
              Questions today: {total - remaining} / {total}
            </Badge>
          </div>
        )}

        {/* Show limit reached message */}
        {remaining === 0 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Great work today! 🎉</CardTitle>
              <CardDescription>You've completed all {total} questions for today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Come back in:</p>
              <TimeUntilReset resetsAt={resetsAt} />
              <Button asChild className="w-full">
                <Link href="/dashboard">View Your Progress</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Only show question if remaining > 0 */}
        {remaining > 0 && !isLoading && !error && question && (
          <QuestionCard
            question={question}
            onSubmit={handleSubmit}
            onNext={handleNext}
          />
        )}
      </main>
    </div>
  );
}

// Countdown component
function TimeUntilReset({ resetsAt }: { resetsAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const reset = new Date(resetsAt).getTime();
      const diff = reset - now;

      if (diff <= 0) {
        setTimeLeft('Ready now!');
        window.location.reload(); // Refresh page when reset
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [resetsAt]);

  return <div className="text-2xl font-bold">{timeLeft}</div>;
}
```

**Tasks:**
- [ ] Add remaining counter to question page
- [ ] Show "limit reached" message when remaining === 0
- [ ] Add countdown timer for next reset
- [ ] Test flow: answer 5 questions → see limit message

---

#### 4. Frontend: Streak Display (2 hours)

Update dashboard to show streak:

```typescript
// In app/(dashboard)/dashboard/page.tsx

// Update stats cards to include streak
const statsCards = [
  // ... existing cards ...
  {
    title: "Current Streak",
    value: stats?.current_streak ? `${stats.current_streak} days` : "0 days",
    icon: stats?.current_streak >= 3 ? Flame : Clock, // 🔥 icon if streak >= 3
    color: stats?.current_streak >= 3 ? "text-orange-600" : "text-gray-600",
    bgColor: stats?.current_streak >= 3 ? "bg-orange-100" : "bg-gray-100",
  }
];
```

**Tasks:**
- [ ] Add streak to stats API response
- [ ] Display streak counter on dashboard
- [ ] Show 🔥 emoji if streak >= 3 days
- [ ] Test: Answer questions 2 days in a row to verify streak increments

---

## Testing Checklist for Week 3

Once you build the above features, test these scenarios:

### Scenario 1: Daily Limit Enforcement
- [ ] Sign in as new user
- [ ] Answer 5 questions
- [ ] See "Questions today: 5/5"
- [ ] Try to get next question → Should show "Come back tomorrow"
- [ ] Verify countdown timer shows correct time

### Scenario 2: Daily Reset
- [ ] Answer 3 questions today (remaining: 2/5)
- [ ] Manually update `last_unlock_reset` in database to yesterday
- [ ] Refresh page → Should show 5/5 available again

### Scenario 3: Streak Tracking
- [ ] Answer at least 1 question today
- [ ] Check dashboard → streak should be 1
- [ ] Tomorrow, answer 1 question → streak should be 2
- [ ] Skip a day → streak resets to 1

### Scenario 4: Backend API
- [ ] `GET /api/unlock/remaining?userId=xxx` returns correct data
- [ ] After submitting answer, `user_stats` updates correctly
- [ ] Streak calculation works for consecutive days

---

## Current Gaps (Not Needed for Week 3)

These are for future weeks:

- ❌ **Onboarding flow** (Week 5)
- ❌ **Diagnostic test** (Week 5)
- ❌ **Free vs Paid plans** (Week 4)
- ❌ **Stripe integration** (Week 4)
- ❌ **Preparedness score** (Week 6)
- ❌ **Domain-specific stats** (Week 2 - mock data, need real calculation)
- ❌ **Clerk JWT verification on backend** (Security hardening - Week 5)
- ❌ **Input validation with Zod** (Security hardening - Week 5)

---

## Quick Wins Available Now

Before diving into Week 3, you could knock out these quick improvements:

1. **Seed more questions** (30 min)
   - You only have 20 questions. Add 30-50 more for better testing.
   - Use Claude to generate questions if needed.

2. **Fix domain stats on dashboard** (1 hour)
   - Currently showing mock data
   - Calculate real domain accuracy from `responses` table

3. **Add Sentry DSN** (10 min)
   - Create Sentry account
   - Add DSN to Railway/Vercel env vars

4. **Mobile responsive check** (30 min)
   - Test app on mobile
   - Fix any layout issues

---

## Recommended Approach for Week 3

**Day 1-2: Backend** (5 hours)
1. Create user_stats table
2. Build unlockService.ts
3. Add /api/unlock/remaining endpoint
4. Update submit to track stats
5. Test all endpoints with Postman

**Day 3-4: Frontend** (5 hours)
1. Add remaining counter to question page
2. Build limit reached UI
3. Add countdown timer
4. Update dashboard with streak
5. Test full flow

**Day 5: Testing & Polish** (2 hours)
1. Run through all test scenarios
2. Fix any bugs
3. Deploy to production
4. Record demo video

**Total: ~12 hours** spread over 5 days = 2-3 hours per day

---

## Summary

**You're in great shape!** You've completed Weeks 1 & 2 successfully. Your foundation is solid:
- ✅ Question practice working
- ✅ Stats tracking working
- ✅ Good infrastructure (monitoring, security, deployment)

**This week (Week 3):**
Focus on building the daily unlock mechanic. This is the **most important feature** for validating engagement and setting up free/paid tiers.

**Priority order:**
1. Database schema (1 hr)
2. Backend unlock service (3 hrs)
3. Frontend question counter (3 hrs)
4. Frontend streak display (2 hrs)
5. Testing (2 hrs)

By end of week, you'll have a working app that:
- Limits users to 5 questions/day
- Tracks streaks
- Shows countdown to reset
- Feels like a real habit-forming product

Ready to start? Let me know if you want me to help implement any of these pieces!
