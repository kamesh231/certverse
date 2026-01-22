import { supabase } from '../lib/supabase';
import { getUserSubscription } from './subscriptionService';
import { getUserPreferences } from './onboardingService';
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
 * Get start and end of day in UTC for a given timezone
 * Returns UTC timestamps for midnight start and end of day in user's timezone
 * 
 * This function calculates what UTC time range corresponds to "today" 
 * (midnight to 23:59:59) in the user's local timezone.
 */
function getDayBoundsInUTC(timezone: string): { start: string; end: string } {
  try {
    const now = new Date();
    
    // Step 1: Get today's date string in user's timezone (YYYY-MM-DD format)
    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const todayInTz = dateFormatter.format(now); // Returns YYYY-MM-DD
    const [year, month, day] = todayInTz.split('-').map(Number);
    
    // Validate parsed date components
    if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new Error(`Invalid date parsed from timezone ${timezone}: ${todayInTz}`);
    }
    
    // Step 2: Calculate timezone offset using a known UTC time (noon)
    // We use noon UTC as a reference point to calculate the offset
    const testUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const tzFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const tzTimeStr = tzFormatter.format(testUTC); // e.g., "17:30" for IST (UTC+5:30)
    const timeParts = tzTimeStr.split(':');
    
    if (timeParts.length !== 2) {
      throw new Error(`Invalid time format from timezone ${timezone}: ${tzTimeStr}`);
    }
    
    const [tzHour, tzMinute] = timeParts.map(Number);
    
    // Validate parsed time components
    if (isNaN(tzHour) || isNaN(tzMinute)) {
      throw new Error(`Invalid time parsed from timezone ${timezone}: ${tzTimeStr}`);
    }
    
    // Calculate offset: UTC 12:00 = tzHour:tzMinute in timezone
    // Example: UTC 12:00 = 17:30 IST, so offset is +5:30 hours = +330 minutes
    const offsetMinutes = (tzHour * 60 + tzMinute) - (12 * 60);
    
    // Step 3: Convert midnight in timezone to UTC
    // If timezone is ahead of UTC (positive offset), midnight in timezone is earlier in UTC
    // Example: IST is +5:30, so midnight IST = 18:30 previous day UTC
    const startOfDayUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    startOfDayUTC.setUTCMinutes(startOfDayUTC.getUTCMinutes() - offsetMinutes);
    
    // End of day: start of next day in timezone (exclusive, for use with .lt() query)
    // This ensures we capture all responses up to but not including the next day
    const nextDayUTC = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
    nextDayUTC.setUTCMinutes(nextDayUTC.getUTCMinutes() - offsetMinutes);
    
    return {
      start: startOfDayUTC.toISOString(),
      end: nextDayUTC.toISOString()
    };
  } catch (error) {
    // Fallback to UTC if timezone calculation fails
    logger.warn(`Timezone calculation failed for ${timezone}, falling back to UTC:`, error);
    const todayUTC = new Date().toISOString().split('T')[0];
    const [y, m, d] = todayUTC.split('-').map(Number);
    const nextDay = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0, 0));
    return {
      start: `${todayUTC}T00:00:00Z`,
      end: nextDay.toISOString()
    };
  }
}

export async function getRemainingQuestions(userId: string): Promise<number> {
  try {
    const dailyLimit = await calculateDailyUnlock(userId);

    // Get user's timezone preference
    let userTimezone = 'America/New_York'; // Default
    try {
      const preferences = await getUserPreferences(userId);
      userTimezone = preferences.timezone || 'America/New_York';
    } catch (error) {
      logger.warn(`Could not fetch user preferences for ${userId}, using default timezone`);
    }

    // Get today's bounds in user's timezone, converted to UTC for database query
    const { start: todayStart, end: todayEnd } = getDayBoundsInUTC(userTimezone);

    const { data: responses, error } = await supabase
      .from('responses')
      .select('id,created_at')
      .eq('user_id', userId)
      .gte('created_at', todayStart)
      .lt('created_at', todayEnd);

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
  const now = new Date();

  // Check if user is on trial (7-day trial period)
  if (subscription.status === 'trialing' && subscription.plan_type === 'paid') {
    return 15; // Trial users get 15 questions per day
  }

  // Check if user canceled during trial - let them finish trial with 15 questions/day
  if (subscription.status === 'canceled' && subscription.trial_end && subscription.plan_type === 'paid') {
    const trialEnd = new Date(subscription.trial_end);
    if (now < trialEnd) {
      return 15; // Canceled during trial, keep 15 questions/day until trial ends
    }
    // Trial ended after cancellation, downgrade to free
    return 2;
  }

  // Check if user is fully paid (after trial)
  if (subscription.is_paid && subscription.status === 'active') {
    return 999; // Unlimited for paid users after trial
  }

  // Canceled after trial (user was charged and then canceled mid-billing period)
  // Give them unlimited until their paid period ends
  if (subscription.is_paid && subscription.status === 'canceled' && subscription.current_period_end) {
    const periodEnd = new Date(subscription.current_period_end);
    if (now < periodEnd) {
      return 999; // Keep unlimited until period ends (they paid for this)
    }
  }

  // Past due but still has access during grace period
  if (subscription.status === 'past_due' && subscription.plan_type === 'paid') {
    return 999; // Keep unlimited during payment retry period
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
