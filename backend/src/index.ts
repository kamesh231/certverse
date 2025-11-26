import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { checkConnection } from './lib/supabase';
import { getRandomQuestion, getQuestionCount } from './api/get-question';
import { submitAnswer, getUserResponses, getUserStats } from './api/submit-answer';
import { getRemainingQuestions, getEnhancedUserStats } from './services/unlockService';
import { initSentry, Sentry } from './lib/sentry';
import logger, { logInfo, logError } from './lib/logger';
import { apiLimiter, questionLimiter, submitLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler';

dotenv.config();

// Initialize Sentry first (before any other code)
initSentry();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ============================================
// MIDDLEWARE
// ============================================

// Sentry request handler (must be first)
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    /\.vercel\.app$/,  // Allow all Vercel preview deployments
    /\.railway\.app$/  // Allow all Railway deployments
  ],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Apply rate limiting to all routes
app.use(apiLimiter);

// Request logging middleware
app.use((req, res, next) => {
  logInfo(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const isConnected = await checkConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: isConnected ? 'connected' : 'disconnected'
  });
});

// Get API info
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Certverse API',
    version: '1.0.0',
    description: 'Backend API for CISA exam preparation platform',
    endpoints: {
      health: 'GET /health',
      question: 'GET /api/question?userId=xxx',
      submit: 'POST /api/submit',
      stats: 'GET /api/stats?userId=xxx',
      history: 'GET /api/history?userId=xxx',
      unlockRemaining: 'GET /api/unlock/remaining?userId=xxx',
      enhancedStats: 'GET /api/stats/enhanced?userId=xxx'
    }
  });
});

// Get random question for user
app.get('/api/question', questionLimiter, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({
      error: 'Missing userId parameter'
    });
  }

  const question = await getRandomQuestion(userId);

  if (!question) {
    return res.status(404).json({
      error: 'No questions available'
    });
  }

  res.json(question);
}));

// Submit answer
app.post('/api/submit', submitLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { userId, questionId, selectedChoice } = req.body;

  if (!userId || !questionId || !selectedChoice) {
    return res.status(400).json({
      error: 'Missing required fields: userId, questionId, selectedChoice'
    });
  }

  const result = await submitAnswer({ userId, questionId, selectedChoice });

  if (!result.success && result.error) {
    return res.status(400).json(result);
  }

  res.json(result);
}));

// Get user statistics
app.get('/api/stats', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({
      error: 'Missing userId parameter'
    });
  }

  const stats = await getUserStats(userId);
  res.json(stats);
}));

// Get user answer history
app.get('/api/history', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!userId) {
    return res.status(400).json({
      error: 'Missing userId parameter'
    });
  }

  const history = await getUserResponses(userId, limit);
  res.json(history);
}));

// Get remaining questions for today (Week 3 feature)
app.get('/api/unlock/remaining', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({
      error: 'Missing userId parameter'
    });
  }

  const unlockStatus = await getRemainingQuestions(userId);
  res.json(unlockStatus);
}));

// Get enhanced user statistics (includes streak)
app.get('/api/stats/enhanced', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({
      error: 'Missing userId parameter'
    });
  }

  const enhancedStats = await getEnhancedUserStats(userId);
  res.json(enhancedStats);
}));

// Get question count (for admin/debugging)
app.get('/api/question-count', asyncHandler(async (req: Request, res: Response) => {
  const count = await getQuestionCount();
  res.json({ count });
}));

// Sentry error handler (must be before other error handlers)
app.use(Sentry.Handlers.errorHandler());

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// SERVER START
// ============================================

async function startServer() {
  try {
    // Check database connection before starting
    logInfo('🔍 Checking database connection...');
    const isConnected = await checkConnection();

    if (!isConnected) {
      logError('❌ Failed to connect to Supabase. Check your credentials.');
      process.exit(1);
    }

    logInfo('✅ Database connected successfully');

    // Get question count
    const questionCount = await getQuestionCount();
    logInfo(`📝 Questions in database: ${questionCount}`);

    if (questionCount === 0) {
      logInfo('⚠️  No questions found. Run: npm run seed');
    }

    // Start Express server
    app.listen(PORT, () => {
      logInfo(`🚀 Certverse API running on port ${PORT}`);
      logInfo(`🌐 Health check: http://localhost:${PORT}/health`);
      logInfo(`📚 API docs: http://localhost:${PORT}/`);
      logInfo(`🛡️  Security: Helmet, CORS, Rate Limiting enabled`);
      logInfo(`📊 Monitoring: Sentry ${process.env.SENTRY_DSN ? 'enabled' : 'disabled'}`);
    });
  } catch (error) {
    logError('❌ Failed to start server:', error as Error);
    Sentry.captureException(error);
    process.exit(1);
  }
}

startServer();
