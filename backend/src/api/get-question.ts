import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import logger from '../lib/logger';
import { applyWatermark, logQuestionAccess, getClientIp } from '../services/watermarkService';
import { getRemainingQuestions } from '../services/unlockService';

export async function getQuestion(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId; // From verified JWT
    const userEmail = req.query.userEmail as string | undefined;
    const domain = req.query.domain as string | undefined;
    
    // Support both new reviewFilter and legacy incorrectOnly parameters
    const reviewFilterParam = req.query.reviewFilter as 'all' | 'correct' | 'incorrect' | undefined;
    const incorrectOnlyParam = req.query.incorrectOnly === 'true' || req.query.incorrectOnly === '1';
    
    // Determine effective review filter (reviewFilter takes precedence)
    const reviewFilter = reviewFilterParam || (incorrectOnlyParam ? 'incorrect' : undefined);

    if (!userEmail) {
      res.status(400).json({ error: 'userEmail is required for watermarking' });
      return;
    }

    // Check remaining questions before fetching (skip check for review mode)
    if (!reviewFilter) {
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
    }

    let questionIds: string[] = [];

    // If review mode, get question IDs based on filter
    if (reviewFilter) {
      let responsesQuery = supabase
        .from('responses')
        .select('question_id, correct')
        .eq('user_id', userId);

      // Filter by correct/incorrect if specified
      if (reviewFilter === 'incorrect') {
        responsesQuery = responsesQuery.eq('correct', false);
      } else if (reviewFilter === 'correct') {
        responsesQuery = responsesQuery.eq('correct', true);
      }
      // If 'all', don't filter by correct field

      const { data: responses, error: responseError } = await responsesQuery;

      if (responseError) {
        logger.error('Error fetching user responses:', responseError);
        res.status(500).json({ error: 'Failed to fetch user responses' });
        return;
      }

      if (!responses || responses.length === 0) {
        const message = reviewFilter === 'incorrect' 
          ? 'You haven\'t answered any questions incorrectly yet. Keep practicing!'
          : reviewFilter === 'correct'
          ? 'You haven\'t answered any questions correctly yet. Keep practicing!'
          : 'You haven\'t answered any questions yet. Start practicing!';
        
        res.status(404).json({ 
          error: 'No answers found',
          message
        });
        return;
      }

      // Get unique question IDs
      questionIds = [...new Set(responses.map(r => r.question_id))];
    }

    // Build query with optional filters
    let query = supabase
      .from('questions')
      .select('*');

    // Filter by question IDs if in review mode
    if (reviewFilter && questionIds.length > 0) {
      query = query.in('id', questionIds);
    }

    // Filter by domain if provided
    if (domain) {
      const domainNum = parseInt(domain, 10);
      if (!isNaN(domainNum) && domainNum >= 1 && domainNum <= 5) {
        query = query.eq('domain', domainNum);
      }
    }

    // Filter by difficulty if provided (for adaptive questioning)
    const difficulty = req.query.difficulty as string | undefined;
    if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      query = query.eq('difficulty', difficulty);
    }

    // Get questions (limit to 50 for performance)
    const { data: questions, error } = await query.limit(50);

    if (error) {
      logger.error('Error fetching questions:', error);
      res.status(500).json({ error: 'Failed to fetch question' });
      return;
    }

    if (!questions || questions.length === 0) {
      const message = reviewFilter
        ? 'No answers found for the selected criteria'
        : 'No questions available';
      res.status(404).json({ error: message });
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

    // If in review mode, include user's previous response
    let userPreviousResponse = null;
    if (reviewFilter) {
      const { data: previousResponses } = await supabase
        .from('responses')
        .select('*')
        .eq('user_id', userId)
        .eq('question_id', randomQuestion.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (previousResponses && previousResponses.length > 0) {
        userPreviousResponse = {
          selectedChoice: previousResponses[0].selected_choice,
          wasCorrect: previousResponses[0].correct,
          answeredAt: previousResponses[0].created_at,
        };
      }
    }

    const responseData: any = {
      id: watermarkedQuestion.id,
      domain: randomQuestion.domain,
      q_text: watermarkedQuestion.q_text,
      choice_a: watermarkedQuestion.choice_a,
      choice_b: watermarkedQuestion.choice_b,
      choice_c: watermarkedQuestion.choice_c,
      choice_d: watermarkedQuestion.choice_d,
      answer: randomQuestion.answer,
      explanation: randomQuestion.explanation,
    };

    // Include previous response data if in review mode
    if (reviewFilter && userPreviousResponse) {
      responseData.userPreviousResponse = userPreviousResponse;
      responseData.isReviewMode = true;
    }

    res.json(responseData);
  } catch (error) {
    logger.error('Error in getQuestion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
