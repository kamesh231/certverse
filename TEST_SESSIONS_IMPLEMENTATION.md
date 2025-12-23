# Test Sessions & Results System - Implementation Plan

## 📋 Overview

This document outlines the complete implementation plan for test sessions and results aggregation. This will replace the current mock data with real backend-driven functionality.

---

## 🎯 Goals

1. **Test Sessions**: Users can start timed test sessions (150 questions, 4 hours)
2. **Session Management**: Save progress, pause/resume, track time
3. **Results Aggregation**: Calculate real scores, domain performance, and analytics
4. **Results Page**: Display comprehensive test results with real data
5. **Session History**: View past test sessions and compare performance

---

## 📊 Phase 1: Database Schema

### 1.1 Create `test_sessions` Table

**File:** `backend/migrations/007_test_sessions.sql`

```sql
-- Test Sessions Table
CREATE TABLE IF NOT EXISTS test_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'timed', -- 'timed', 'practice', 'domain_focus'
  domain INTEGER, -- NULL for full test, 1-5 for domain-specific
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned', 'paused'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  total_questions INTEGER NOT NULL DEFAULT 150,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  score DECIMAL(5,2), -- Percentage score
  time_spent_seconds INTEGER DEFAULT 0, -- Total time in seconds
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_test_sessions_user_id ON test_sessions(user_id);
CREATE INDEX idx_test_sessions_status ON test_sessions(status);
CREATE INDEX idx_test_sessions_started_at ON test_sessions(started_at DESC);

-- Row Level Security
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own test sessions"
  ON test_sessions FOR SELECT
  USING (true); -- For now, allow all reads (will add user_id check in app layer)

CREATE POLICY "Users can insert own test sessions"
  ON test_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own test sessions"
  ON test_sessions FOR UPDATE
  USING (true);
```

### 1.2 Create `session_responses` Junction Table

**File:** `backend/migrations/008_session_responses.sql`

```sql
-- Session Responses Junction Table
-- Links test sessions to user responses
CREATE TABLE IF NOT EXISTS session_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL,
  domain INTEGER NOT NULL,
  selected_choice TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_spent_seconds INTEGER DEFAULT 0, -- Time spent on this question
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, response_id) -- Prevent duplicate linking
);

-- Indexes
CREATE INDEX idx_session_responses_session_id ON session_responses(session_id);
CREATE INDEX idx_session_responses_response_id ON session_responses(response_id);
CREATE INDEX idx_session_responses_domain ON session_responses(domain);

-- Row Level Security
ALTER TABLE session_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session responses"
  ON session_responses FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own session responses"
  ON session_responses FOR INSERT
  WITH CHECK (true);
```

### 1.3 Add Domain to Responses Table (if missing)

```sql
-- Check if domain column exists, add if not
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'responses' AND column_name = 'domain'
  ) THEN
    ALTER TABLE responses ADD COLUMN domain INTEGER;
    
    -- Backfill domain from questions table
    UPDATE responses r
    SET domain = q.domain
    FROM questions q
    WHERE r.question_id = q.id;
  END IF;
END $$;
```

---

## 🔧 Phase 2: Backend Implementation

### 2.1 Test Session Service

**File:** `backend/src/services/testSessionService.ts`

```typescript
import { supabase } from '../lib/supabase';
import logger from '../lib/logger';

export interface TestSession {
  id: string;
  user_id: string;
  mode: 'timed' | 'practice' | 'domain_focus';
  domain: number | null;
  status: 'in_progress' | 'completed' | 'abandoned' | 'paused';
  started_at: string;
  completed_at: string | null;
  paused_at: string | null;
  resumed_at: string | null;
  total_questions: number;
  questions_answered: number;
  correct_answers: number;
  score: number | null;
  time_spent_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface SessionResponse {
  id: string;
  session_id: string;
  response_id: string;
  question_id: string;
  domain: number;
  selected_choice: string;
  correct: boolean;
  answered_at: string;
  time_spent_seconds: number;
}

/**
 * Create a new test session
 */
export async function createTestSession(
  userId: string,
  options: {
    mode?: 'timed' | 'practice' | 'domain_focus';
    domain?: number;
    totalQuestions?: number;
  }
): Promise<TestSession> {
  const { mode = 'timed', domain = null, totalQuestions = 150 } = options;

  const { data, error } = await supabase
    .from('test_sessions')
    .insert({
      user_id: userId,
      mode,
      domain,
      status: 'in_progress',
      total_questions: totalQuestions,
      questions_answered: 0,
      correct_answers: 0,
      time_spent_seconds: 0,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating test session:', error);
    throw new Error('Failed to create test session');
  }

  logger.info(`✅ Created test session ${data.id} for user ${userId}`);
  return data as TestSession;
}

/**
 * Get test session by ID
 */
export async function getTestSession(sessionId: string): Promise<TestSession | null> {
  const { data, error } = await supabase
    .from('test_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    logger.error('Error fetching test session:', error);
    throw new Error('Failed to fetch test session');
  }

  return data as TestSession;
}

/**
 * Get user's test sessions
 */
export async function getUserTestSessions(
  userId: string,
  limit: number = 10
): Promise<TestSession[]> {
  const { data, error } = await supabase
    .from('test_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error fetching user test sessions:', error);
    throw new Error('Failed to fetch test sessions');
  }

  return (data || []) as TestSession[];
}

/**
 * Add response to test session
 */
export async function addResponseToSession(
  sessionId: string,
  responseId: string,
  questionId: string,
  domain: number,
  selectedChoice: string,
  isCorrect: boolean,
  timeSpentSeconds: number = 0
): Promise<void> {
  // Link response to session
  const { error: linkError } = await supabase
    .from('session_responses')
    .insert({
      session_id: sessionId,
      response_id: responseId,
      question_id: questionId,
      domain,
      selected_choice: selectedChoice,
      correct: isCorrect,
      time_spent_seconds: timeSpentSeconds,
    });

  if (linkError) {
    logger.error('Error linking response to session:', linkError);
    throw new Error('Failed to link response to session');
  }

  // Update session stats
  const session = await getTestSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  const newQuestionsAnswered = session.questions_answered + 1;
  const newCorrectAnswers = session.correct_answers + (isCorrect ? 1 : 0);
  const newTimeSpent = session.time_spent_seconds + timeSpentSeconds;

  const { error: updateError } = await supabase
    .from('test_sessions')
    .update({
      questions_answered: newQuestionsAnswered,
      correct_answers: newCorrectAnswers,
      time_spent_seconds: newTimeSpent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (updateError) {
    logger.error('Error updating session stats:', updateError);
    throw new Error('Failed to update session stats');
  }
}

/**
 * Complete test session and calculate final score
 */
export async function completeTestSession(sessionId: string): Promise<TestSession> {
  const session = await getTestSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  // Calculate final score
  const score = session.questions_answered > 0
    ? (session.correct_answers / session.questions_answered) * 100
    : 0;

  const { data, error } = await supabase
    .from('test_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      score: Math.round(score * 100) / 100, // Round to 2 decimal places
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    logger.error('Error completing test session:', error);
    throw new Error('Failed to complete test session');
  }

  logger.info(`✅ Completed test session ${sessionId} with score ${score}%`);
  return data as TestSession;
}

/**
 * Pause test session
 */
export async function pauseTestSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('test_sessions')
    .update({
      status: 'paused',
      paused_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    logger.error('Error pausing test session:', error);
    throw new Error('Failed to pause test session');
  }
}

/**
 * Resume test session
 */
export async function resumeTestSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('test_sessions')
    .update({
      status: 'in_progress',
      resumed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    logger.error('Error resuming test session:', error);
    throw new Error('Failed to resume test session');
  }
}

/**
 * Get session results with domain breakdown
 */
export async function getSessionResults(sessionId: string): Promise<{
  session: TestSession;
  domainBreakdown: Array<{
    domain: number;
    domainName: string;
    total: number;
    correct: number;
    score: number;
  }>;
  totalTime: number;
  averageTimePerQuestion: number;
}> {
  const session = await getTestSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  // Get all responses for this session
  const { data: sessionResponses, error } = await supabase
    .from('session_responses')
    .select('*')
    .eq('session_id', sessionId);

  if (error) {
    logger.error('Error fetching session responses:', error);
    throw new Error('Failed to fetch session responses');
  }

  // Calculate domain breakdown
  const domainMap = new Map<number, { total: number; correct: number }>();
  
  (sessionResponses || []).forEach((sr: SessionResponse) => {
    const current = domainMap.get(sr.domain) || { total: 0, correct: 0 };
    domainMap.set(sr.domain, {
      total: current.total + 1,
      correct: current.correct + (sr.correct ? 1 : 0),
    });
  });

  const domainNames: Record<number, string> = {
    1: 'Information Systems Governance',
    2: 'IT Risk Management',
    3: 'Information Systems Acquisition',
    4: 'Information Systems Implementation',
    5: 'Information Systems Operations',
  };

  const domainBreakdown = Array.from(domainMap.entries()).map(([domain, stats]) => ({
    domain,
    domainName: domainNames[domain] || `Domain ${domain}`,
    total: stats.total,
    correct: stats.correct,
    score: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
  }));

  const totalTime = session.time_spent_seconds;
  const averageTimePerQuestion = session.questions_answered > 0
    ? Math.round(totalTime / session.questions_answered)
    : 0;

  return {
    session,
    domainBreakdown,
    totalTime,
    averageTimePerQuestion,
  };
}
```

### 2.2 Backend API Endpoints

**File:** `backend/src/api/test-sessions.ts`

```typescript
import { Request, Response } from 'express';
import {
  createTestSession,
  getTestSession,
  getUserTestSessions,
  addResponseToSession,
  completeTestSession,
  pauseTestSession,
  resumeTestSession,
  getSessionResults,
} from '../services/testSessionService';
import logger from '../lib/logger';

/**
 * POST /api/test-sessions/start
 * Start a new test session
 */
export async function startTestSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.body.userId as string;
    const mode = req.body.mode as 'timed' | 'practice' | 'domain_focus' || 'timed';
    const domain = req.body.domain as number | undefined;
    const totalQuestions = req.body.totalQuestions as number || 150;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const session = await createTestSession(userId, { mode, domain, totalQuestions });
    res.json(session);
  } catch (error) {
    logger.error('Error starting test session:', error);
    res.status(500).json({ error: 'Failed to start test session' });
  }
}

/**
 * GET /api/test-sessions/:sessionId
 * Get test session details
 */
export async function getSession(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.sessionId as string;
    const session = await getTestSession(sessionId);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json(session);
  } catch (error) {
    logger.error('Error fetching test session:', error);
    res.status(500).json({ error: 'Failed to fetch test session' });
  }
}

/**
 * GET /api/test-sessions?userId=xxx
 * Get user's test sessions
 */
export async function getUserSessions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.query.userId as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const sessions = await getUserTestSessions(userId, limit);
    res.json(sessions);
  } catch (error) {
    logger.error('Error fetching user test sessions:', error);
    res.status(500).json({ error: 'Failed to fetch test sessions' });
  }
}

/**
 * POST /api/test-sessions/:sessionId/response
 * Add a response to a test session
 */
export async function addSessionResponse(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.sessionId as string;
    const {
      responseId,
      questionId,
      domain,
      selectedChoice,
      isCorrect,
      timeSpentSeconds = 0,
    } = req.body;

    if (!responseId || !questionId || !domain || !selectedChoice) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    await addResponseToSession(
      sessionId,
      responseId,
      questionId,
      domain,
      selectedChoice,
      isCorrect,
      timeSpentSeconds
    );

    res.json({ success: true });
  } catch (error) {
    logger.error('Error adding session response:', error);
    res.status(500).json({ error: 'Failed to add response to session' });
  }
}

/**
 * POST /api/test-sessions/:sessionId/complete
 * Complete a test session
 */
export async function completeSession(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.sessionId as string;
    const session = await completeTestSession(sessionId);
    res.json(session);
  } catch (error) {
    logger.error('Error completing test session:', error);
    res.status(500).json({ error: 'Failed to complete test session' });
  }
}

/**
 * POST /api/test-sessions/:sessionId/pause
 * Pause a test session
 */
export async function pauseSession(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.sessionId as string;
    await pauseTestSession(sessionId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error pausing test session:', error);
    res.status(500).json({ error: 'Failed to pause test session' });
  }
}

/**
 * POST /api/test-sessions/:sessionId/resume
 * Resume a test session
 */
export async function resumeSession(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.sessionId as string;
    await resumeTestSession(sessionId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error resuming test session:', error);
    res.status(500).json({ error: 'Failed to resume test session' });
  }
}

/**
 * GET /api/test-sessions/:sessionId/results
 * Get detailed results for a completed session
 */
export async function getResults(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.sessionId as string;
    const results = await getSessionResults(sessionId);
    res.json(results);
  } catch (error) {
    logger.error('Error fetching session results:', error);
    res.status(500).json({ error: 'Failed to fetch session results' });
  }
}
```

### 2.3 Add Routes to index.ts

**File:** `backend/src/index.ts` (add these routes)

```typescript
// Add import at top
import * as testSessionController from './api/test-sessions';

// Add routes before error handler
// Test session endpoints
app.post('/api/test-sessions/start', asyncHandler(testSessionController.startTestSession));
app.get('/api/test-sessions/:sessionId', asyncHandler(testSessionController.getSession));
app.get('/api/test-sessions', asyncHandler(testSessionController.getUserSessions));
app.post('/api/test-sessions/:sessionId/response', asyncHandler(testSessionController.addSessionResponse));
app.post('/api/test-sessions/:sessionId/complete', asyncHandler(testSessionController.completeSession));
app.post('/api/test-sessions/:sessionId/pause', asyncHandler(testSessionController.pauseSession));
app.post('/api/test-sessions/:sessionId/resume', asyncHandler(testSessionController.resumeSession));
app.get('/api/test-sessions/:sessionId/results', asyncHandler(testSessionController.getResults));
```

### 2.4 Update Submit Answer to Link to Session

**File:** `backend/src/api/submit-answer.ts` (update existing function)

Add session linking logic:

```typescript
// After saving response, check if user has active session
// If sessionId is provided in request, link response to session
if (req.body.sessionId) {
  try {
    const { addResponseToSession } = await import('../services/testSessionService');
    const question = await getQuestionById(questionId);
    
    await addResponseToSession(
      req.body.sessionId,
      savedResponse.id,
      questionId,
      question.domain,
      selectedChoice,
      isCorrect,
      req.body.timeSpentSeconds || 0
    );
  } catch (error) {
    logger.error('Error linking response to session:', error);
    // Don't fail the request, just log the error
  }
}
```

---

## 🎨 Phase 3: Frontend Implementation

### 3.1 API Client Functions

**File:** `frontend/lib/api.ts` (add these functions)

```typescript
// Test Session Types
export interface TestSession {
  id: string;
  user_id: string;
  mode: 'timed' | 'practice' | 'domain_focus';
  domain: number | null;
  status: 'in_progress' | 'completed' | 'abandoned' | 'paused';
  started_at: string;
  completed_at: string | null;
  paused_at: string | null;
  resumed_at: string | null;
  total_questions: number;
  questions_answered: number;
  correct_answers: number;
  score: number | null;
  time_spent_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface SessionResults {
  session: TestSession;
  domainBreakdown: Array<{
    domain: number;
    domainName: string;
    total: number;
    correct: number;
    score: number;
  }>;
  totalTime: number;
  averageTimePerQuestion: number;
}

/**
 * Start a new test session
 */
export async function startTestSession(
  userId: string,
  options: {
    mode?: 'timed' | 'practice' | 'domain_focus';
    domain?: number;
    totalQuestions?: number;
  }
): Promise<TestSession> {
  try {
    const response = await fetch(`${API_URL}/api/test-sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        ...options,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to start test session');
    }

    return response.json();
  } catch (error) {
    console.error('Error starting test session:', error);
    throw error;
  }
}

/**
 * Get test session by ID
 */
export async function getTestSession(sessionId: string): Promise<TestSession> {
  try {
    const response = await fetch(`${API_URL}/api/test-sessions/${sessionId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch test session');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching test session:', error);
    throw error;
  }
}

/**
 * Get user's test sessions
 */
export async function getUserTestSessions(userId: string, limit: number = 10): Promise<TestSession[]> {
  try {
    const response = await fetch(`${API_URL}/api/test-sessions?userId=${userId}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch test sessions');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching test sessions:', error);
    throw error;
  }
}

/**
 * Complete test session
 */
export async function completeTestSession(sessionId: string): Promise<TestSession> {
  try {
    const response = await fetch(`${API_URL}/api/test-sessions/${sessionId}/complete`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to complete test session');
    }
    return response.json();
  } catch (error) {
    console.error('Error completing test session:', error);
    throw error;
  }
}

/**
 * Get session results
 */
export async function getSessionResults(sessionId: string): Promise<SessionResults> {
  try {
    const response = await fetch(`${API_URL}/api/test-sessions/${sessionId}/results`);
    if (!response.ok) {
      throw new Error('Failed to fetch session results');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching session results:', error);
    throw error;
  }
}
```

### 3.2 Results Page Implementation

**File:** `frontend/app/(dashboard)/results/page.tsx`

```typescript
"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Trophy, Clock, Target, ArrowLeft, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { getSessionResults, SessionResults } from "@/lib/api"
import Link from "next/link"

const domainNames: Record<number, string> = {
  1: "Governance",
  2: "Risk Management",
  3: "Acquisition",
  4: "Implementation",
  5: "Operations",
}

export default function ResultsPage() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('sessionId')
  
  const [results, setResults] = useState<SessionResults | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided')
      setIsLoading(false)
      return
    }

    async function loadResults() {
      try {
        const data = await getSessionResults(sessionId)
        setResults(data)
      } catch (err) {
        console.error('Failed to load results:', err)
        setError('Failed to load test results')
      } finally {
        setIsLoading(false)
      }
    }

    loadResults()
  }, [sessionId])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    return `${minutes}m ${secs}s`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <p className="text-destructive">{error || 'Results not found'}</p>
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  const { session, domainBreakdown, totalTime, averageTimePerQuestion } = results
  const score = session.score || 0
  const accuracy = session.questions_answered > 0
    ? Math.round((session.correct_answers / session.questions_answered) * 100)
    : 0

  // Prepare chart data
  const chartData = domainBreakdown.map(d => ({
    name: domainNames[d.domain] || `Domain ${d.domain}`,
    score: d.score,
    correct: d.correct,
    total: d.total,
  }))

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Test Results</h1>
          <p className="text-muted-foreground">
            Completed on {new Date(session.completed_at || session.updated_at).toLocaleDateString()}
          </p>
        </div>

        {/* Score Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Overall Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-6xl font-bold mb-2" style={{ color: score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444' }}>
                {score.toFixed(1)}%
              </div>
              <p className="text-muted-foreground mb-4">
                {session.correct_answers} out of {session.questions_answered} correct
              </p>
              <Progress value={score} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Time Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{formatTime(totalTime)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Avg: {formatTime(averageTimePerQuestion)} per question
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-500" />
                <span className="text-2xl font-bold">{accuracy}%</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {session.correct_answers} correct answers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{session.questions_answered}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                of {session.total_questions} total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Domain Performance */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Domain Performance</CardTitle>
            <CardDescription>Your performance across each CISA domain</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>

            {/* Domain Details */}
            <div className="mt-6 space-y-3">
              {domainBreakdown.map((domain) => (
                <div key={domain.domain} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{domain.domainName}</div>
                    <div className="text-sm text-muted-foreground">
                      {domain.correct} / {domain.total} correct
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={domain.score} className="w-24" />
                    <Badge variant={domain.score >= 70 ? "default" : domain.score >= 50 ? "secondary" : "destructive"}>
                      {domain.score}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/question">Practice More Questions</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">View Dashboard</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
```

### 3.3 Update Dashboard to Use Real Domain Data

**File:** `frontend/app/(dashboard)/dashboard/page.tsx` (update domain data calculation)

Replace the mock domain data (line 64-71) with:

```typescript
// Calculate real domain performance from user responses
const [domainData, setDomainData] = useState<Array<{
  domain: string;
  score: number;
  fullName: string;
}>>([])

useEffect(() => {
  async function loadDomainStats() {
    if (!user?.id) return
    
    try {
      // Get user's recent responses with domain info
      const history = await getUserHistory(user.id, 100) // Get last 100 responses
      
      // Group by domain and calculate scores
      const domainMap = new Map<number, { total: number; correct: number }>()
      
      history.forEach((response: UserResponse) => {
        // Note: You'll need to add domain to UserResponse interface
        // For now, fetch question to get domain
        // Or better: update backend to include domain in history response
      })
      
      // Calculate domain scores
      const calculated = Array.from(domainMap.entries()).map(([domainNum, stats]) => ({
        domain: domainNames[domainNum],
        score: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        fullName: domainFullNames[domainNum],
      }))
      
      setDomainData(calculated.length > 0 ? calculated : [
        // Fallback to mock if no data
        { domain: "Governance", score: 0, fullName: domainFullNames[1] },
        { domain: "Risk Management", score: 0, fullName: domainFullNames[2] },
        { domain: "Acquisition", score: 0, fullName: domainFullNames[3] },
        { domain: "Implementation", score: 0, fullName: domainFullNames[4] },
        { domain: "Operations", score: 0, fullName: domainFullNames[5] },
      ])
    } catch (err) {
      console.error('Failed to load domain stats:', err)
      // Keep mock data as fallback
    }
  }
  
  loadDomainStats()
}, [user?.id])
```

---

## 📝 Phase 4: Implementation Steps

### Step 1: Run Database Migrations (15 minutes)

1. Go to Supabase Dashboard → SQL Editor
2. Run `backend/migrations/007_test_sessions.sql`
3. Run `backend/migrations/008_session_responses.sql`
4. Verify tables created: `SELECT * FROM test_sessions LIMIT 1;`

### Step 2: Create Backend Service (30 minutes)

1. Create `backend/src/services/testSessionService.ts`
2. Copy the service code from Phase 2.1
3. Test with TypeScript compilation: `cd backend && npm run build`

### Step 3: Create Backend API (20 minutes)

1. Create `backend/src/api/test-sessions.ts`
2. Copy the API controller code from Phase 2.2
3. Add routes to `backend/src/index.ts` (Phase 2.3)
4. Test endpoints with curl or Postman

### Step 4: Update Submit Answer (10 minutes)

1. Update `backend/src/api/submit-answer.ts` to support session linking
2. Test that responses are linked to sessions

### Step 5: Frontend API Client (15 minutes)

1. Add test session types and functions to `frontend/lib/api.ts`
2. Test API calls in browser console

### Step 6: Build Results Page (45 minutes)

1. Create `frontend/app/(dashboard)/results/page.tsx`
2. Copy the results page code from Phase 3.2
3. Test with a completed session

### Step 7: Update Dashboard (20 minutes)

1. Update dashboard to calculate real domain performance
2. Remove mock data
3. Test domain chart with real data

### Step 8: Testing (30 minutes)

1. Start a test session
2. Answer questions (link to session)
3. Complete session
4. View results page
5. Verify domain breakdown is accurate

---

## ✅ Success Criteria

- [ ] Test sessions can be created
- [ ] Responses are linked to sessions
- [ ] Sessions can be completed
- [ ] Results page displays real data
- [ ] Domain breakdown is accurate
- [ ] Dashboard shows real domain performance
- [ ] Session history is accessible
- [ ] All API endpoints return correct data

---

## 🚀 Estimated Time

- **Database Setup**: 15 minutes
- **Backend Implementation**: 1.5 hours
- **Frontend Implementation**: 1.5 hours
- **Testing & Debugging**: 30 minutes
- **Total**: ~3.5 hours

---

## 📚 Next Steps After Implementation

1. Add pause/resume functionality to question page
2. Add timer display during test
3. Add session progress indicator
4. Add ability to review past sessions
5. Add export results as PDF
6. Add comparison with previous sessions

---

**Ready to implement?** Start with Phase 1 (Database Schema) and work through each phase sequentially.


