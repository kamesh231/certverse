import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import logger from '../lib/logger';

export async function getQuestion(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.query.userId as string;
    const domain = req.query.domain as string | undefined;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
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

    res.json({
      id: randomQuestion.id,
      domain: randomQuestion.domain,
      q_text: randomQuestion.q_text,
      choice_a: randomQuestion.choice_a,
      choice_b: randomQuestion.choice_b,
      choice_c: randomQuestion.choice_c,
      choice_d: randomQuestion.choice_d,
    });
  } catch (error) {
    logger.error('Error in getQuestion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
