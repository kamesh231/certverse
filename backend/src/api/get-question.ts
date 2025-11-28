import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import logger from '../lib/logger';

export async function getQuestion(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    // Get a random question
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .limit(50);

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
