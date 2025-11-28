import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { handlePolarWebhook } from './api/polar-webhook';
import { getQuestion } from './api/get-question';
import { submitAnswer } from './api/submit-answer';
import { getUserSubscription, createCheckout } from './services/subscriptionService';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import logger from './lib/logger';
import './lib/sentry'; // Initialize Sentry

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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
      // Convert raw body to JSON
      req.body = JSON.parse(req.body.toString());
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

  const totalAnswered = stats?.total_questions || 0;
  const totalCorrect = stats?.correct_answers || 0;

  res.json({
    totalAnswered,
    totalCorrect,
    accuracy: totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0,
    currentStreak: stats?.current_streak || 0,
    longestStreak: stats?.longest_streak || 0,
    questionsToday: todayResponses?.length || 0
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
    total_questions: 0,
    correct_answers: 0,
    current_streak: 0,
    longest_streak: 0
  });
}));

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
