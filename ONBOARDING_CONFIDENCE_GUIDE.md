# Confidence-Based Onboarding - Quick & Simple

## Overview

Instead of a 10-question assessment, users rate their confidence on a 1-10 scale for each topic. This is:
- ⚡ Faster (30 seconds vs 5 minutes)
- 😊 Less intimidating
- 🎯 Just as effective for personalization

## New Onboarding Flow

```
New User Signup (Clerk)
         ↓
┌────────────────────────┐
│  Step 1: Welcome      │ 30 sec
└────────────────────────┘
         ↓
┌────────────────────────┐
│  Step 2: Set Goal     │ 45 sec
└────────────────────────┘
         ↓
┌────────────────────────┐
│  Step 3: Confidence   │ 60 sec ← NEW: Rate 1-10 per topic
│  Rating               │
└────────────────────────┘
         ↓
┌────────────────────────┐
│  Step 4: First Win    │ 30 sec
└────────────────────────┘
         ↓
   Dashboard (onboarded!)

Total: ~3 minutes (down from 5-8 minutes)
```

## Database Schema Changes

### Migration 006 Updates

```sql
-- Remove assessment tables
DROP TABLE IF EXISTS assessment_responses;
DROP TABLE IF EXISTS assessment_questions;

-- Update user_onboarding
ALTER TABLE user_onboarding
  DROP COLUMN assessment_score,
  DROP COLUMN assessment_completed,
  DROP COLUMN weak_topics,
  DROP COLUMN strong_topics,
  ADD COLUMN confidence_ratings JSONB DEFAULT '{}'::jsonb;

-- New table for detailed tracking
CREATE TABLE topic_confidence (
  user_id VARCHAR,
  topic VARCHAR,
  category VARCHAR,
  confidence_level INT CHECK (confidence_level >= 1 AND confidence_level <= 10),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, topic, category)
);
```

## Backend API

### New Endpoints

#### POST `/api/onboarding/confidence`
Save user's confidence ratings

**Request:**
```json
{
  "userId": "user_123",
  "category": "cisa",
  "ratings": {
    "governance": 5,
    "risk_management": 7,
    "information_security": 3,
    "it_operations": 6,
    "compliance": 4
  }
}
```

**Response:**
```json
{
  "success": true
}
```

#### GET `/api/onboarding/weak-topics?userId=xxx`
Get topics user has low confidence in

**Response:**
```json
{
  "weakTopics": ["information_security", "compliance", "governance"]
}
```

#### GET `/api/onboarding/recommended-difficulty?userId=xxx`
Get recommended difficulty based on average confidence

**Response:**
```json
{
  "difficulty": "medium"
}
```

**Difficulty mapping:**
- Confidence 1-3 → "easy"
- Confidence 4-6 → "medium"
- Confidence 7-8 → "hard"
- Confidence 9-10 → "mixed" (variety)

## Frontend Implementation

### Step 3: Confidence Rating (NEW)

```typescript
// pages/onboarding/confidence.tsx

interface TopicRating {
  id: string;
  name: string;
  description: string;
  rating: number;
}

export default function ConfidenceRating({
  certification,
  onNext
}: {
  certification: string;
  onNext: () => void;
}) {
  // CISA topics
  const cisaTopics = [
    {
      id: 'governance',
      name: 'Governance & Management',
      description: 'IT governance, strategy, policies',
    },
    {
      id: 'risk_management',
      name: 'Risk Management',
      description: 'Risk assessment, mitigation, monitoring',
    },
    {
      id: 'information_security',
      name: 'Information Security',
      description: 'Security controls, encryption, access management',
    },
    {
      id: 'it_operations',
      name: 'IT Operations & Support',
      description: 'Infrastructure, service management, resilience',
    },
    {
      id: 'compliance',
      name: 'Compliance & Audit',
      description: 'Audit planning, evidence, reporting',
    },
  ];

  const [ratings, setRatings] = useState<{ [key: string]: number }>({});

  const handleRatingChange = (topicId: string, rating: number) => {
    setRatings({ ...ratings, [topicId]: rating });
  };

  const handleSubmit = async () => {
    // Validate all topics rated
    if (Object.keys(ratings).length < cisaTopics.length) {
      alert('Please rate all topics');
      return;
    }

    // Save confidence ratings
    await fetch('/api/onboarding/confidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        category: 'cisa',
        ratings,
      }),
    });

    onNext();
  };

  return (
    <div className="confidence-rating">
      <h2>How confident are you with CISA topics? 🎯</h2>
      <p className="subtitle">
        Be honest! This helps us personalize your experience.
      </p>

      <div className="topics-list">
        {cisaTopics.map((topic) => (
          <div key={topic.id} className="topic-card">
            <div className="topic-info">
              <h3>{topic.name}</h3>
              <p className="description">{topic.description}</p>
            </div>

            <div className="rating-scale">
              <span className="label-start">Not Confident</span>

              <div className="rating-buttons">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    className={`rating-btn ${ratings[topic.id] === num ? 'selected' : ''}`}
                    onClick={() => handleRatingChange(topic.id, num)}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <span className="label-end">Very Confident</span>
            </div>

            {ratings[topic.id] && (
              <div className="rating-feedback">
                {ratings[topic.id] <= 3 && (
                  <span className="feedback low">
                    We'll focus on building your foundation here
                  </span>
                )}
                {ratings[topic.id] >= 4 && ratings[topic.id] <= 6 && (
                  <span className="feedback medium">
                    We'll help strengthen this area
                  </span>
                )}
                {ratings[topic.id] >= 7 && (
                  <span className="feedback high">
                    Great! We'll challenge you here
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={Object.keys(ratings).length < cisaTopics.length}
        className="btn-primary"
      >
        Continue
      </button>
    </div>
  );
}
```

### Styling (CSS/Tailwind)

```css
/* components/confidence-rating.css */

.confidence-rating {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.subtitle {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.topics-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.topic-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
}

.topic-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.topic-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.description {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.rating-scale {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.label-start,
.label-end {
  font-size: 0.75rem;
  color: #9ca3af;
  min-width: 80px;
}

.label-end {
  text-align: right;
}

.rating-buttons {
  display: flex;
  gap: 0.25rem;
  flex: 1;
}

.rating-btn {
  flex: 1;
  padding: 0.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s;
}

.rating-btn:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.rating-btn.selected {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
  transform: scale(1.1);
}

.rating-feedback {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.feedback.low { color: #ef4444; }
.feedback.medium { color: #f59e0b; }
.feedback.high { color: #10b981; }
```

## How We Use Confidence Ratings

### 1. Question Selection

When serving questions to users:

```typescript
// backend/src/api/get-question.ts

import { getWeakTopics, getRecommendedDifficulty } from '../services/onboardingService';

export async function getQuestion(req: Request, res: Response) {
  const userId = req.query.userId as string;

  // Get user's weak topics
  const weakTopics = await getWeakTopics(userId);

  // Get recommended difficulty
  const difficulty = await getRecommendedDifficulty(userId);

  // Query questions focusing on weak topics
  let query = supabase
    .from('questions')
    .select('*')
    .eq('difficulty', difficulty);

  if (weakTopics.length > 0) {
    // Focus 70% on weak topics, 30% on all topics
    const focusOnWeak = Math.random() < 0.7;
    if (focusOnWeak) {
      query = query.in('topic', weakTopics);
    }
  }

  // ... rest of logic
}
```

### 2. Progress Tracking

Track improvement in weak areas:

```typescript
// After user answers question
if (isCorrect && isWeakTopic) {
  // Update confidence over time
  await supabase
    .from('topic_confidence')
    .update({
      confidence_level: currentConfidence + 1, // Gradually increase
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('topic', topic);
}
```

### 3. Dashboard Insights

Show personalized insights:

```typescript
const weakTopics = await getWeakTopics(userId);

// Dashboard display
<div className="focus-areas">
  <h3>Your Focus Areas</h3>
  {weakTopics.map(topic => (
    <div key={topic} className="focus-topic">
      <span>{topic}</span>
      <progress value={confidence} max={10} />
      <span>{questionsAnswered} questions practiced</span>
    </div>
  ))}
</div>
```

## Topic Lists by Certification

### CISA (Certified Information Systems Auditor)

```typescript
const cisaTopics = [
  { id: 'governance', name: 'Governance & Management of IT', weight: 21 },
  { id: 'risk_management', name: 'IT Risk Management', weight: 19 },
  { id: 'information_security', name: 'Information Security', weight: 26 },
  { id: 'it_operations', name: 'IT Operations & Support', weight: 18 },
  { id: 'compliance', name: 'Compliance & Audit', weight: 16 },
];
```

### AWS Solutions Architect Associate

```typescript
const awsSAATopics = [
  { id: 'compute', name: 'Compute (EC2, Lambda, ECS)', weight: 20 },
  { id: 'storage', name: 'Storage (S3, EBS, EFS)', weight: 15 },
  { id: 'databases', name: 'Databases (RDS, DynamoDB)', weight: 15 },
  { id: 'networking', name: 'Networking & Content Delivery', weight: 20 },
  { id: 'security', name: 'Security, Identity & Compliance', weight: 20 },
  { id: 'monitoring', name: 'Monitoring & Troubleshooting', weight: 10 },
];
```

### CKA (Certified Kubernetes Administrator)

```typescript
const ckaTopics = [
  { id: 'architecture', name: 'Cluster Architecture', weight: 25 },
  { id: 'workloads', name: 'Workloads & Scheduling', weight: 15 },
  { id: 'services_networking', name: 'Services & Networking', weight: 20 },
  { id: 'storage', name: 'Storage', weight: 10 },
  { id: 'troubleshooting', name: 'Troubleshooting', weight: 30 },
];
```

## Benefits of Confidence-Based Approach

### For Users
- ✅ Faster onboarding (30 seconds vs 5 minutes)
- ✅ Less stressful (no "test")
- ✅ Honest self-assessment
- ✅ Clear what to expect

### For You (Developer)
- ✅ Higher completion rate
- ✅ Simpler to implement
- ✅ No need for assessment question bank
- ✅ Easy to add new certifications

### For Personalization
- ✅ Immediate personalization
- ✅ Adapts as user progresses
- ✅ Easy to track improvement
- ✅ Can combine with actual performance

## Implementation Checklist

Backend:
- [x] Create migration 006
- [x] Update onboarding service
- [x] Update API endpoints
- [x] Add routes to index.ts
- [ ] Run migration in Supabase
- [ ] Test API endpoints

Frontend:
- [ ] Create ConfidenceRating component
- [ ] Add topic lists for each certification
- [ ] Style rating UI
- [ ] Integrate into onboarding flow
- [ ] Test complete flow

## Testing

### Manual Test Flow

1. **Start onboarding** as new user
2. **Set goal**: Select CISA certification
3. **Rate confidence**: Rate all 5 topics (vary 1-10)
4. **Check database**:
   ```sql
   SELECT * FROM user_onboarding WHERE user_id = 'user_123';
   -- Should see confidence_ratings JSON

   SELECT * FROM topic_confidence WHERE user_id = 'user_123';
   -- Should see 5 rows with ratings
   ```
5. **Answer first question**: Should get question from weak topic
6. **Check recommended difficulty**:
   ```
   GET /api/onboarding/recommended-difficulty?userId=user_123
   ```

## Analytics

Track these metrics:

- Average time on confidence step
- % users who complete confidence rating
- Distribution of confidence ratings
- Correlation between confidence and actual performance

## Next Steps

1. Run migration 006 in Supabase
2. Create frontend ConfidenceRating component
3. Test with real user flow
4. Monitor completion rates
5. A/B test: confidence vs assessment (if desired)
