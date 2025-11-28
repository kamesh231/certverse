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

export interface EnhancedUserStats extends UserStats {
  currentStreak: number;
  longestStreak: number;
  questionsToday: number;
}

export interface UnlockStatus {
  remaining: number;
  total: number;
  resetsAt: string;
  streak: number;
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

/**
 * Get remaining questions for today (Week 3 feature)
 */
export async function getRemainingQuestions(userId: string): Promise<UnlockStatus> {
  try {
    const response = await fetch(`${API_URL}/api/unlock/remaining?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch unlock status');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching unlock status:', error);
    throw error;
  }
}

/**
 * Get enhanced user statistics (includes streak - Week 3 feature)
 */
export async function getEnhancedUserStats(userId: string): Promise<EnhancedUserStats> {
  try {
    const response = await fetch(`${API_URL}/api/stats/enhanced?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch enhanced stats');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching enhanced stats:', error);
    throw error;
  }
}

// ============================================
// SUBSCRIPTION API (Week 4 - Polar.sh)
// ============================================

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'paid' | 'coach';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  polar_customer_id: string | null;
  polar_subscription_id: string | null;
  polar_product_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  started_at: string | null;
  created_at: string;
  updated_at: string;
  is_paid: boolean;
}

/**
 * Get user's subscription status
 */
export async function getUserSubscription(userId: string): Promise<Subscription> {
  try {
    const response = await fetch(`${API_URL}/api/subscription?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch subscription');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching subscription:', error);
    // Return free plan as fallback
    return {
      id: '',
      user_id: userId,
      plan_type: 'free',
      status: 'active',
      polar_customer_id: null,
      polar_subscription_id: null,
      polar_product_id: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at: null,
      canceled_at: null,
      started_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_paid: false
    };
  }
}

/**
 * Create Polar checkout URL
 */
export async function createCheckoutUrl(userId: string, userEmail: string): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/api/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, userEmail }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw error;
  }
}
