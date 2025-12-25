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
  trial_start?: string;
  trial_end?: string;
  has_used_trial?: boolean;
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

// Check if user is eligible for a trial (hasn't used one before)
export async function canOfferTrial(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('has_used_trial')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // No subscription record yet, user is eligible for trial
    return true;
  }

  if (error) {
    logger.error('Error checking trial eligibility:', error);
    throw error;
  }

  // User can get trial only if they haven't used one before
  return !data.has_used_trial;
}

// Upgrade user to paid subscription (creates or updates record)
export async function upgradeSubscription(
  userId: string,
  polarData: {
    polarCustomerId: string;
    polarSubscriptionId: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    status?: string;
    trialStart?: string;
    trialEnd?: string;
  }
): Promise<void> {
  const upsertData: any = {
    user_id: userId, // Required for upsert
    plan_type: 'paid',
    status: polarData.status || 'active',
    polar_customer_id: polarData.polarCustomerId,
    polar_subscription_id: polarData.polarSubscriptionId,
    current_period_start: polarData.currentPeriodStart,
    current_period_end: polarData.currentPeriodEnd,
    updated_at: new Date().toISOString(),
  };

  // If this is a trial subscription, track it
  if (polarData.status === 'trialing') {
    upsertData.trial_start = polarData.trialStart;
    upsertData.trial_end = polarData.trialEnd;
    upsertData.has_used_trial = true;  // Mark that trial has been used
    logger.info(`Starting trial for user ${userId} (ends: ${polarData.trialEnd})`);
  }

  // Use upsert to create or update subscription record
  // This handles the case where user doesn't have a subscription yet
  const { error } = await supabase
    .from('subscriptions')
    .upsert(upsertData, {
      onConflict: 'user_id', // Update if user_id already exists
    });

  if (error) {
    logger.error('Error upgrading subscription:', error);
    throw error;
  }

  logger.info(`Upgraded subscription for user ${userId} to ${polarData.status || 'active'} (upserted)`);
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
  const isSandbox = process.env.NODE_ENV !== 'production' || process.env.POLAR_SANDBOX === 'true';
  const apiBase = isSandbox
    ? 'https://sandbox-api.polar.sh'
    : 'https://api.polar.sh';

  const polarApiKey = process.env.POLAR_ACCESS_TOKEN;
  if (!polarApiKey) {
    throw new Error('POLAR_ACCESS_TOKEN environment variable is required');
  }

  const productPriceId = process.env.POLAR_PRODUCT_PRICE_ID || '71f3d2c6-ce12-4cf8-8444-a922c2fd2469';
  const frontendUrl = process.env.FRONTEND_URL || 'https://certverse.vercel.app';

  // Check trial eligibility
  const isTrialEligible = await canOfferTrial(userId);
  logger.info(`User ${userId} trial eligibility: ${isTrialEligible}`);

  // Create checkout session via Polar API
  const checkoutData = {
    product_price_id: productPriceId,
    success_url: `${frontendUrl}/settings?upgraded=true`,
    customer_email: userEmail,
    metadata: {
      user_id: userId,
    },
  };

  logger.info('Creating Polar checkout session:', JSON.stringify(checkoutData, null, 2));

  const response = await fetch(`${apiBase}/v1/checkouts/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${polarApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(checkoutData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`Failed to create checkout: ${response.status} ${errorText}`);
    throw new Error(`Failed to create checkout: ${response.statusText}`);
  }

  const checkout = await response.json() as any;
  logger.info(`Created checkout session: ${checkout.id}`);
  logger.info(`Checkout URL: ${checkout.url}`);

  return checkout.url;
}
