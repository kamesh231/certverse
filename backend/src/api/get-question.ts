import { supabase, Question } from '../lib/supabase';

/**
 * Fetches a random question that the user hasn't answered yet
 * If all questions are answered, returns a random question from the entire pool
 */
export async function getRandomQuestion(userId: string): Promise<Question | null> {
  try {
    // Step 1: Get all question IDs the user has already answered
    const { data: answeredResponses, error: responseError } = await supabase
      .from('responses')
      .select('question_id')
      .eq('user_id', userId);

    if (responseError) {
      console.error('Error fetching user responses:', responseError);
      throw new Error('Failed to fetch user responses');
    }

    const answeredQuestionIds = answeredResponses?.map(r => r.question_id) || [];

    // Step 2: Try to get a question the user hasn't answered yet
    let query = supabase
      .from('questions')
      .select('*');

    // If user has answered some questions, exclude them
    if (answeredQuestionIds.length > 0) {
      query = query.not('id', 'in', `(${answeredQuestionIds.join(',')})`);
    }

    const { data: unansweredQuestions, error: questionError } = await query;

    if (questionError) {
      console.error('Error fetching questions:', questionError);
      throw new Error('Failed to fetch questions');
    }

    // Step 3: If there are unanswered questions, pick one randomly
    if (unansweredQuestions && unansweredQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
      return unansweredQuestions[randomIndex];
    }

    // Step 4: If all questions answered, get any random question
    const { data: allQuestions, error: allQuestionsError } = await supabase
      .from('questions')
      .select('*');

    if (allQuestionsError) {
      console.error('Error fetching all questions:', allQuestionsError);
      throw new Error('Failed to fetch questions');
    }

    if (allQuestions && allQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * allQuestions.length);
      return allQuestions[randomIndex];
    }

    // No questions in database
    return null;
  } catch (error) {
    console.error('Error in getRandomQuestion:', error);
    throw error;
  }
}

/**
 * Get question by ID (for testing/debugging)
 */
export async function getQuestionById(questionId: string): Promise<Question | null> {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error) {
      console.error('Error fetching question by ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getQuestionById:', error);
    return null;
  }
}

/**
 * Get total question count
 */
export async function getQuestionCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error counting questions:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getQuestionCount:', error);
    return 0;
  }
}
