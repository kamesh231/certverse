import { Request, Response } from 'express';
import crypto from 'crypto';
import logger from '../lib/logger';
import {
  upgradeSubscription,
  downgradeSubscription,
  updateSubscriptionStatus,
  getSubscriptionByPolarId,
} from '../services/subscriptionService';
import { fetchPolarCustomer } from '../lib/polarClient';
import { findUserByEmail } from '../lib/userLookup';

function verifyPolarWebhook(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return signature === digest;
}

export async function handlePolarWebhook(req: Request, res: Response): Promise<void> {
  try {
    const signature = req.headers['polar-signature'] as string;
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error('POLAR_WEBHOOK_SECRET not configured');
      res.status(500).json({ error: 'Webhook secret not configured' });
      return;
    }

    // Verify signature using raw body
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      logger.error('Raw body not found for signature verification');
      res.status(500).json({ error: 'Internal error' });
      return;
    }

    if (!verifyPolarWebhook(rawBody, signature, webhookSecret)) {
      logger.warn('Invalid webhook signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const { type, data } = req.body;

    logger.info(`Received Polar webhook: ${type}`);

    switch (type) {
      // Checkout Events
      case 'checkout.created':
        logger.info('Checkout created (no action needed)');
        break;

      case 'checkout.updated':
        await handleCheckoutCompleted(data);
        break;

      case 'checkout.completed':
        await handleCheckoutCompleted(data);
        break;

      // Subscription Events
      case 'subscription.created':
        await handleSubscriptionUpdated(data);
        break;

      case 'subscription.active':
        await handleSubscriptionUpdated(data);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(data);
        break;

      case 'subscription.canceled':
        await handleSubscriptionCanceled(data);
        break;

      case 'subscription.uncanceled':
        await handleSubscriptionUncanceled(data);
        break;

      case 'subscription.revoked':
      case 'subscription.ended':
        await handleSubscriptionEnded(data);
        break;

      // Order Events
      case 'order.created':
        await handleOrderCreated(data);
        break;

      // Payment Events
      case 'payment.failed':
        await handlePaymentFailed(data);
        break;

      // Customer Events
      case 'customer.state_changed':
        await handleCustomerStateChanged(data);
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
  let userId = data.metadata?.user_id;

  // NEW: Fallback to email matching if no user_id in metadata
  if (!userId) {
    logger.warn('No user_id in checkout.completed metadata, attempting email match');

    try {
      // Fetch Polar customer to get email
      const customer = await fetchPolarCustomer(data.customer_id);

      if (!customer || !customer.email) {
        logger.error(`No email found for Polar customer ${data.customer_id}`);
        return;
      }

      // Find user by email in our system
      userId = await findUserByEmail(customer.email);

      if (!userId) {
        logger.error(`No user found in Certverse for email: ${customer.email}`);
        logger.error('Please ensure this user has signed up in Certverse before subscribing on Polar');
        return;
      }

      logger.info(
        `Successfully matched Polar customer ${data.customer_id} to user ${userId} via email ${customer.email}`
      );
    } catch (error) {
      logger.error('Error during email matching in checkout.completed:', error);
      return;
    }
  }

  // Product ID validation removed - using checkout links now
  // Checkout links handle product selection, so validation is not needed

  await upgradeSubscription(userId, {
    polarCustomerId: data.customer_id,
    polarSubscriptionId: data.subscription_id,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
  });

  logger.info(`Checkout completed for user ${userId}`);
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
  let subscription = await getSubscriptionByPolarId(data.id);

  // If subscription not found in our DB, try to match by customer email
  if (!subscription) {
    logger.warn(`Subscription not found for Polar ID: ${data.id}, attempting email match`);

    try {
      // Fetch Polar customer to get email
      const customer = await fetchPolarCustomer(data.customer_id);

      if (!customer || !customer.email) {
        logger.error(`No email found for Polar customer ${data.customer_id}`);
        return;
      }

      // Find user by email
      const userId = await findUserByEmail(customer.email);

      if (!userId) {
        logger.error(`No user found in Certverse for email: ${customer.email}`);
        return;
      }

      logger.info(
        `Matched Polar subscription ${data.id} to user ${userId} via email ${customer.email}`
      );

      // Create/update subscription record
      await upgradeSubscription(userId, {
        polarCustomerId: data.customer_id,
        polarSubscriptionId: data.id,
        currentPeriodStart: data.current_period_start,
        currentPeriodEnd: data.current_period_end,
      });

      return;
    } catch (error) {
      logger.error('Error during email matching in subscription.updated:', error);
      return;
    }
  }

  await updateSubscriptionStatus(subscription.user_id, data.status, {
    currentPeriodEnd: data.current_period_end,
  });

  logger.info(`Subscription updated for user ${subscription.user_id}`);
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
        // No subscription found, try email matching
        logger.info(`No subscription found for Polar ID ${subscription.id}, attempting email match`);

        if (!data.email) {
          logger.error('No email in customer data');
          continue;
        }

        const userId = await findUserByEmail(data.email);

        if (!userId) {
          logger.error(`No user found for email: ${data.email}`);
          continue;
        }

        // Create/update subscription
        await upgradeSubscription(userId, {
          polarCustomerId: data.id,
          polarSubscriptionId: subscription.id,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
        });

        logger.info(`Created/updated subscription for user ${userId}`);
      } else {
        // Update existing subscription status
        await updateSubscriptionStatus(existingSubscription.user_id, subscription.status, {
          currentPeriodEnd: subscription.current_period_end,
        });

        logger.info(`Updated subscription status for user ${existingSubscription.user_id}`);
      }
    } catch (error) {
      logger.error(`Error processing subscription ${subscription.id}:`, error);
    }
  }
}
