# Onboarding System - Deployment & Testing Guide

## Overview
The confidence-based onboarding system has been implemented with all backend and frontend code ready. This guide walks you through deploying and testing the complete flow.

## 🗄️ Database Migration

### Step 1: Run Migrations in Supabase

Go to your Supabase project dashboard → SQL Editor and run these two migrations in order:

#### Migration 1: `005_add_onboarding.sql`
```sql
-- Copy and paste the entire contents of:
-- backend/migrations/005_add_onboarding.sql
```

#### Migration 2: `006_simplify_onboarding_confidence.sql`
```sql
-- Copy and paste the entire contents of:
-- backend/migrations/006_simplify_onboarding_confidence.sql
```

### Step 2: Verify Tables Created

Run this in Supabase SQL Editor to verify:
```sql
-- Check user_onboarding table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_onboarding';

-- Check topic_confidence table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'topic_confidence';
```

You should see:
- **user_onboarding**: user_id, goal, certification, experience_level, study_time_per_week, exam_date, current_step, onboarding_completed, confidence_ratings, preferences, tips_shown, created_at, updated_at
- **topic_confidence**: user_id, topic, category, confidence_level, updated_at

## 🚀 Backend Deployment

### Deploy to Railway

The backend is already configured with onboarding routes (see `backend/src/index.ts:273-284`):

```bash
cd backend
git add .
git commit -m "Deploy onboarding backend"
git push

# Railway will auto-deploy
```

### Verify Backend Endpoints

Test these endpoints after deployment:

```bash
# Check onboarding status
curl "https://your-railway-url.com/api/onboarding/status?userId=test_user_123"

# Start onboarding
curl -X POST https://your-railway-url.com/api/onboarding/start \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user_123"}'
```

## 🎨 Frontend Deployment

### Build and Deploy

```bash
cd frontend
npm run build

# If using Vercel
vercel --prod

# Or your preferred hosting platform
```

### Environment Variables Required

Ensure these are set in your frontend deployment:

```bash
NEXT_PUBLIC_BACKEND_URL=https://your-railway-backend.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## 🧪 Testing the Complete Onboarding Flow

### Test as a New User

1. **Sign up as a new user** (use a fresh email/account)
   - After sign-up with Clerk, user should be redirected to `/onboarding`

2. **Step 1: Welcome**
   - Should see welcome screen with 4 benefits
   - Click "Get Started →"

3. **Step 2: Goal Selection**
   - Select a certification (e.g., CISA)
   - Select experience level (Beginner/Intermediate/Advanced)
   - Set study hours per week (1-20)
   - Optionally set exam date
   - Click "Continue →"

4. **Step 3: Confidence Rating**
   - For CISA, should see 5 topics:
     - Governance & Management of IT (21% weight)
     - IT Risk Management (19% weight)
     - Information Security (26% weight)
     - IT Operations & Support (18% weight)
     - Compliance & Audit Process (16% weight)
   - Rate each topic 1-10
   - Should see feedback change based on rating:
     - 1-3: "We'll focus on building your foundation here" (red)
     - 4-6: "We'll help strengthen this area" (yellow)
     - 7-10: "Great! We'll challenge you here" (green)
   - Progress bar shows X of 5 topics rated
   - Click "Continue →" when all rated

5. **Step 4: First Question**
   - Should load a practice question from backend
   - Select an answer
   - See immediate feedback (correct/incorrect with explanation)
   - Click "Complete Onboarding →"

6. **Redirect to Dashboard**
   - Should be redirected to `/dashboard`
   - Onboarding is marked as complete

### Test Resume from Middle

1. **Interrupt onboarding** (close browser after Step 2)
2. **Sign in again**
3. **Should resume** from where you left off (Step 3)

### Database Verification

After completing onboarding, check Supabase:

```sql
-- Check user onboarding record
SELECT * FROM user_onboarding WHERE user_id = 'your_clerk_user_id';

-- Check confidence ratings
SELECT * FROM topic_confidence WHERE user_id = 'your_clerk_user_id';
```

You should see:
- `user_onboarding.onboarding_completed = true`
- `user_onboarding.confidence_ratings` contains JSON object with ratings
- `topic_confidence` has 5 rows (for CISA) with ratings 1-10

## 📊 Test Question Personalization

After onboarding, verify that questions are personalized based on confidence:

```bash
# Get weak topics (confidence ≤ 5)
curl "https://your-railway-url.com/api/onboarding/weak-topics?userId=your_clerk_user_id"

# Expected response:
# ["governance", "compliance"] (topics where user rated ≤ 5)

# Get recommended difficulty
curl "https://your-railway-url.com/api/onboarding/recommended-difficulty?userId=your_clerk_user_id"

# Expected response based on average confidence:
# { "difficulty": "easy" } if avg ≤ 3
# { "difficulty": "medium" } if avg ≤ 6
# { "difficulty": "hard" } if avg ≤ 8
# { "difficulty": "mixed" } if avg > 8
```

## 🐛 Troubleshooting

### Issue: Onboarding page shows blank screen
- **Check**: Browser console for errors
- **Fix**: Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly

### Issue: Questions not loading in Step 4
- **Check**: Backend `/api/question?userId=X` endpoint
- **Fix**: Ensure questions exist in database for the selected category

### Issue: Confidence ratings not saving
- **Check**: Backend logs for errors
- **Fix**: Verify topic_confidence table exists and has correct schema

### Issue: User not redirected after onboarding
- **Check**: Frontend `/api/onboarding/complete` endpoint response
- **Fix**: Verify `onboarding_completed` field is being set to true

## 🎯 Success Criteria

✅ New users are automatically redirected to `/onboarding` after sign-up
✅ All 4 steps complete without errors
✅ Confidence ratings are saved to database
✅ Weak topics are identified correctly
✅ Questions are personalized based on confidence
✅ User can resume onboarding if interrupted
✅ Completed onboarding redirects to dashboard
✅ Returning users don't see onboarding again

## 📝 Next Steps After Deployment

1. **Add more certifications**: Update `TOPICS_BY_CERT` in `ConfidenceStep.tsx` with topics for:
   - AWS Solutions Architect Professional
   - Azure Administrator
   - Other certifications

2. **Monitor analytics**:
   - Track onboarding completion rate
   - Identify drop-off points
   - Measure average time per step

3. **A/B testing**:
   - Test different confidence rating scales
   - Experiment with question difficulty mapping
   - Optimize feedback messages

4. **Enhanced personalization**:
   - Use confidence ratings to adjust question difficulty over time
   - Track improvement in weak areas
   - Suggest study resources based on low-confidence topics

## 🔗 Related Files

- Frontend Components: `frontend/components/onboarding/`
- Backend Service: `backend/src/services/onboardingService.ts`
- API Controller: `backend/src/api/onboarding.ts`
- Migrations: `backend/migrations/005_add_onboarding.sql`, `006_simplify_onboarding_confidence.sql`
- Full Documentation: `ONBOARDING_CONFIDENCE_GUIDE.md`
