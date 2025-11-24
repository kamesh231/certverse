import { Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';

interface SubmitAnswerRequest {
  questionId: string;
  userAnswer: string;
  userId?: string;
}

export async function submitAnswer(req: Request, res: Response): Promise<void> {
  try {
    const { questionId, userAnswer, userId } = req.body as SubmitAnswerRequest;

    if (!questionId || !userAnswer) {
      res.status(400).json({ error: 'Missing required fields: questionId and userAnswer' });
      return;
    }

    // Fetch the question to get the correct answer
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('correct_answer')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    const isCorrect = userAnswer === question.correct_answer;

    // Save the user response
    const { data: response, error: responseError } = await supabase
      .from('user_responses')
      .insert({
        question_id: questionId,
        user_answer: userAnswer,
        is_correct: isCorrect,
        user_id: userId || null,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (responseError) {
      console.error('Error saving response:', responseError);
      res.status(500).json({ error: 'Failed to save response', details: responseError.message });
      return;
    }

    res.json({
      success: true,
      isCorrect,
      correctAnswer: question.correct_answer,
      responseId: response.id
    });
  } catch (error) {
    console.error('Unexpected error in submitAnswer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

