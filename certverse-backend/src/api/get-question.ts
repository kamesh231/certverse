import { Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';

export async function getQuestion(req: Request, res: Response): Promise<void> {
  try {
    // Fetch all questions to get a random one
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*');

    if (error) {
      console.error('Error fetching question:', error);
      res.status(500).json({ error: 'Failed to fetch question', details: error.message });
      return;
    }

    if (!questions || questions.length === 0) {
      res.status(404).json({ error: 'No questions found' });
      return;
    }

    // Get random question
    const randomIndex = Math.floor(Math.random() * questions.length);
    const question = questions[randomIndex];

    // Remove correct answer from response
    const { correct_answer, ...questionWithoutAnswer } = question;

    res.json({
      id: questionWithoutAnswer.id,
      question: questionWithoutAnswer.question,
      options: questionWithoutAnswer.options,
      domain: questionWithoutAnswer.domain,
      difficulty: questionWithoutAnswer.difficulty
    });
  } catch (error) {
    console.error('Unexpected error in getQuestion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

