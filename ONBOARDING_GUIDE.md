# Complete Onboarding Implementation Guide

## Overview

This guide covers the complete onboarding experience for Certverse - from a new user's first login through their first question answered.

## Onboarding Flow

```
New User Signup (Clerk)
         ↓
Check Onboarding Status
         ↓
┌────────────────────────┐
│  Step 1: Welcome      │ ← Show value proposition
└────────────────────────┘
         ↓
┌────────────────────────┐
│  Step 2: Set Goal     │ ← What certification? When?
└────────────────────────┘
         ↓
┌────────────────────────┐
│  Step 3: Assessment   │ ← 10 quick questions
└────────────────────────┘
         ↓
┌────────────────────────┐
│  Step 4: Results &    │ ← Show strengths/weaknesses
│  Personalization      │    Recommend learning path
└────────────────────────┘
         ↓
┌────────────────────────┐
│  Step 5: First Win    │ ← Answer first question
└────────────────────────┘
         ↓
┌────────────────────────┐
│  Step 6: Trial CTA    │ ← "Start 7-day free trial"
└────────────────────────┘
         ↓
   Dashboard (onboarded!)
```

## Database Schema

### Tables Created

#### 1. `user_onboarding`
Tracks overall onboarding progress

```sql
- user_id (PK)
- completed (boolean)
- current_step (varchar) - 'welcome', 'goal', 'assessment', etc.
- primary_goal - 'certification', 'career_change', etc.
- target_certification - 'aws-saa', 'cka', etc.
- experience_level - 'beginner', 'intermediate', 'advanced'
- study_time_per_week (int)
- target_exam_date (date)
- assessment_score (0-100)
- weak_topics (text[])
- strong_topics (text[])
- steps_completed (jsonb)
```

#### 2. `user_preferences`
User study and notification preferences

```sql
- user_id (PK)
- daily_reminder_time (time)
- reminder_enabled (boolean)
- preferred_difficulty ('easy', 'medium', 'hard', 'mixed')
- questions_per_session (int)
- email_* (boolean flags)
- show_hints, show_timer, dark_mode
- focus_areas (text[])
```

#### 3. `assessment_questions`
Initial skill assessment questions

```sql
- id (UUID)
- category ('aws', 'azure', 'gcp', etc.)
- topic ('compute', 'networking', 'security')
- difficulty
- question_text
- options (jsonb)
- correct_option
- explanation
```

#### 4. `assessment_responses`
User responses to assessment

```sql
- user_id
- assessment_question_id
- selected_option
- is_correct
- time_taken_seconds
```

#### 5. `onboarding_tips_shown`
Tracks which tooltips/tips have been shown

```sql
- user_id
- tip_id ('first_question', 'streak_explained', etc.)
- shown_at
- dismissed
```

## Backend API Endpoints

### Onboarding Status & Progress

#### GET `/api/onboarding/status?userId=xxx`
Get current onboarding state

**Response:**
```json
{
  "user_id": "user_123",
  "completed": false,
  "current_step": "assessment",
  "primary_goal": "certification",
  "target_certification": "aws-saa",
  "experience_level": "intermediate",
  "assessment_score": 75,
  "weak_topics": ["networking", "security"],
  "strong_topics": ["compute", "storage"],
  "steps_completed": ["welcome", "goal"]
}
```

#### POST `/api/onboarding/start`
Start onboarding for new user

**Request:**
```json
{
  "userId": "user_123"
}
```

**Response:**
```json
{
  "success": true,
  "state": { /* onboarding state */ }
}
```

### Goal Setting

#### POST `/api/onboarding/goal`
Save user's learning goals

**Request:**
```json
{
  "userId": "user_123",
  "goal": "certification",
  "certification": "aws-saa",
  "experienceLevel": "intermediate",
  "studyTime": 5,
  "examDate": "2026-03-15"
}
```

### Assessment

#### GET `/api/onboarding/assessment/questions?category=aws&limit=10`
Get assessment questions

**Response:**
```json
{
  "questions": [
    {
      "id": "q1",
      "category": "aws",
      "topic": "compute",
      "difficulty": "medium",
      "question_text": "Which AWS service...",
      "options": [
        { "id": "a", "text": "EC2" },
        { "id": "b", "text": "Lambda" },
        { "id": "c", "text": "ECS" },
        { "id": "d", "text": "Fargate" }
      ]
      // Note: correct_option NOT included in response
    }
  ]
}
```

#### POST `/api/onboarding/assessment/submit`
Submit answer to assessment question

**Request:**
```json
{
  "userId": "user_123",
  "questionId": "q1",
  "selectedOption": "b",
  "timeTaken": 15
}
```

**Response:**
```json
{
  "isCorrect": true
}
```

#### POST `/api/onboarding/assessment/complete`
Finish assessment and get results

**Request:**
```json
{
  "userId": "user_123"
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "score": 75,
    "weakTopics": ["networking", "security"],
    "strongTopics": ["compute", "storage"]
  }
}
```

### Preferences

#### GET `/api/onboarding/preferences?userId=xxx`
Get user preferences

#### PUT `/api/onboarding/preferences`
Update user preferences

**Request:**
```json
{
  "userId": "user_123",
  "daily_reminder_time": "09:00:00",
  "preferred_difficulty": "medium",
  "questions_per_session": 15,
  "focus_areas": ["networking", "security"]
}
```

### Completion

#### POST `/api/onboarding/complete`
Mark onboarding as completed

**Request:**
```json
{
  "userId": "user_123"
}
```

## Frontend Implementation

### Step 1: Welcome Screen

```typescript
// pages/onboarding/welcome.tsx

export default function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="onboarding-welcome">
      <h1>Welcome to Certverse! 🎉</h1>
      <p>Master cloud certifications with daily practice questions</p>

      <div className="benefits">
        <div className="benefit">
          ✅ 1000+ practice questions
        </div>
        <div className="benefit">
          📊 Track your progress
        </div>
        <div className="benefit">
          🎯 Personalized learning paths
        </div>
        <div className="benefit">
          🔥 Build study streaks
        </div>
      </div>

      <button onClick={onNext} className="btn-primary">
        Get Started
      </button>

      <p className="time-estimate">Takes 3 minutes</p>
    </div>
  );
}
```

### Step 2: Goal Setting

```typescript
// pages/onboarding/goal.tsx

export default function GoalSetting({ onNext }: { onNext: () => void }) {
  const [goal, setGoal] = useState('');
  const [certification, setCertification] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [studyTime, setStudyTime] = useState(5);
  const [examDate, setExamDate] = useState('');

  const handleSubmit = async () => {
    await fetch('/api/onboarding/goal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        goal,
        certification,
        experienceLevel,
        studyTime,
        examDate,
      }),
    });

    onNext();
  };

  return (
    <div className="onboarding-goal">
      <h2>What's your goal? 🎯</h2>

      <div className="goal-options">
        <button
          className={goal === 'certification' ? 'selected' : ''}
          onClick={() => setGoal('certification')}
        >
          Pass a certification exam
        </button>
        <button
          className={goal === 'career_change' ? 'selected' : ''}
          onClick={() => setGoal('career_change')}
        >
          Change careers to cloud
        </button>
        <button
          className={goal === 'skill_improvement' ? 'selected' : ''}
          onClick={() => setGoal('skill_improvement')}
        >
          Improve existing skills
        </button>
        <button
          className={goal === 'interview_prep' ? 'selected' : ''}
          onClick={() => setGoal('interview_prep')}
        >
          Prepare for interviews
        </button>
      </div>

      {goal === 'certification' && (
        <>
          <h3>Which certification?</h3>
          <select value={certification} onChange={(e) => setCertification(e.target.value)}>
            <option value="">Select certification...</option>
            <option value="aws-saa">AWS Solutions Architect Associate</option>
            <option value="aws-sap">AWS Solutions Architect Professional</option>
            <option value="aws-dev">AWS Developer Associate</option>
            <option value="cka">Certified Kubernetes Administrator</option>
            <option value="azure-admin">Azure Administrator</option>
          </select>

          <h3>Experience level?</h3>
          <div className="experience-buttons">
            <button onClick={() => setExperienceLevel('beginner')}>
              Beginner (0-1 year)
            </button>
            <button onClick={() => setExperienceLevel('intermediate')}>
              Intermediate (1-3 years)
            </button>
            <button onClick={() => setExperienceLevel('advanced')}>
              Advanced (3+ years)
            </button>
          </div>

          <h3>How many hours per week can you study?</h3>
          <input
            type="range"
            min="1"
            max="20"
            value={studyTime}
            onChange={(e) => setStudyTime(Number(e.target.value))}
          />
          <p>{studyTime} hours/week</p>

          <h3>When do you plan to take the exam?</h3>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
          />
        </>
      )}

      <button onClick={handleSubmit} disabled={!goal}>
        Continue
      </button>
    </div>
  );
}
```

### Step 3: Assessment

```typescript
// pages/onboarding/assessment.tsx

export default function Assessment({ onNext }: { onNext: () => void }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const res = await fetch('/api/onboarding/assessment/questions?category=aws&limit=10');
    const data = await res.json();
    setQuestions(data.questions);
  };

  const handleAnswer = async (option: string) => {
    const question = questions[currentIndex];

    // Submit answer
    await fetch('/api/onboarding/assessment/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        questionId: question.id,
        selectedOption: option,
        timeTaken: 0,
      }),
    });

    setAnswers({ ...answers, [question.id]: option });

    // Move to next question or complete
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeAssessment();
    }
  };

  const completeAssessment = async () => {
    const res = await fetch('/api/onboarding/assessment/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });

    const data = await res.json();
    // Store results to show in next step
    localStorage.setItem('assessment_results', JSON.stringify(data.results));

    onNext();
  };

  const currentQuestion = questions[currentIndex];

  return (
    <div className="onboarding-assessment">
      <h2>Quick Skills Check 📝</h2>
      <p>Let's see where you're at! ({currentIndex + 1}/{questions.length})</p>

      {currentQuestion && (
        <>
          <div className="question">
            <p>{currentQuestion.question_text}</p>

            <div className="options">
              {currentQuestion.options.map((option: any) => (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(option.id)}
                  className="option-button"
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>

          <div className="progress-bar">
            <div
              className="progress"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
```

### Step 4: Results & Personalization

```typescript
// pages/onboarding/results.tsx

export default function Results({ onNext }: { onNext: () => void }) {
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('assessment_results');
    if (stored) {
      setResults(JSON.parse(stored));
    }
  }, []);

  return (
    <div className="onboarding-results">
      <h2>Your Results 🎯</h2>

      <div className="score-display">
        <div className="score-circle">
          <span className="score-number">{results?.score}%</span>
        </div>
        <p>Overall Score</p>
      </div>

      <div className="strengths-weaknesses">
        <div className="strengths">
          <h3>💪 Your Strengths</h3>
          {results?.strongTopics.map((topic: string) => (
            <div key={topic} className="topic-badge strong">
              {topic}
            </div>
          ))}
        </div>

        <div className="weaknesses">
          <h3>📚 Areas to Focus On</h3>
          {results?.weakTopics.map((topic: string) => (
            <div key={topic} className="topic-badge weak">
              {topic}
            </div>
          ))}
        </div>
      </div>

      <div className="personalization">
        <h3>We've personalized your experience</h3>
        <p>
          ✅ Your daily questions will focus on {results?.weakTopics.join(', ')}
        </p>
        <p>
          ✅ We'll track your progress in weak areas
        </p>
        <p>
          ✅ Custom learning path created for AWS SAA
        </p>
      </div>

      <button onClick={onNext} className="btn-primary">
        Start Learning
      </button>
    </div>
  );
}
```

### Step 5: First Question (Quick Win)

```typescript
// pages/onboarding/first-question.tsx

export default function FirstQuestion({ onNext }: { onNext: () => void }) {
  const [question, setQuestion] = useState<any>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    loadQuestion();
  }, []);

  const loadQuestion = async () => {
    const res = await fetch('/api/question?userId=' + user.id);
    const data = await res.json();
    setQuestion(data);
  };

  const handleAnswer = async (option: string) => {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        questionId: question.id,
        selectedOption: option,
      }),
    });

    const result = await res.json();
    setIsCorrect(result.is_correct);
    setAnswered(true);
  };

  return (
    <div className="onboarding-first-question">
      <h2>Let's answer your first question! 🚀</h2>

      {question && (
        <div className="question-card">
          <p className="question-text">{question.question_text}</p>

          <div className="options">
            {question.options.map((option: any) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(option.id)}
                disabled={answered}
                className={answered
                  ? option.id === question.correct_option
                    ? 'correct'
                    : 'incorrect'
                  : ''
                }
              >
                {option.text}
              </button>
            ))}
          </div>

          {answered && (
            <div className={`result ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? (
                <>
                  <h3>🎉 Correct!</h3>
                  <p>{question.explanation}</p>
                  <button onClick={onNext} className="btn-primary">
                    Continue
                  </button>
                </>
              ) : (
                <>
                  <h3>Not quite!</h3>
                  <p>{question.explanation}</p>
                  <button onClick={onNext} className="btn-primary">
                    Continue
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Step 6: Trial CTA

```typescript
// pages/onboarding/trial-cta.tsx

export default function TrialCTA({ onComplete }: { onComplete: () => void }) {
  const handleStartTrial = async () => {
    // Create checkout session
    const res = await fetch('/api/checkout/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        userEmail: user.email,
      }),
    });

    const data = await res.json();
    window.location.href = data.url; // Redirect to Polar checkout
  };

  const handleSkip = async () => {
    await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });

    onComplete();
  };

  return (
    <div className="onboarding-trial-cta">
      <h2>Ready to unlock unlimited practice? 🚀</h2>

      <div className="comparison">
        <div className="plan free">
          <h3>Free Plan</h3>
          <div className="price">$0</div>
          <ul>
            <li>2 questions per day</li>
            <li>Basic progress tracking</li>
            <li>Community support</li>
          </ul>
        </div>

        <div className="plan premium highlighted">
          <div className="badge">7-DAY FREE TRIAL</div>
          <h3>Premium</h3>
          <div className="price">$29/month</div>
          <ul>
            <li>✅ Unlimited questions</li>
            <li>✅ Advanced analytics</li>
            <li>✅ Personalized learning paths</li>
            <li>✅ Weak area focus</li>
            <li>✅ Downloadable reports</li>
          </ul>
          <button onClick={handleStartTrial} className="btn-primary">
            Start Free Trial
          </button>
        </div>
      </div>

      <button onClick={handleSkip} className="btn-link">
        Skip for now, stay on free plan
      </button>
    </div>
  );
}
```

### Main Onboarding Container

```typescript
// pages/onboarding/index.tsx

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    const res = await fetch(`/api/onboarding/status?userId=${user.id}`);
    const data = await res.json();

    if (data.completed) {
      // Already completed, redirect to dashboard
      router.push('/dashboard');
    } else {
      // Resume from current step
      const stepIndex = steps.indexOf(data.current_step);
      setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
    }
  };

  const steps = [
    'welcome',
    'goal',
    'assessment',
    'results',
    'first_question',
    'trial_cta',
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });

    router.push('/dashboard');
  };

  return (
    <div className="onboarding-container">
      <div className="progress-indicator">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`step ${index === currentStep ? 'active' : ''} ${
              index < currentStep ? 'completed' : ''
            }`}
          />
        ))}
      </div>

      {currentStep === 0 && <WelcomeScreen onNext={handleNext} />}
      {currentStep === 1 && <GoalSetting onNext={handleNext} />}
      {currentStep === 2 && <Assessment onNext={handleNext} />}
      {currentStep === 3 && <Results onNext={handleNext} />}
      {currentStep === 4 && <FirstQuestion onNext={handleNext} />}
      {currentStep === 5 && <TrialCTA onComplete={completeOnboarding} />}
    </div>
  );
}
```

## Key Features

### 1. Personalization
- Assessment identifies weak/strong topics
- Daily questions focus on weak areas
- Difficulty adjusts based on performance

### 2. Quick Wins
- First question during onboarding
- Immediate feedback
- Build confidence early

### 3. Clear Progress
- Progress bar showing steps
- Estimated time remaining
- Step completion tracking

### 4. Goal-Oriented
- Set clear certification goal
- Track toward exam date
- Calculate readiness

### 5. Trial Conversion
- Show value first (assessment, first question)
- Clear free vs premium comparison
- 7-day trial with no friction

## Implementation Checklist

Backend:
- [ ] Run migration `005_add_onboarding.sql`
- [ ] Add assessment questions to database
- [ ] Test all API endpoints
- [ ] Deploy to Railway

Frontend:
- [ ] Create onboarding page components
- [ ] Add routing for /onboarding
- [ ] Style onboarding UI
- [ ] Add animations/transitions
- [ ] Test complete flow
- [ ] Add skip/resume functionality

## Seed Assessment Questions

```sql
-- Sample AWS assessment questions
INSERT INTO assessment_questions (category, topic, difficulty, question_text, options, correct_option, explanation, assessment_type, order_index) VALUES
(
  'aws',
  'compute',
  'easy',
  'Which AWS service provides scalable compute capacity in the cloud?',
  '[
    {"id": "a", "text": "Amazon S3"},
    {"id": "b", "text": "Amazon EC2"},
    {"id": "c", "text": "Amazon RDS"},
    {"id": "d", "text": "Amazon VPC"}
  ]'::jsonb,
  'b',
  'Amazon EC2 (Elastic Compute Cloud) provides scalable compute capacity.',
  'initial',
  1
),
-- Add 9 more questions...
```

## Analytics to Track

- % users who complete onboarding
- Average time to complete
- Drop-off points (which step loses users)
- Assessment average score
- Trial conversion rate from onboarding
- Time from signup to first question

## Next Steps

1. Create assessment questions (10-15 per category)
2. Design onboarding UI/UX
3. Implement frontend components
4. Add analytics tracking
5. A/B test different flows
6. Optimize based on data
