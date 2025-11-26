import { supabase } from '../lib/supabase';

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

export interface UnlockStatus {
  remaining: number;
  total: number;
  resetsAt: string;
  streak: number;
}

/**
 * Get or create user stats record
 * Creates a new record with defaults if user doesn't have stats yet
 */
export async function getUserStatsRecord(userId: string): Promise<UserStats> {
  try {
    // Try to get existing stats
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user stats:', error);
      throw new Error('Failed to fetch user stats');
    }

    // If stats exist, return them
    if (data) {
      return data as UserStats;
    }

    // Create new stats record for first-time user
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
      console.error('Error creating user stats:', createError);
      throw new Error('Failed to create user stats');
    }

    return newStats as UserStats;
  } catch (error) {
    console.error('Error in getUserStatsRecord:', error);
    throw error;
  }
}

/**
 * Check if unlock needs to be reset (daily reset at midnight UTC)
 */
function shouldResetUnlock(lastResetISO: string): boolean {
  const lastReset = new Date(lastResetISO);
  const now = new Date();

  // Compare UTC dates only (ignore time)
  const lastResetDate = Date.UTC(
    lastReset.getUTCFullYear(),
    lastReset.getUTCMonth(),
    lastReset.getUTCDate()
  );

  const nowDate = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  // Reset if we're on a different UTC day
  return lastResetDate !== nowDate;
}

/**
 * Calculate daily unlock count
 * For Week 3: Always 5 questions/day
 * For Week 5: Will be dynamic based on exam date
 */
function calculateDailyUnlock(userId: string): number {
  // Simple version for Week 3
  return 5;

  // Future (Week 5) - dynamic based on exam date:
  // const prefs = await getUserPreferences(userId);
  // const daysLeft = daysBetween(new Date(), prefs.exam_date);
  // const remaining = 500 - stats.total_questions_attempted;
  // return clamp(Math.ceil(remaining / daysLeft), 3, 20);
}

/**
 * Get start of today in UTC as ISO string
 */
function getTodayStartUTC(): string {
  const now = new Date();
  const todayStart = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0, 0, 0, 0
  ));
  return todayStart.toISOString();
}

/**
 * Get start of tomorrow in UTC (when counter resets)
 */
function getNextResetTime(): string {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return tomorrow.toISOString();
}

/**
 * Count how many questions user answered today
 */
async function getQuestionsAnsweredToday(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('responses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', getTodayStartUTC());

    if (error) {
      console.error('Error counting today\'s responses:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getQuestionsAnsweredToday:', error);
    return 0;
  }
}

/**
 * Get remaining questions for today
 * Handles daily reset automatically
 */
export async function getRemainingQuestions(userId: string): Promise<UnlockStatus> {
  try {
    const stats = await getUserStatsRecord(userId);

    // Check if we need to reset daily unlock
    if (shouldResetUnlock(stats.last_unlock_reset)) {
      const dailyUnlock = calculateDailyUnlock(userId);

      // Reset unlock count for new day
      const { error } = await supabase
        .from('user_stats')
        .update({
          questions_unlocked_today: dailyUnlock,
          last_unlock_reset: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error resetting unlock:', error);
      }

      // Return fresh count (all questions available)
      return {
        remaining: dailyUnlock,
        total: dailyUnlock,
        resetsAt: getNextResetTime(),
        streak: stats.current_streak
      };
    }

    // No reset needed - calculate remaining from today's activity
    const answeredToday = await getQuestionsAnsweredToday(userId);
    const remaining = Math.max(0, stats.questions_unlocked_today - answeredToday);

    return {
      remaining,
      total: stats.questions_unlocked_today,
      resetsAt: getNextResetTime(),
      streak: stats.current_streak
    };
  } catch (error) {
    console.error('Error in getRemainingQuestions:', error);
    throw error;
  }
}

/**
 * Calculate number of days between two dates
 */
function daysBetween(date1Str: string, date2Str: string): number {
  const d1 = new Date(date1Str);
  const d2 = new Date(date2Str);

  // Get dates in UTC to avoid timezone issues
  const utc1 = Date.UTC(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate());
  const utc2 = Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate());

  const diffTime = Math.abs(utc2 - utc1);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get today's date as YYYY-MM-DD string in UTC
 */
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Update user stats after answering a question
 * Handles streak calculation and stat updates
 */
export async function updateStatsAfterAnswer(
  userId: string,
  isCorrect: boolean
): Promise<void> {
  try {
    const stats = await getUserStatsRecord(userId);
    const today = getTodayDateString();
    const lastActivityDate = stats.last_activity_date;

    // Calculate streak
    let newStreak = stats.current_streak;

    if (!lastActivityDate) {
      // First activity ever - start streak at 1
      newStreak = 1;
    } else {
      const daysDiff = daysBetween(lastActivityDate, today);

      if (daysDiff === 0) {
        // Same day - keep current streak (or set to 1 if was 0)
        newStreak = Math.max(stats.current_streak, 1);
      } else if (daysDiff === 1) {
        // Consecutive day - increment streak
        newStreak = stats.current_streak + 1;
      } else {
        // Missed days - reset streak to 1
        newStreak = 1;
      }
    }

    // Update stats in database
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
      console.error('Error updating stats after answer:', error);
      throw new Error('Failed to update user stats');
    }

    console.log(`✅ Updated stats for ${userId}: streak=${newStreak}, total=${stats.total_questions_attempted + 1}`);
  } catch (error) {
    console.error('Error in updateStatsAfterAnswer:', error);
    throw error;
  }
}

/**
 * Get user stats for dashboard display
 * Returns enhanced stats with accuracy calculation
 */
export async function getEnhancedUserStats(userId: string): Promise<{
  totalAnswered: number;
  totalCorrect: number;
  accuracy: number;
  currentStreak: number;
  longestStreak: number;
  questionsToday: number;
}> {
  try {
    const stats = await getUserStatsRecord(userId);
    const answeredToday = await getQuestionsAnsweredToday(userId);

    const accuracy = stats.total_questions_attempted > 0
      ? Math.round((stats.correct_answers / stats.total_questions_attempted) * 100 * 100) / 100
      : 0;

    return {
      totalAnswered: stats.total_questions_attempted,
      totalCorrect: stats.correct_answers,
      accuracy,
      currentStreak: stats.current_streak,
      longestStreak: stats.longest_streak,
      questionsToday: answeredToday
    };
  } catch (error) {
    console.error('Error in getEnhancedUserStats:', error);
    // Return zeros instead of throwing to avoid breaking dashboard
    return {
      totalAnswered: 0,
      totalCorrect: 0,
      accuracy: 0,
      currentStreak: 0,
      longestStreak: 0,
      questionsToday: 0
    };
  }
}
