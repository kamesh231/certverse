import { Request, Response } from 'express';
import crypto from 'crypto';
import logger from '../lib/logger';
import {
  upgradeSubscription,
  downgradeSubscription,
  updateSubscriptionStatus,
  getSubscriptionByPolarId,
} from '../services/subscriptionService';

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

    // Verify signature
    const payload = JSON.stringify(req.body);
    if (!verifyPolarWebhook(payload, signature, webhookSecret)) {
      logger.warn('Invalid webhook signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const { type, data } = req.body;

    logger.info(`Received Polar webhook: ${type}`);

    switch (type) {
      case 'checkout.completed':
        await handleCheckoutCompleted(data);
        break;

      case 'subscription.canceled':
        await handleSubscriptionCanceled(data);
        break;

      case 'subscription.ended':
        await handleSubscriptionEnded(data);
        break;

      case 'payment.failed':
        await handlePaymentFailed(data);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(data);
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
  const userId = data.metadata?.user_id;

  if (!userId) {
    logger.error('No user_id in checkout.completed metadata');
    return;
  }

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
  const subscription = await getSubscriptionByPolarId(data.id);

  if (!subscription) {
    logger.error(`Subscription not found for Polar ID: ${data.id}`);
    return;
  }

  await updateSubscriptionStatus(subscription.user_id, data.status, {
    currentPeriodEnd: data.current_period_end,
  });

  logger.info(`Subscription updated for user ${subscription.user_id}`);
}
