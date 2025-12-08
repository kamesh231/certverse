import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { handlePolarWebhook } from './api/polar-webhook';
import { getQuestion } from './api/get-question';
import { submitAnswer } from './api/submit-answer';
import { getUserSubscription, createCheckout } from './services/subscriptionService';
import { getCustomerPortalUrl } from './lib/polarClient';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import logger from './lib/logger';
import './lib/sentry'; // Initialize Sentry
import * as onboardingController from './api/onboarding';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - required when behind reverse proxy (Railway, Vercel, etc.)
// This allows express-rate-limit to correctly identify client IPs from X-Forwarded-For header
app.set('trust proxy', true);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
app.use(rateLimiter);

// Polar webhook MUST be BEFORE express.json() to access raw body
app.post('/api/webhooks/polar',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    try {
      // Store raw body for signature verification
      const rawBody = req.body.toString();
      // Parse JSON for processing
      const parsedBody = JSON.parse(rawBody);

      // Add both to request for webhook handler
      (req as any).rawBody = rawBody;
      req.body = parsedBody;

      await handlePolarWebhook(req, res);
    } catch (error) {
      logger.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

// JSON body parser (after webhook route)
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Subscription endpoints
app.get('/api/subscription', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const subscription = await getUserSubscription(userId);
  res.json(subscription);
}));

app.post('/api/checkout/create', asyncHandler(async (req: Request, res: Response) => {
  const { userId, userEmail } = req.body;

  if (!userId || !userEmail) {
    res.status(400).json({ error: 'userId and userEmail are required' });
    return;
  }

  const checkoutUrl = await createCheckout(userId, userEmail);
  res.json({ url: checkoutUrl }); // Frontend expects 'url' field
}));

// Customer portal endpoint
app.get('/api/subscription/portal-url', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const subscription = await getUserSubscription(userId);

  if (!subscription.polar_customer_id) {
    res.status(404).json({ error: 'No active Polar subscription found' });
    return;
  }

  const portalUrl = await getCustomerPortalUrl(subscription.polar_customer_id);
  res.json({ url: portalUrl });
}));

// Question endpoints
app.get('/api/question', asyncHandler(async (req: Request, res: Response) => {
  await getQuestion(req, res);
}));

app.post('/api/submit-answer', asyncHandler(async (req: Request, res: Response) => {
  await submitAnswer(req, res);
}));

// Alias for submit-answer (frontend uses /api/submit)
app.post('/api/submit', asyncHandler(async (req: Request, res: Response) => {
  await submitAnswer(req, res);
}));

// User history endpoint
app.get('/api/history', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const { supabase } = await import('./lib/supabase');

  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  res.json(data || []);
}));

// Question count endpoint
app.get('/api/question-count', asyncHandler(async (req: Request, res: Response) => {
  const { supabase } = await import('./lib/supabase');

  const { count, error } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw error;
  }

  res.json({ count: count || 0 });
}));

// Unlock status endpoint
app.get('/api/unlock/remaining', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const { getRemainingQuestions } = await import('./services/unlockService');
  const { getUserSubscription } = await import('./services/subscriptionService');

  const remaining = await getRemainingQuestions(userId);
  const subscription = await getUserSubscription(userId);
  const total = subscription.plan_type === 'paid' && subscription.status === 'active' ? 999 : 2;

  // Get streak from user_stats
  const { supabase } = await import('./lib/supabase');
  const { data: stats } = await supabase
    .from('user_stats')
    .select('current_streak')
    .eq('user_id', userId)
    .single();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  res.json({
    remaining,
    total,
    resetsAt: tomorrow.toISOString(),
    streak: stats?.current_streak || 0
  });
}));

// Enhanced stats endpoint
app.get('/api/stats/enhanced', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const { supabase } = await import('./lib/supabase');

  // Get user stats
  const { data: stats, error: statsError } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (statsError && statsError.code !== 'PGRST116') {
    throw statsError;
  }

  // Get today's question count
  const today = new Date().toISOString().split('T')[0];
  const { data: todayResponses } = await supabase
    .from('responses')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', `${today}T00:00:00Z`)
    .lt('created_at', `${today}T23:59:59Z`);

  // Calculate domain performance
  // Join responses with questions to get domain information
  const { data: domainResponses, error: domainError } = await supabase
    .from('responses')
    .select(`
      correct,
      questions!inner(domain)
    `)
    .eq('user_id', userId);

  if (domainError) {
    throw domainError;
  }

  // Calculate accuracy per domain
  const domainStats: Record<number, { total: number; correct: number; score: number }> = {
    1: { total: 0, correct: 0, score: 0 },
    2: { total: 0, correct: 0, score: 0 },
    3: { total: 0, correct: 0, score: 0 },
    4: { total: 0, correct: 0, score: 0 },
    5: { total: 0, correct: 0, score: 0 },
  };

  if (domainResponses) {
    domainResponses.forEach((response: any) => {
      const domain = response.questions?.domain;
      if (domain >= 1 && domain <= 5) {
        domainStats[domain].total++;
        if (response.correct) {
          domainStats[domain].correct++;
        }
      }
    });

    // Calculate scores
    Object.keys(domainStats).forEach((domainKey) => {
      const domain = parseInt(domainKey, 10);
      const stats = domainStats[domain];
      stats.score = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    });
  }

  // Calculate overall readiness (weighted average of domain scores)
  // Only count domains where user has attempted at least 5 questions
  const domainScores = Object.values(domainStats)
    .filter((stats) => stats.total >= 5)
    .map((stats) => stats.score);

  const overallReadiness = domainScores.length > 0
    ? domainScores.reduce((sum, score) => sum + score, 0) / domainScores.length
    : 0;

  const totalAnswered = stats?.total_questions_attempted || 0;
  const totalCorrect = stats?.correct_answers || 0;

  res.json({
    totalAnswered,
    totalCorrect,
    accuracy: totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0,
    currentStreak: stats?.current_streak || 0,
    longestStreak: stats?.longest_streak || 0,
    questionsToday: todayResponses?.length || 0,
    domainPerformance: [
      {
        domain: 1,
        score: domainStats[1].score,
        total: domainStats[1].total,
        correct: domainStats[1].correct,
      },
      {
        domain: 2,
        score: domainStats[2].score,
        total: domainStats[2].total,
        correct: domainStats[2].correct,
      },
      {
        domain: 3,
        score: domainStats[3].score,
        total: domainStats[3].total,
        correct: domainStats[3].correct,
      },
      {
        domain: 4,
        score: domainStats[4].score,
        total: domainStats[4].total,
        correct: domainStats[4].correct,
      },
      {
        domain: 5,
        score: domainStats[5].score,
        total: domainStats[5].total,
        correct: domainStats[5].correct,
      },
    ],
    overallReadiness: Math.round(overallReadiness),
  });
}));

// User stats endpoint
app.get('/api/stats', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const { supabase } = await import('./lib/supabase');

  // Get user stats
  const { data: stats, error: statsError } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (statsError && statsError.code !== 'PGRST116') {
    throw statsError;
  }

  res.json(stats || {
    user_id: userId,
    total_questions_attempted: 0,
    correct_answers: 0,
    current_streak: 0,
    longest_streak: 0
  });
}));

// Onboarding endpoints
app.get('/api/onboarding/status', asyncHandler(onboardingController.getOnboardingStatus));
app.post('/api/onboarding/start', asyncHandler(onboardingController.startOnboarding));
app.post('/api/onboarding/goal', asyncHandler(onboardingController.saveGoal));
app.post('/api/onboarding/confidence', asyncHandler(onboardingController.saveConfidence));
app.get('/api/onboarding/weak-topics', asyncHandler(onboardingController.getWeakTopicsEndpoint));
app.get('/api/onboarding/recommended-difficulty', asyncHandler(onboardingController.getRecommendedDifficultyEndpoint));
app.post('/api/onboarding/step', asyncHandler(onboardingController.updateStep));
app.post('/api/onboarding/complete', asyncHandler(onboardingController.finishOnboarding));
app.get('/api/onboarding/preferences', asyncHandler(onboardingController.getPreferences));
app.put('/api/onboarding/preferences', asyncHandler(onboardingController.updatePreferences));
app.post('/api/onboarding/tip/shown', asyncHandler(onboardingController.markTipAsShown));
app.get('/api/onboarding/tip/check', asyncHandler(onboardingController.checkTipShown));

// Error handling
app.use(errorHandler);

// Async handler wrapper
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Start server
app.listen(PORT, () => {
  logger.info(`=� Server running on port ${PORT}`);
  logger.info(`=� Environment: ${process.env.NODE_ENV}`);
  logger.info(`= Frontend URL: ${process.env.FRONTEND_URL}`);
});

export default app;
