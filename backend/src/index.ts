import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkConnection } from './lib/supabase';
import { getRandomQuestion, getQuestionCount } from './api/get-question';
import { submitAnswer, getUserResponses, getUserStats } from './api/submit-answer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ============================================
// MIDDLEWARE
// ============================================

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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
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
      history: 'GET /api/history?userId=xxx'
    }
  });
});

// Get random question for user
app.get('/api/question', async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error in /api/question:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Submit answer
app.post('/api/submit', async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error in /api/submit:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get user statistics
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId parameter'
      });
    }

    const stats = await getUserStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error in /api/stats:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get user answer history
app.get('/api/history', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId parameter'
      });
    }

    const history = await getUserResponses(userId, limit);
    res.json(history);
  } catch (error) {
    console.error('Error in /api/history:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get question count (for admin/debugging)
app.get('/api/question-count', async (req: Request, res: Response) => {
  try {
    const count = await getQuestionCount();
    res.json({ count });
  } catch (error) {
    console.error('Error in /api/question-count:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path
  });
});

// ============================================
// SERVER START
// ============================================

async function startServer() {
  try {
    // Check database connection before starting
    console.log('🔍 Checking database connection...');
    const isConnected = await checkConnection();

    if (!isConnected) {
      console.error('❌ Failed to connect to Supabase. Check your credentials.');
      process.exit(1);
    }

    console.log('✅ Database connected successfully');

    // Get question count
    const questionCount = await getQuestionCount();
    console.log(`📝 Questions in database: ${questionCount}`);

    if (questionCount === 0) {
      console.warn('⚠️  No questions found. Run: npm run seed');
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Certverse API running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API docs: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
