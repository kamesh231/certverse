// API client for Certverse backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Helper function to get Clerk JWT token
 * This should be called from client components using useAuth hook
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    // This will be called from components that have access to useAuth
    // We'll pass the token as a parameter to API functions
    return null; // Placeholder - token will be passed from components
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

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
  isReviewMode?: boolean;
  userPreviousResponse?: {
    selectedChoice: string;
    wasCorrect: boolean;
    answeredAt: string;
  };
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

export interface DomainPerformance {
  domain: number;
  score: number;
  total: number;
  correct: number;
}

export interface EnhancedUserStats extends UserStats {
  currentStreak: number;
  longestStreak: number;
  questionsToday: number;
  domainPerformance: DomainPerformance[];
  overallReadiness: number;
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
 * @param userId - User ID
 * @param userEmail - User email (required for watermarking)
 * @param domain - Optional domain number (1-5) to filter questions
 * @param reviewFilter - Optional review filter: 'all', 'correct', or 'incorrect'
 * @param token - Clerk JWT token (required for authentication)
 */
export async function fetchQuestion(
  userId: string,
  userEmail: string,
  domain?: number,
  reviewFilter?: 'all' | 'correct' | 'incorrect',
  token?: string | null
): Promise<Question> {
  try {
    const url = new URL(`${API_URL}/api/question`);
    url.searchParams.set('userEmail', userEmail);
    if (domain !== undefined && domain >= 1 && domain <= 5) {
      url.searchParams.set('domain', domain.toString());
    }
    if (reviewFilter) {
      url.searchParams.set('reviewFilter', reviewFilter);
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      // Preserve the detailed message for limit errors
      const errorMessage = error.message || error.error || 'Failed to fetch question';
      const limitError = new Error(errorMessage);
      // Attach error details for better handling
      (limitError as any).status = response.status;
      (limitError as any).remaining = error.remaining;
      (limitError as any).resetsAt = error.resetsAt; // Include reset time
      throw limitError;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching question:', error);
    throw error;
  }
}

/**
 * Submit an answer to a question
 * @param userId - User ID (deprecated, will be extracted from token)
 * @param questionId - Question ID
 * @param selectedChoice - Selected answer choice
 * @param token - Clerk JWT token (required for authentication)
 */
export async function submitAnswer(
  userId: string,
  questionId: string,
  selectedChoice: 'A' | 'B' | 'C' | 'D',
  token?: string | null
): Promise<SubmitAnswerResponse> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/submit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
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
 * @param userId - User ID (deprecated, will be extracted from token)
 * @param token - Clerk JWT token (required for authentication)
 */
export async function getUserStats(userId: string, token?: string | null): Promise<UserStats> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/stats`, {
      method: 'GET',
      headers,
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
 * @param userId - User ID (deprecated, will be extracted from token)
 * @param limit - Maximum number of responses to return
 * @param token - Clerk JWT token (required for authentication)
 */
export async function getUserHistory(
  userId: string,
  limit: number = 10,
  token?: string | null
): Promise<UserResponse[]> {
  try {
    const url = new URL(`${API_URL}/api/history`);
    url.searchParams.set('limit', limit.toString());

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

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
 * Get count of incorrect answers for a user
 * @param userId - User ID (deprecated, will be extracted from token)
 * @param token - Clerk JWT token (required for authentication)
 */
export async function getIncorrectAnswersCount(
  userId: string,
  token?: string | null
): Promise<number> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const history = await getUserHistory(userId, 100, token);
    
    // Get unique incorrect question IDs
    const incorrectQuestionIds = new Set(
      history
        .filter(response => !response.correct)
        .map(response => response.question_id)
    );

    return incorrectQuestionIds.size;
  } catch (error) {
    console.error('Error fetching incorrect answers count:', error);
    return 0;
  }
}

/**
 * Get counts of all answered questions by type
 * @param userId - User ID (deprecated, will be extracted from token)
 * @param token - Clerk JWT token (required for authentication)
 */
export async function getReviewCounts(
  userId: string,
  token?: string | null
): Promise<{
  total: number;
  correct: number;
  incorrect: number;
}> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const history = await getUserHistory(userId, 100, token);
    
    // Group responses by question_id and get most recent response for each
    const latestResponsesByQuestion = new Map<string, UserResponse>();
    
    // History is already sorted by created_at desc, so first occurrence is most recent
    history.forEach(response => {
      if (!latestResponsesByQuestion.has(response.question_id)) {
        latestResponsesByQuestion.set(response.question_id, response);
      }
    });
    
    // Count based on most recent attempt for each question
    let correctCount = 0;
    let incorrectCount = 0;
    
    latestResponsesByQuestion.forEach(response => {
      if (response.correct) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    return {
      total: latestResponsesByQuestion.size,
      correct: correctCount,
      incorrect: incorrectCount,
    };
  } catch (error) {
    console.error('Error fetching review counts:', error);
    return {
      total: 0,
      correct: 0,
      incorrect: 0,
    };
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
 * @param userId - User ID (deprecated, will be extracted from token)
 * @param token - Clerk JWT token (required for authentication)
 */
export async function getRemainingQuestions(userId: string, token?: string | null): Promise<UnlockStatus> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/unlock/remaining`, {
      method: 'GET',
      headers,
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
 * @param userId - User ID (deprecated, will be extracted from token)
 * @param token - Clerk JWT token (required for authentication)
 */
export async function getEnhancedUserStats(userId: string, token?: string | null): Promise<EnhancedUserStats> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/stats/enhanced`, {
      method: 'GET',
      headers,
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
 * @param userId - User ID (deprecated, will be extracted from token)
 * @param token - Clerk JWT token (required for authentication)
 */
export async function getUserSubscription(userId: string, token?: string | null): Promise<Subscription> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/subscription`, {
      method: 'GET',
      headers,
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
 * @param userId - User ID (deprecated, will be extracted from token)
 * @param userEmail - User email
 * @param token - Clerk JWT token (required for authentication)
 */
export async function createCheckoutUrl(userId: string, userEmail: string, token?: string | null): Promise<string> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/checkout/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userEmail }),
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

/**
 * Get Polar customer portal URL for managing subscription
 * @param userId - User ID (deprecated, will be extracted from token)
 * @param token - Clerk JWT token (required for authentication)
 */
export async function getCustomerPortalUrl(userId: string, token?: string | null): Promise<string> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/subscription/portal-url`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to get customer portal URL');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error getting customer portal URL:', error);
    throw error;
  }
}
