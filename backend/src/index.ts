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
import { verifyAuth } from './middleware/verifyAuth';
import { validateRequest } from './middleware/validateRequest';
import {
  submitAnswerSchema,
  getQuestionSchema,
  getUserHistorySchema,
  createCheckoutSchema,
  saveGoalSchema,
  saveConfidenceSchema,
  updateStepSchema,
  updatePreferencesSchema,
  markTipShownSchema,
  checkTipShownSchema,
} from './lib/validation';
import logger from './lib/logger';
import './lib/sentry'; // Initialize Sentry
import * as onboardingController from './api/onboarding';
import adminRoutes from './api/admin-upload';

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
      // req.body is a Buffer from express.raw()
      logger.info('Webhook raw body type:', typeof req.body);
      logger.info('Webhook raw body is Buffer:', Buffer.isBuffer(req.body));

      // Keep as Buffer for Polar SDK (it accepts string or Buffer)
      const rawBody = req.body;

      // Parse JSON for processing
      const parsedBody = JSON.parse(rawBody.toString());

      // Add both to request for webhook handler
      (req as any).rawBody = rawBody; // Pass Buffer to webhook handler
      req.body = parsedBody; // Parsed object for convenience

      await handlePolarWebhook(req, res);
    } catch (error) {
      logger.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

// JSON body parser (after webhook route)
// Increased limit to 50mb to support bulk question uploads (up to ~25,000 questions)
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Subscription endpoints
app.get('/api/subscription', verifyAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const subscription = await getUserSubscription(userId);
  res.json(subscription);
}));

app.post('/api/checkout/create', verifyAuth, validateRequest(createCheckoutSchema), asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { userEmail, billingInterval } = req.body;

  if (!userEmail) {
    res.status(400).json({ error: 'userEmail is required' });
    return;
  }

  // Validate billingInterval (default to monthly if not provided or invalid)
  const validInterval = billingInterval === 'quarterly' ? 'quarterly' : 'monthly';

  const checkoutUrl = await createCheckout(userId, userEmail, validInterval);
  res.json({ url: checkoutUrl }); // Frontend expects 'url' field
}));

// Customer portal endpoint
app.get('/api/subscription/portal-url', verifyAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const subscription = await getUserSubscription(userId);

  if (!subscription.polar_customer_id) {
    res.status(404).json({ error: 'No active Polar subscription found' });
    return;
  }

  const portalUrl = await getCustomerPortalUrl(subscription.polar_customer_id);
  res.json({ url: portalUrl });
}));

// Question endpoints
app.get('/api/question', verifyAuth, validateRequest(getQuestionSchema, 'query'), asyncHandler(async (req: Request, res: Response) => {
  await getQuestion(req, res);
}));

app.post('/api/submit-answer', verifyAuth, validateRequest(submitAnswerSchema), asyncHandler(async (req: Request, res: Response) => {
  await submitAnswer(req, res);
}));

// Alias for submit-answer (frontend uses /api/submit)
app.post('/api/submit', verifyAuth, validateRequest(submitAnswerSchema), asyncHandler(async (req: Request, res: Response) => {
  await submitAnswer(req, res);
}));

// Admin routes (must be after verifyAuth middleware is defined)
app.use('/api/admin', adminRoutes);

// User history endpoint
app.get('/api/history', verifyAuth, validateRequest(getUserHistorySchema, 'query'), asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const limit = parseInt(req.query.limit as string) || 10;

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
app.get('/api/unlock/remaining', verifyAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const { getRemainingQuestions } = await import('./services/unlockService');
  const { getUserSubscription } = await import('./services/subscriptionService');

  const remaining = await getRemainingQuestions(userId);
  const subscription = await getUserSubscription(userId);
  const total = subscription.is_paid ? 999 : 2;

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
app.get('/api/stats/enhanced', verifyAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

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
app.get('/api/stats', verifyAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

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
app.get('/api/onboarding/status', verifyAuth, asyncHandler(onboardingController.getOnboardingStatus));
app.post('/api/onboarding/start', verifyAuth, asyncHandler(onboardingController.startOnboarding));
app.post('/api/onboarding/goal', verifyAuth, validateRequest(saveGoalSchema), asyncHandler(onboardingController.saveGoal));
app.post('/api/onboarding/confidence', verifyAuth, validateRequest(saveConfidenceSchema), asyncHandler(onboardingController.saveConfidence));
app.get('/api/onboarding/weak-topics', verifyAuth, asyncHandler(onboardingController.getWeakTopicsEndpoint));
app.get('/api/onboarding/recommended-difficulty', verifyAuth, asyncHandler(onboardingController.getRecommendedDifficultyEndpoint));
app.post('/api/onboarding/step', verifyAuth, validateRequest(updateStepSchema), asyncHandler(onboardingController.updateStep));
app.post('/api/onboarding/complete', verifyAuth, asyncHandler(onboardingController.finishOnboarding));
app.get('/api/onboarding/preferences', verifyAuth, asyncHandler(onboardingController.getPreferences));
app.put('/api/onboarding/preferences', verifyAuth, validateRequest(updatePreferencesSchema), asyncHandler(onboardingController.updatePreferences));
app.post('/api/onboarding/tip/shown', verifyAuth, validateRequest(markTipShownSchema), asyncHandler(onboardingController.markTipAsShown));
app.get('/api/onboarding/tip/check', verifyAuth, validateRequest(checkTipShownSchema, 'query'), asyncHandler(onboardingController.checkTipShown));

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
