// API client for Certverse backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Types matching backend
export interface Question {
  id: string;
  domain: number;
  q_text: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
  explanation: string;
  created_at: string;
}

export interface SubmitAnswerResponse {
  success: boolean;
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  responseId?: string;
  error?: string;
}

export interface UserStats {
  totalAnswered: number;
  totalCorrect: number;
  accuracy: number;
}

export interface UserResponse {
  id: string;
  user_id: string;
  question_id: string;
  selected_choice: string;
  correct: boolean;
  created_at: string;
}

/**
 * Fetch a random question for the user
 */
export async function fetchQuestion(userId: string): Promise<Question> {
  try {
    const response = await fetch(`${API_URL}/api/question?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch question');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching question:', error);
    throw error;
  }
}

/**
 * Submit an answer to a question
 */
export async function submitAnswer(
  userId: string,
  questionId: string,
  selectedChoice: 'A' | 'B' | 'C' | 'D'
): Promise<SubmitAnswerResponse> {
  try {
    const response = await fetch(`${API_URL}/api/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        questionId,
        selectedChoice,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit answer');
    }

    return response.json();
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    const response = await fetch(`${API_URL}/api/stats?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch stats');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
}

/**
 * Get user answer history
 */
export async function getUserHistory(
  userId: string,
  limit: number = 10
): Promise<UserResponse[]> {
  try {
    const response = await fetch(
      `${API_URL}/api/history?userId=${userId}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch history');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
}

/**
 * Get total question count
 */
export async function getQuestionCount(): Promise<number> {
  try {
    const response = await fetch(`${API_URL}/api/question-count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch question count');
    }

    const data = await response.json();
    return data.count;
  } catch (error) {
    console.error('Error fetching question count:', error);
    return 0;
  }
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{
  status: string;
  database: string;
}> {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'error', database: 'disconnected' };
  }
}
