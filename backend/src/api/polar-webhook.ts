import { Request, Response } from 'express';
import path from 'path';
// Use direct require with resolved path to avoid module resolution issues with Polar SDK
const polarWebhooksPath = path.join(require.resolve('@polar-sh/sdk/package.json'), '../dist/commonjs/webhooks.js');
const { validateEvent, WebhookVerificationError } = require(polarWebhooksPath);
import logger from '../lib/logger';
import {
  upgradeSubscription,
  downgradeSubscription,
  updateSubscriptionStatus,
  getSubscriptionByPolarId,
} from '../services/subscriptionService';

/**
 * Extract billing interval from Polar subscription data
 * Polar sends: recurringInterval='month' and recurringIntervalCount=1 or 3 at top level
 */
function extractBillingInterval(subscriptionData: any): 'monthly' | 'quarterly' {
  if (!subscriptionData) return 'monthly';
  
  // Polar sends recurring interval at the top level of subscription object
  const interval = subscriptionData.recurringInterval;
  const count = subscriptionData.recurringIntervalCount || 1;
  
  // If interval is 'month' and count is 3, it's quarterly
  if (interval === 'month' && count === 3) {
    return 'quarterly';
  }
  
  return 'monthly';
}

export async function handlePolarWebhook(req: Request, res: Response): Promise<void> {
  try {
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

    logger.info('=== WEBHOOK DEBUG INFO ===');
    logger.info(`Webhook secret configured: ${webhookSecret ? 'YES' : 'NO'}`);
    logger.info(`Headers: ${JSON.stringify(req.headers)}`);

    if (!webhookSecret) {
      logger.error('POLAR_WEBHOOK_SECRET not configured');
      res.status(500).json({ error: 'Webhook secret not configured' });
      return;
    }

    // Use Polar SDK to validate webhook
    // Convert headers to Record<string, string> for Polar SDK
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers[key] = value;
      } else if (Array.isArray(value)) {
        headers[key] = value[0]; // Take first value if array
      }
    }

    // Get raw body for signature verification (set by middleware in index.ts)
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      logger.error('Raw body not found - middleware may not have set it');
      res.status(500).json({ error: 'Internal error' });
      return;
    }

    logger.info('Raw body type:', typeof rawBody);
    logger.info('Raw body is Buffer:', Buffer.isBuffer(rawBody));
    logger.info('Raw body is string:', typeof rawBody === 'string');

    let event;
    try {
      // validateEvent expects raw string/Buffer body, not parsed object
      event = validateEvent(rawBody, headers, webhookSecret);
      logger.info('✅ Webhook signature verified successfully using Polar SDK');
    } catch (error: unknown) {
      if (error instanceof WebhookVerificationError) {
        logger.error('Invalid webhook signature:', (error as Error).message);
        res.status(403).json({ error: 'Invalid signature' });
        return;
      }
      logger.error('Unexpected error during webhook validation:', error);
      throw error;
    }

    const { type, data } = event;

    logger.info(`========================================`);
    logger.info(`Received Polar webhook: ${type}`);
    logger.info(`Event data keys: ${Object.keys(data).join(', ')}`);
    logger.info(`========================================`);

    // Use any type for data since we're handling multiple event types
    const webhookData = data as any;

    // Special handling for subscription.created with metadata
    if (type === 'subscription.created' && webhookData.metadata?.user_id) {
      logger.info('========================================');
      logger.info('🎯 SPECIAL HANDLER: subscription.created with metadata');
      logger.info('========================================');
      logger.info(`Direct user_id from metadata: ${webhookData.metadata.user_id}`);

      // Extract billing interval from Polar subscription data
      const billingInterval = extractBillingInterval(webhookData);
      
      logger.info(`Billing interval: ${billingInterval}`);
      logger.info(`Recurring interval: ${webhookData.recurringInterval}, count: ${webhookData.recurringIntervalCount}`);
      logger.info(`Price IDs: ${webhookData.prices?.map((p: any) => p.id).join(', ')}`);

      // Directly use metadata user_id
      await upgradeSubscription(webhookData.metadata.user_id, {
        polarCustomerId: webhookData.customer_id,
        polarSubscriptionId: webhookData.id,
        currentPeriodStart: webhookData.current_period_start,
        currentPeriodEnd: webhookData.current_period_end,
        status: webhookData.status,
        trialStart: webhookData.trial_start,
        trialEnd: webhookData.trial_end,
        billingInterval,
        polarPriceId: webhookData.prices?.[0]?.id,
      });

      logger.info(`✅ Processed subscription.created directly from metadata`);
      res.json({ received: true });
      return;
    }

    switch (type) {
      // Checkout Events
      case 'checkout.created':
        logger.info('Checkout created (no action needed)');
        break;

      case 'checkout.updated':
        // Polar uses checkout.updated instead of checkout.completed
        await handleCheckoutCompleted(webhookData);
        break;

      // Subscription Events
      case 'subscription.created':
        await handleSubscriptionUpdated(webhookData);
        break;

      case 'subscription.active':
        await handleSubscriptionUpdated(webhookData);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(webhookData);
        break;

      case 'subscription.canceled':
        await handleSubscriptionCanceled(webhookData);
        break;

      case 'subscription.uncanceled':
        await handleSubscriptionUncanceled(webhookData);
        break;

      case 'subscription.revoked':
        // Polar uses subscription.revoked (no subscription.ended event)
        await handleSubscriptionEnded(webhookData);
        break;

      // Order Events
      case 'order.created':
        await handleOrderCreated(webhookData);
        break;

      // Customer Events
      case 'customer.state_changed':
        await handleCustomerStateChanged(webhookData);
        break;

      // Payment Events
      case 'payment.failed':
        await handlePaymentFailed(webhookData);
        break;

      default:
        logger.warn(`Unhandled webhook type: ${type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleCheckoutCompleted(data: any): Promise<void> {
  logger.info('=== CHECKOUT COMPLETED DATA ===');
  logger.info(`Customer ID: ${data.customer_id}`);
  logger.info(`Checkout Status: ${data.status}`);
  logger.info(`Metadata: ${JSON.stringify(data.metadata)}`);
  logger.info(`Subscription ID: ${data.subscription_id || 'NOT YET CREATED'}`);

  // For checkout.updated with status=succeeded, subscription hasn't been created yet
  // We'll handle the upgrade in subscription.created event instead
  if (!data.subscription_id) {
    logger.info('✓ Checkout succeeded but subscription not created yet');
    logger.info('  Will process upgrade when subscription.created webhook fires');
    return;
  }

  // If we get here, we have a subscription_id (shouldn't happen with checkout.updated)
  logger.warn('Checkout has subscription_id - unusual for checkout.updated event');

  const userId = data.metadata?.user_id;

  // Email lookup removed - Supabase doesn't store emails (only Clerk does)
  if (!userId) {
    logger.error('❌ No user_id in checkout metadata');
    logger.error('Checkout must include metadata.user_id to process subscription');
    return;
  }

  logger.info(`User ID found in metadata: ${userId}`);
  logger.info(`Upgrading subscription for user ${userId} with Polar subscription ${data.subscription_id}`);

  await upgradeSubscription(userId, {
    polarCustomerId: data.customer_id,
    polarSubscriptionId: data.subscription_id,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    status: data.status,
    trialStart: data.trial_start,
    trialEnd: data.trial_end,
  });

  logger.info(`✅ Checkout completed successfully for user ${userId} - subscription upgraded to paid`);
}

async function handleSubscriptionCanceled(data: any): Promise<void> {
  const subscription = await getSubscriptionByPolarId(data.id);

  if (!subscription) {
    logger.error(`Subscription not found for Polar ID: ${data.id}`);
    return;
  }

  await updateSubscriptionStatus(subscription.user_id, 'canceled', {
    cancelAt: data.cancel_at,
    currentPeriodEnd: data.current_period_end,
  });

  logger.info(`Subscription canceled for user ${subscription.user_id}`);
}

async function handleSubscriptionEnded(data: any): Promise<void> {
  const subscription = await getSubscriptionByPolarId(data.id);

  if (!subscription) {
    logger.error(`Subscription not found for Polar ID: ${data.id}`);
    return;
  }

  await downgradeSubscription(subscription.user_id);
  logger.info(`Subscription ended for user ${subscription.user_id}`);
}

async function handlePaymentFailed(data: any): Promise<void> {
  const subscription = await getSubscriptionByPolarId(data.subscription_id);

  if (!subscription) {
    logger.error(`Subscription not found for Polar ID: ${data.subscription_id}`);
    return;
  }

  await updateSubscriptionStatus(subscription.user_id, 'past_due');
  logger.info(`Payment failed for user ${subscription.user_id}`);
}

async function handleSubscriptionUpdated(data: any): Promise<void> {
  logger.info('=== SUBSCRIPTION EVENT ===');
  logger.info(`Subscription ID: ${data.id}`);
  logger.info(`Customer ID: ${data.customer_id}`);
  logger.info(`Status: ${data.status}`);
  logger.info(`Current Period: ${data.current_period_start} to ${data.current_period_end}`);

  let subscription = await getSubscriptionByPolarId(data.id);

  // If subscription not found in our DB, we can't process it
  // Email lookup removed because Supabase doesn't store emails (only Clerk does)
  if (!subscription) {
    logger.error(`❌ Subscription not found for Polar ID: ${data.id}`);
    logger.error('Subscription must be created via subscription.created event with metadata.user_id');
    logger.error('Cannot process subscription without prior record in database');
    return;
  }

  // Extract billing interval in case user changed plans
  const billingInterval = extractBillingInterval(data);
  
  logger.info(`Updating existing subscription for user ${subscription.user_id}`);
  logger.info(`Updating billing interval to: ${billingInterval}`);
  logger.info(`Recurring interval: ${data.recurringInterval}, count: ${data.recurringIntervalCount}`);

  // Update subscription with new billing interval (handles plan changes)
  // Need to use supabase directly to update billing_interval
  const { supabase } = require('../lib/supabase');
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: data.status,
      current_period_end: data.current_period_end,
      billing_interval: billingInterval,
      polar_price_id: data.prices?.[0]?.id,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', subscription.user_id);

  if (error) {
    logger.error('Error updating subscription:', error);
    throw error;
  }

  logger.info(`✅ Subscription updated for user ${subscription.user_id} - status: ${data.status}`);
}

async function handleSubscriptionUncanceled(data: any): Promise<void> {
  const subscription = await getSubscriptionByPolarId(data.id);

  if (!subscription) {
    logger.error(`Subscription not found for Polar ID: ${data.id}`);
    return;
  }

  // Reactivate the subscription
  await updateSubscriptionStatus(subscription.user_id, 'active', {
    currentPeriodEnd: data.current_period_end,
  });

  logger.info(`Subscription reactivated for user ${subscription.user_id}`);
}

async function handleOrderCreated(data: any): Promise<void> {
  // Order created can be for:
  // 1. Initial purchase (billing_reason: 'purchase' or 'subscription_create')
  // 2. Subscription renewal (billing_reason: 'subscription_cycle')
  // 3. Subscription update (billing_reason: 'subscription_update')

  logger.info(`Order created: ${data.id}, billing_reason: ${data.billing_reason}`);

  if (data.billing_reason === 'subscription_cycle') {
    // This is a renewal - update the period dates
    if (data.subscription_id) {
      const subscription = await getSubscriptionByPolarId(data.subscription_id);

      if (subscription) {
        await updateSubscriptionStatus(subscription.user_id, 'active', {
          currentPeriodEnd: data.subscription?.current_period_end,
        });

        logger.info(`Subscription renewed for user ${subscription.user_id}`);
      }
    }
  } else {
    logger.info(`Order created for billing reason: ${data.billing_reason} (no action needed)`);
  }
}

async function handleCustomerStateChanged(data: any): Promise<void> {
  // Handle customer.state_changed event
  // This event contains active_subscriptions array
  logger.info(`Customer state changed for customer ${data.id}`);

  if (!data.active_subscriptions || data.active_subscriptions.length === 0) {
    logger.info('Customer has no active subscriptions');
    return;
  }

  // Process each active subscription
  for (const subscription of data.active_subscriptions) {
    try {
      // Try to find existing subscription in our database
      let existingSubscription = await getSubscriptionByPolarId(subscription.id);

      if (!existingSubscription) {
        // No subscription found - cannot process without prior record
        // Email lookup removed because Supabase doesn't store emails (only Clerk does)
        logger.error(`❌ No subscription found for Polar ID ${subscription.id}`);
        logger.error('Subscription must be created via subscription.created event with metadata.user_id');
        continue;
      }

      // Update existing subscription status
      await updateSubscriptionStatus(existingSubscription.user_id, subscription.status, {
        currentPeriodEnd: subscription.current_period_end,
      });

      logger.info(`✅ Updated subscription status for user ${existingSubscription.user_id}`);
    } catch (error) {
      logger.error(`Error processing subscription ${subscription.id}:`, error);
    }
  }
}
