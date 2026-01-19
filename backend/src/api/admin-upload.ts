import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import logger from '../lib/logger';
import { verifyAuth } from '../middleware/verifyAuth';
import { z } from 'zod';

const router = Router();

/**
 * GET /api/admin/check
 * Check if current user is an admin
 * Returns: { isAdmin: boolean, email: string }
 */
router.get('/check', verifyAuth, async (req: Request, res: Response) => {
  const userEmail = (req as any).userEmail;
  
  if (!userEmail) {
    return res.json({ isAdmin: false, email: null });
  }
  
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  const isAdmin = adminEmails.includes(userEmail);
  
  res.json({ 
    isAdmin,
    email: userEmail 
  });
});

const questionSchema = z.object({
  question_id: z.string().optional(),
  domain: z.number().min(1).max(5),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  topic: z.string().optional(),
  q_text: z.string().min(10),
  choice_a: z.string().min(1),
  choice_b: z.string().min(1),
  choice_c: z.string().min(1),
  choice_d: z.string().min(1),
  answer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().min(20),
  reasoning: z.string().optional(),
  incorrect_rationale: z.string().optional(),
  enhanced_reasoning: z.string().optional(),
});

/**
 * Middleware to check admin role
 * Checks if user email is in ADMIN_EMAILS environment variable
 * Or if user has admin role in Clerk public metadata
 */
const verifyAdmin = (req: Request, res: Response, next: Function) => {
  const userId = (req as any).userId;
  const userEmail = (req as any).userEmail;
  
  logger.info(`Admin check for user: ${userEmail} (userId: ${userId})`);
  
  // Check if email was successfully extracted
  if (!userEmail) {
    logger.error(`No email found for user ${userId}. Check Clerk configuration.`);
    return res.status(403).json({ 
      error: 'Forbidden: Could not verify email address',
      details: 'Your account does not have an email address associated with it.'
    });
  }
  
  // Check if user email is in admin list
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  
  if (adminEmails.length === 0) {
    logger.error('ADMIN_EMAILS environment variable is not set!');
    return res.status(403).json({ 
      error: 'Forbidden: Admin access not configured',
      details: 'Contact system administrator to configure admin access.'
    });
  }
  
  if (!adminEmails.includes(userEmail)) {
    logger.warn(`Access denied: ${userEmail} is not in admin list. Configured admins: ${adminEmails.join(', ')}`);
    return res.status(403).json({ 
      error: 'Forbidden: Admin access required',
      details: `Your email (${userEmail}) is not authorized for admin access.`
    });
  }
  
  logger.info(`Admin access granted for: ${userEmail}`);
  next();
};

/**
 * POST /api/admin/upload-questions
 * Upload multiple questions to database
 * Requires admin role
 */
router.post('/upload-questions', verifyAuth, verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { questions } = req.body;
    const userEmail = (req as any).userEmail;
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Invalid questions array' });
    }

    logger.info(`Admin ${userEmail} uploading ${questions.length} questions`);

    // Validate all questions
    const validatedQuestions = [];
    const validationErrors = [];

    for (let i = 0; i < questions.length; i++) {
      try {
        const validated = questionSchema.parse(questions[i]);
        validatedQuestions.push(validated);
      } catch (error: any) {
        logger.error(`Validation failed for question ${i}:`, error);
        validationErrors.push({
          index: i,
          question: questions[i]?.q_text?.substring(0, 50) || 'Unknown',
          error: error.errors?.[0]?.message || 'Validation failed'
        });
      }
    }

    if (validatedQuestions.length === 0) {
      return res.status(400).json({ 
        error: 'No valid questions to insert',
        validationErrors 
      });
    }

    logger.info(`Validated ${validatedQuestions.length}/${questions.length} questions`);

    // Insert questions in batches of 100
    const batchSize = 100;
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < validatedQuestions.length; i += batchSize) {
      const batch = validatedQuestions.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('questions')
        .insert(batch)
        .select();

      if (error) {
        logger.error(`Failed to insert batch ${i / batchSize + 1}:`, error);
        failedCount += batch.length;
      } else {
        successCount += data?.length || 0;
        logger.info(`Successfully inserted batch ${i / batchSize + 1}: ${data?.length} questions`);
      }
    }

    logger.info(`Upload complete: ${successCount} success, ${failedCount} failed`);

    res.json({
      success: successCount,
      failed: failedCount + validationErrors.length,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
    });

  } catch (error) {
    logger.error('Upload questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/stats
 * Get statistics about questions in database
 * Requires admin role
 */
router.get('/stats', verifyAuth, verifyAdmin, async (req: Request, res: Response) => {
  try {
    // Get total count
    const { count: totalCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });

    // Get count by domain
    const { data: domainCounts } = await supabase
      .from('questions')
      .select('domain')
      .then(({ data }) => {
        const counts: Record<number, number> = {};
        data?.forEach(q => {
          counts[q.domain] = (counts[q.domain] || 0) + 1;
        });
        return { data: counts };
      });

    // Get count by difficulty
    const { data: difficultyCounts } = await supabase
      .from('questions')
      .select('difficulty')
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        data?.forEach(q => {
          if (q.difficulty) {
            counts[q.difficulty] = (counts[q.difficulty] || 0) + 1;
          }
        });
        return { data: counts };
      });

    res.json({
      total: totalCount || 0,
      byDomain: domainCounts,
      byDifficulty: difficultyCounts,
    });

  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
