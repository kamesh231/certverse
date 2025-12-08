import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import logger from '../lib/logger';
import { applyWatermark, logQuestionAccess, getClientIp } from '../services/watermarkService';
import { getRemainingQuestions } from '../services/unlockService';

export async function getQuestion(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.query.userId as string;
    const userEmail = req.query.userEmail as string | undefined;
    const domain = req.query.domain as string | undefined;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    if (!userEmail) {
      res.status(400).json({ error: 'userEmail is required for watermarking' });
      return;
    }

    // Check remaining questions before fetching
    const remaining = await getRemainingQuestions(userId);
    if (remaining <= 0) {
      // Calculate reset time (midnight tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      res.status(403).json({ 
        error: 'Daily question limit reached',
        message: 'You have reached your daily limit of 2 questions. Upgrade to Premium for unlimited access.',
        remaining: 0,
        resetsAt: tomorrow.toISOString()
      });
      return;
    }

    // Build query with optional domain filter
    let query = supabase
      .from('questions')
      .select('*');

    // Filter by domain if provided
    if (domain) {
      const domainNum = parseInt(domain, 10);
      if (!isNaN(domainNum) && domainNum >= 1 && domainNum <= 5) {
        query = query.eq('domain', domainNum);
      }
    }

    // Get questions (limit to 50 for performance)
    const { data: questions, error } = await query.limit(50);

    if (error) {
      logger.error('Error fetching questions:', error);
      res.status(500).json({ error: 'Failed to fetch question' });
      return;
    }

    if (!questions || questions.length === 0) {
      res.status(404).json({ error: 'No questions available' });
      return;
    }

    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

    // Log question access for audit trail
    const ipAddress = getClientIp(req);
    await logQuestionAccess(userId, randomQuestion.id, userEmail, ipAddress);

    // Apply watermark to question text and choices
    const watermarkedQuestion = applyWatermark(
      {
        id: randomQuestion.id,
        q_text: randomQuestion.q_text,
        choice_a: randomQuestion.choice_a,
        choice_b: randomQuestion.choice_b,
        choice_c: randomQuestion.choice_c,
        choice_d: randomQuestion.choice_d,
      },
      userId,
      userEmail
    );

    res.json({
      id: watermarkedQuestion.id,
      domain: randomQuestion.domain,
      q_text: watermarkedQuestion.q_text,
      choice_a: watermarkedQuestion.choice_a,
      choice_b: watermarkedQuestion.choice_b,
      choice_c: watermarkedQuestion.choice_c,
      choice_d: watermarkedQuestion.choice_d,
    });
  } catch (error) {
    logger.error('Error in getQuestion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
