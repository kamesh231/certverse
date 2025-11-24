import { supabase, Response } from '../lib/supabase';
import { getQuestionById } from './get-question';

export interface SubmitAnswerRequest {
  userId: string;
  questionId: string;
  selectedChoice: 'A' | 'B' | 'C' | 'D';
}

export interface SubmitAnswerResponse {
  success: boolean;
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  responseId?: string;
  error?: string;
}

/**
 * Submits a user's answer to a question
 * Validates the answer, saves the response, and returns feedback
 */
export async function submitAnswer(
  request: SubmitAnswerRequest
): Promise<SubmitAnswerResponse> {
  try {
    const { userId, questionId, selectedChoice } = request;

    // Validate input
    if (!userId || !questionId || !selectedChoice) {
      return {
        success: false,
        correct: false,
        correctAnswer: '',
        explanation: '',
        error: 'Missing required fields: userId, questionId, or selectedChoice'
      };
    }

    if (!['A', 'B', 'C', 'D'].includes(selectedChoice)) {
      return {
        success: false,
        correct: false,
        correctAnswer: '',
        explanation: '',
        error: 'Invalid choice. Must be A, B, C, or D'
      };
    }

    // Step 1: Fetch the question to get correct answer
    const question = await getQuestionById(questionId);

    if (!question) {
      return {
        success: false,
        correct: false,
        correctAnswer: '',
        explanation: '',
        error: 'Question not found'
      };
    }

    // Step 2: Check if answer is correct
    const isCorrect = selectedChoice === question.answer;

    // Step 3: Check if user already answered this question
    const { data: existingResponse, error: checkError } = await supabase
      .from('responses')
      .select('id')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing response:', checkError);
    }

    // If user already answered, don't save again (prevent duplicates)
    if (existingResponse) {
      return {
        success: true,
        correct: isCorrect,
        correctAnswer: question.answer,
        explanation: question.explanation || '',
        responseId: existingResponse.id,
        error: 'Question already answered previously'
      };
    }

    // Step 4: Save response to database
    const { data: savedResponse, error: saveError } = await supabase
      .from('responses')
      .insert({
        user_id: userId,
        question_id: questionId,
        selected_choice: selectedChoice,
        correct: isCorrect
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving response:', saveError);
      return {
        success: false,
        correct: isCorrect,
        correctAnswer: question.answer,
        explanation: question.explanation || '',
        error: 'Failed to save response to database'
      };
    }

    // Step 5: Return success response
    return {
      success: true,
      correct: isCorrect,
      correctAnswer: question.answer,
      explanation: question.explanation || '',
      responseId: savedResponse.id
    };
  } catch (error) {
    console.error('Error in submitAnswer:', error);
    return {
      success: false,
      correct: false,
      correctAnswer: '',
      explanation: '',
      error: 'Internal server error'
    };
  }
}

/**
 * Get user's answer history
 */
export async function getUserResponses(userId: string, limit: number = 10): Promise<Response[]> {
  try {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user responses:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserResponses:', error);
    return [];
  }
}

/**
 * Get user's accuracy statistics
 */
export async function getUserStats(userId: string): Promise<{
  totalAnswered: number;
  totalCorrect: number;
  accuracy: number;
}> {
  try {
    const { data, error } = await supabase
      .from('responses')
      .select('correct')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user stats:', error);
      return { totalAnswered: 0, totalCorrect: 0, accuracy: 0 };
    }

    const totalAnswered = data?.length || 0;
    const totalCorrect = data?.filter(r => r.correct).length || 0;
    const accuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;

    return {
      totalAnswered,
      totalCorrect,
      accuracy: Math.round(accuracy * 100) / 100 // Round to 2 decimal places
    };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return { totalAnswered: 0, totalCorrect: 0, accuracy: 0 };
  }
}
