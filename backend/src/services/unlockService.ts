import { supabase } from '../lib/supabase';
import { getUserSubscription } from './subscriptionService';
import logger from '../lib/logger';

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

async function calculateDailyUnlock(userId: string): Promise<number> {
  const subscription = await getUserSubscription(userId);

  if (subscription.plan_type === 'paid' && subscription.status === 'active') {
    return 999; // Unlimited for paid users
  }

  return 2; // Free users get 2 questions per day
}
