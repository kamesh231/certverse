import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { isPaidUser } from '../services/subscriptionService';
import { updateStatsAfterAnswer } from '../services/unlockService';
import logger from '../lib/logger';

export async function submitAnswer(req: Request, res: Response): Promise<void> {
  try {
    const { userId, questionId, selectedAnswer, selectedChoice } = req.body;
    const answer = selectedAnswer || selectedChoice; // Support both field names

    if (!userId || !questionId || !answer) {
      res.status(400).json({ error: 'userId, questionId, and selectedAnswer/selectedChoice are required' });
      return;
    }

    // Get the question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      logger.error('Error fetching question:', questionError);
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    const isCorrect = answer === question.answer;

    // Save response
    const { data: savedResponse, error: saveError } = await supabase
      .from('responses')
      .insert({
        user_id: userId,
        question_id: questionId,
        selected_choice: answer,
        correct: isCorrect,
      })
      .select()
      .single();

    if (saveError) {
      logger.error('Error saving response:', saveError);
      res.status(500).json({ error: 'Failed to save response' });
      return;
    }

    // Update user stats (streak, total attempted, correct answers)
    await updateStatsAfterAnswer(userId, isCorrect);

    // Check if user is paid to show explanation
    const userIsPaid = await isPaidUser(userId);

    res.json({
      success: true,
      correct: isCorrect,
      correctAnswer: question.answer,
      explanation: userIsPaid
        ? (question.explanation || '')
        : '⭐ Upgrade to Premium to see detailed explanations',
      responseId: savedResponse.id,
    });
  } catch (error) {
    logger.error('Error in submitAnswer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
