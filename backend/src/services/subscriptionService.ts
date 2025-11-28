import { supabase } from '../lib/supabase';
import logger from '../lib/logger';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'paid' | 'coach';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  polar_customer_id?: string;
  polar_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at?: string;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

// Get user subscription, create free subscription if doesn't exist
export async function getUserSubscription(userId: string): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // No subscription found, create free subscription
    const { data: newSub, error: createError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: 'free',
        status: 'active',
      })
      .select()
      .single();

    if (createError) {
      logger.error('Error creating free subscription:', createError);
      throw createError;
    }

    return {
      ...newSub,
      is_paid: false,
    };
  }

  if (error) {
    logger.error('Error getting subscription:', error);
    throw error;
  }

  return {
    ...data,
    is_paid: data.plan_type === 'paid' && data.status === 'active',
  };
}

// Check if user is a paid subscriber
export async function isPaidUser(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return subscription.is_paid;
}

// Upgrade user to paid subscription
export async function upgradeSubscription(
  userId: string,
  polarData: {
    polarCustomerId: string;
    polarSubscriptionId: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan_type: 'paid',
      status: 'active',
      polar_customer_id: polarData.polarCustomerId,
      polar_subscription_id: polarData.polarSubscriptionId,
      current_period_start: polarData.currentPeriodStart,
      current_period_end: polarData.currentPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    logger.error('Error upgrading subscription:', error);
    throw error;
  }

  logger.info(`Upgraded subscription for user ${userId}`);
}

// Downgrade user to free subscription
export async function downgradeSubscription(userId: string): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan_type: 'free',
      status: 'active',
      polar_customer_id: null,
      polar_subscription_id: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    logger.error('Error downgrading subscription:', error);
    throw error;
  }

  logger.info(`Downgraded subscription for user ${userId}`);
}

// Update subscription status
export async function updateSubscriptionStatus(
  userId: string,
  status: 'active' | 'canceled' | 'past_due',
  metadata?: {
    cancelAt?: string;
    currentPeriodEnd?: string;
  }
): Promise<void> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (metadata?.cancelAt) {
    updateData.cancel_at = metadata.cancelAt;
  }

  if (metadata?.currentPeriodEnd) {
    updateData.current_period_end = metadata.currentPeriodEnd;
  }

  const { error } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error updating subscription status:', error);
    throw error;
  }

  logger.info(`Updated subscription status for user ${userId} to ${status}`);
}

// Get subscription by Polar subscription ID
export async function getSubscriptionByPolarId(
  polarSubscriptionId: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('polar_subscription_id', polarSubscriptionId)
    .single();

  if (error && error.code === 'PGRST116') {
    return null;
  }

  if (error) {
    logger.error('Error getting subscription by Polar ID:', error);
    throw error;
  }

  return {
    ...data,
    is_paid: data.plan_type === 'paid' && data.status === 'active',
  };
}

// Create checkout URL for Polar
export async function createCheckout(userId: string, userEmail: string): Promise<string> {
  // For now, return a placeholder URL
  // In production, this would call Polar API to create a checkout session
  const polarOrg = process.env.POLAR_ORGANIZATION || 'certverse';
  const checkoutUrl = `https://polar.sh/${polarOrg}/checkout?email=${encodeURIComponent(userEmail)}&client_reference_id=${userId}`;

  logger.info(`Created checkout URL for user ${userId}`);
  return checkoutUrl;
}
