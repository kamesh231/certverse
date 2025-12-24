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

/**
 * Verify Polar webhook signature
 * Polar uses format: v1,<base64-signature>
 * Signature is computed as: HMAC-SHA256(webhook-id + ':' + timestamp + ':' + body, secret)
 */
function verifyPolarWebhook(
  payload: string,
  signatureHeader: string,
  webhookId: string,
  timestamp: string,
  secret: string
): boolean {
  // Parse signature format: v1,<base64-signature>
  const parts = signatureHeader.split(',');
  if (parts.length !== 2 || parts[0] !== 'v1') {
    logger.warn(`Invalid signature format: ${signatureHeader}`);
    return false;
  }

  const receivedSignature = parts[1];

  // Compute expected signature: HMAC-SHA256(webhook-id + ':' + timestamp + ':' + body, secret)
  const signedPayload = `${webhookId}:${timestamp}:${payload}`;
  const hmac = crypto.createHmac('sha256', secret);
  const computedSignature = hmac.update(signedPayload).digest('base64');

  logger.info(`Signed payload format: ${webhookId}:${timestamp}:<body>`);
  logger.info(`Received signature: ${receivedSignature}`);
  logger.info(`Computed signature: ${computedSignature}`);

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(receivedSignature),
    Buffer.from(computedSignature)
  );
}

export async function handlePolarWebhook(req: Request, res: Response): Promise<void> {
  try {
    // Polar uses webhook-signature header with format: v1,<base64-signature>
    const signatureHeader = req.headers['webhook-signature'] as string;
    const webhookId = req.headers['webhook-id'] as string;
    const timestamp = req.headers['webhook-timestamp'] as string;
    
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

    // Enhanced debug logging
    logger.info('=== WEBHOOK DEBUG INFO ===');
    logger.info(`Signature header: ${signatureHeader || 'NOT FOUND'}`);
    logger.info(`Webhook ID: ${webhookId || 'NOT FOUND'}`);
    logger.info(`Timestamp: ${timestamp || 'NOT FOUND'}`);
    logger.info(`Webhook secret configured: ${webhookSecret ? 'YES (length: ' + webhookSecret.length + ')' : 'NO'}`);
    logger.info(`Raw body type: ${typeof (req as any).rawBody}`);
    logger.info(`Raw body length: ${(req as any).rawBody ? (req as any).rawBody.length : 'N/A'}`);
    logger.info(`Body type: ${typeof req.body}`);

    if (!webhookSecret) {
      logger.error('POLAR_WEBHOOK_SECRET not configured');
      res.status(500).json({ error: 'Webhook secret not configured' });
      return;
    }

    // Check if required headers are present
    if (!signatureHeader) {
      logger.error('webhook-signature header not found in request');
      res.status(401).json({ error: 'Missing signature header' });
      return;
    }

    if (!webhookId) {
      logger.error('webhook-id header not found in request');
      res.status(401).json({ error: 'Missing webhook-id header' });
      return;
    }

    if (!timestamp) {
      logger.error('webhook-timestamp header not found in request');
      res.status(401).json({ error: 'Missing timestamp header' });
      return;
    }

    // Verify timestamp to prevent replay attacks (within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const timestampNum = parseInt(timestamp, 10);
    const timeDiff = Math.abs(currentTime - timestampNum);
    
    if (timeDiff > 300) { // 5 minutes
      logger.warn(`Timestamp too old or too far in future. Current: ${currentTime}, Received: ${timestamp}, Diff: ${timeDiff}s`);
      res.status(401).json({ error: 'Timestamp out of range' });
      return;
    }

    // Verify signature using raw body
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      logger.error('Raw body not found for signature verification');
      res.status(500).json({ error: 'Internal error' });
      return;
    }

    // Polar webhook secret format: whsec_<base64-secret>
    // Need to extract and decode the secret
    let decodedSecret = webhookSecret;
    if (webhookSecret.startsWith('whsec_')) {
      try {
        // Extract the base64 part after 'whsec_'
        const base64Secret = webhookSecret.substring(7);
        decodedSecret = Buffer.from(base64Secret, 'base64').toString('utf-8');
        logger.info('Decoded webhook secret from whsec_ format');
      } catch (error) {
        logger.warn('Failed to decode whsec_ format, using secret as-is');
        decodedSecret = webhookSecret;
      }
    }

    // Verify signature
    if (!verifyPolarWebhook(rawBody, signatureHeader, webhookId, timestamp, decodedSecret)) {
      logger.warn('Invalid webhook signature');
      logger.warn('This may be due to:');
      logger.warn('1. Incorrect POLAR_WEBHOOK_SECRET in environment');
      logger.warn('2. Webhook secret mismatch with Polar dashboard');
      logger.warn('3. Request body was modified');
      logger.warn('4. Secret format issue (may need whsec_ decoding)');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    logger.info('✅ Webhook signature verified successfully');

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
    status: data.status,  // Pass status to detect trialing
    trialStart: data.trial_start,
    trialEnd: data.trial_end,
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
        status: data.status,
        trialStart: data.trial_start,
        trialEnd: data.trial_end,
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
          status: subscription.status,
          trialStart: subscription.trial_start,
          trialEnd: subscription.trial_end,
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
