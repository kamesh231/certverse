import { supabase } from '../lib/supabase';
import { getUserSubscription } from './subscriptionService';
import logger from '../lib/logger';

export interface UserStats {
  id: string;
  user_id: string;
  total_questions_attempted: number;
  correct_answers: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  questions_unlocked_today: number;
  last_unlock_reset: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get or create user stats
 */
export async function getUserStatsRecord(userId: string): Promise<UserStats> {
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      logger.error('Error fetching user stats:', error);
      throw new Error('Failed to fetch user stats');
    }

    if (data) {
      return data as UserStats;
    }

    // Create new stats record for new user
    const { data: newStats, error: createError } = await supabase
      .from('user_stats')
      .insert({
        user_id: userId,
        total_questions_attempted: 0,
        correct_answers: 0,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
        questions_unlocked_today: 5,
        last_unlock_reset: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      logger.error('Error creating user stats:', createError);
      throw new Error('Failed to create user stats');
    }

    return newStats as UserStats;
  } catch (error) {
    logger.error('Error in getUserStatsRecord:', error);
    throw error;
  }
}

/**
 * Get remaining questions for today
 */
export async function getRemainingQuestions(userId: string): Promise<number> {
  try {
    const dailyLimit = await calculateDailyUnlock(userId);

    // Get today's question count
    const today = new Date().toISOString().split('T')[0];

    const { data: responses, error } = await supabase
      .from('responses')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00Z`)
      .lt('created_at', `${today}T23:59:59Z`);

    if (error) {
      logger.error('Error getting question count:', error);
      return dailyLimit;
    }

    const questionsUsed = responses?.length || 0;
    const remaining = Math.max(0, dailyLimit - questionsUsed);

    return remaining;
  } catch (error) {
    logger.error('Error in getRemainingQuestions:', error);
    return 0;
  }
}

/**
 * Calculate daily unlock based on subscription
 */
async function calculateDailyUnlock(userId: string): Promise<number> {
  const subscription = await getUserSubscription(userId);

  if (subscription.plan_type === 'paid' && subscription.status === 'active') {
    return 999; // Unlimited for paid users
  }

  return 2; // Free users get 2 questions per day
}

/**
 * Update user stats after answering a question
 */
export async function updateStatsAfterAnswer(
  userId: string,
  isCorrect: boolean
): Promise<void> {
  try {
    const stats = await getUserStatsRecord(userId);
    const today = new Date().toISOString().split('T')[0];
    const lastActivityDate = stats.last_activity_date;

    // Calculate streak
    let newStreak = stats.current_streak;
    if (!lastActivityDate) {
      // First activity ever
      newStreak = 1;
    } else {
      const daysDiff = daysBetween(lastActivityDate, today);
      if (daysDiff === 1) {
        // Consecutive day
        newStreak = stats.current_streak + 1;
      } else if (daysDiff === 0) {
        // Same day, keep streak
        newStreak = stats.current_streak || 1;
      } else {
        // Missed days, reset streak to 0 (Snapchat-style: habit broken)
        newStreak = 0;
      }
    }

    // Update stats
    const { error } = await supabase
      .from('user_stats')
      .update({
        total_questions_attempted: stats.total_questions_attempted + 1,
        correct_answers: stats.correct_answers + (isCorrect ? 1 : 0),
        current_streak: newStreak,
        longest_streak: Math.max(stats.longest_streak, newStreak),
        last_activity_date: today,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      logger.error('Error updating stats:', error);
      throw error;
    }

    logger.info(`Updated stats for user ${userId}: streak=${newStreak}, total=${stats.total_questions_attempted + 1}`);
  } catch (error) {
    logger.error('Error in updateStatsAfterAnswer:', error);
    throw error;
  }
}

/**
 * Helper: Calculate days between two dates
 */
function daysBetween(date1Str: string, date2Str: string): number {
  const d1 = new Date(date1Str);
  const d2 = new Date(date2Str);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
