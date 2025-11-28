# Week 4: Polar.sh Integration - Complete Guide

## Overview

Implementing monetization with Polar.sh for:
- **Free Plan:** 2 questions/day, no explanations, no dashboard
- **Premium Plan ($29/mo):** Unlimited questions, explanations, full dashboard

---

## All Use Cases to Handle

### 1. **New User Flow**
- User signs up → Automatically gets free plan
- Can browse app with free limitations

### 2. **Upgrade Flow** (Free → Paid)
- User clicks "Upgrade to Premium"
- Redirects to Polar.sh checkout
- Payment succeeds → Webhook updates DB → User now has premium

### 3. **Downgrade Flow** (Paid → Free)
- User cancels subscription in Polar customer portal
- Webhook fires → Updates DB
- At period end → Downgrade to free plan

### 4. **Subscription Renewal**
- Monthly billing cycle renews
- Webhook updates `current_period_end`
- User keeps premium access

### 5. **Payment Failed**
- Payment fails → Webhook fires with `past_due` status
- User gets grace period (configurable)
- After grace period → Downgrade to free

### 6. **Subscription Reactivation**
- User canceled, then changes mind
- Clicks "Reactivate" → Redirects to checkout
- New subscription created

### 7. **Trial Period** (Optional)
- 7-day free trial of premium
- Webhook handles trial_start, trial_end

---

## Phase 1: Backend - Subscription Service

### File: `backend/src/services/subscriptionService.ts`

```typescript
import { supabase } from '../lib/supabase';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'paid' | 'coach';
  polar_customer_id: string | null;
  polar_subscription_id: string | null;
  polar_product_id: string | null;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get user's subscription
 * Creates free subscription if doesn't exist
 */
export async function getUserSubscription(userId: string): Promise<Subscription> {
  try {
    // Try to get existing subscription
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      throw new Error('Failed to fetch subscription');
    }

    // If exists, return it
    if (data) {
      return data as Subscription;
    }

    // Create free subscription for new user
    const { data: newSub, error: createError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: 'free',
        status: 'active'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating subscription:', createError);
      throw new Error('Failed to create subscription');
    }

    return newSub as Subscription;
  } catch (error) {
    console.error('Error in getUserSubscription:', error);
    // Return default free subscription to avoid breaking app
    return {
      id: '',
      user_id: userId,
      plan_type: 'free',
      status: 'active',
      polar_customer_id: null,
      polar_subscription_id: null,
      polar_product_id: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at: null,
      canceled_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

/**
 * Check if user has active paid subscription
 */
export async function isPaidUser(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return subscription.plan_type === 'paid' && subscription.status === 'active';
}

/**
 * Upgrade user to paid plan
 * Called by Polar webhook on checkout.completed
 */
export async function upgradeSubscription(
  userId: string,
  polarData: {
    customerId: string;
    subscriptionId: string;
    productId: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_type: 'paid',
        status: 'active',
        polar_customer_id: polarData.customerId,
        polar_subscription_id: polarData.subscriptionId,
        polar_product_id: polarData.productId,
        current_period_start: polarData.currentPeriodStart,
        current_period_end: polarData.currentPeriodEnd,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error upgrading subscription:', error);
      throw new Error('Failed to upgrade subscription');
    }

    console.log(`✅ Upgraded user ${userId} to paid plan`);
  } catch (error) {
    console.error('Error in upgradeSubscription:', error);
    throw error;
  }
}

/**
 * Downgrade user to free plan
 * Called by Polar webhook on subscription.canceled or subscription.ended
 */
export async function downgradeSubscription(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        plan_type: 'free',
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error downgrading subscription:', error);
      throw new Error('Failed to downgrade subscription');
    }

    console.log(`✅ Downgraded user ${userId} to free plan`);
  } catch (error) {
    console.error('Error in downgradeSubscription:', error);
    throw error;
  }
}

/**
 * Update subscription status
 * Called by Polar webhook on various events
 */
export async function updateSubscriptionStatus(
  userId: string,
  status: 'active' | 'canceled' | 'past_due' | 'trialing',
  metadata?: {
    current_period_end?: string;
    cancel_at?: string;
  }
): Promise<void> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (metadata?.current_period_end) {
      updateData.current_period_end = metadata.current_period_end;
    }

    if (metadata?.cancel_at) {
      updateData.cancel_at = metadata.cancel_at;
    }

    // If past_due for too long, downgrade to free
    if (status === 'past_due') {
      // Check if past_due for more than 7 days (grace period)
      const subscription = await getUserSubscription(userId);
      if (subscription.current_period_end) {
        const periodEnd = new Date(subscription.current_period_end);
        const now = new Date();
        const daysPastDue = Math.floor((now.getTime() - periodEnd.getTime()) / (1000 * 60 * 60 * 24));

        if (daysPastDue > 7) {
          // Grace period expired, downgrade to free
          updateData.plan_type = 'free';
          updateData.status = 'canceled';
          console.log(`⚠️  User ${userId} past_due for ${daysPastDue} days, downgrading to free`);
        }
      }
    }

    const { error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating subscription status:', error);
      throw new Error('Failed to update subscription status');
    }

    console.log(`✅ Updated subscription status for ${userId}: ${status}`);
  } catch (error) {
    console.error('Error in updateSubscriptionStatus:', error);
    throw error;
  }
}

/**
 * Get subscription by Polar subscription ID
 * Used by webhooks to find user
 */
export async function getSubscriptionByPolarId(polarSubscriptionId: string): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('polar_subscription_id', polarSubscriptionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription by Polar ID:', error);
      return null;
    }

    return data as Subscription | null;
  } catch (error) {
    console.error('Error in getSubscriptionByPolarId:', error);
    return null;
  }
}
```

---

## Phase 2: Update Unlock Service for Plan Enforcement

### File: `backend/src/services/unlockService.ts` (UPDATE)

Add this function at the top:

```typescript
import { getUserSubscription, isPaidUser } from './subscriptionService';

/**
 * Calculate daily unlock count based on subscription plan
 * FREE: 2 questions/day
 * PAID: Unlimited (999)
 */
async function calculateDailyUnlock(userId: string): Promise<number> {
  const subscription = await getUserSubscription(userId);

  // Paid users get unlimited questions
  if (subscription.plan_type === 'paid' && subscription.status === 'active') {
    return 999; // Effectively unlimited
  }

  // Free users get 2 questions/day
  return 2;
}
```

Then update the existing `getRemainingQuestions` function to use this:

```typescript
// Replace the hardcoded "return 5" with:
const dailyUnlock = await calculateDailyUnlock(userId);
```

---

## Phase 3: Backend - Polar.sh Webhook Handler

### File: `backend/src/api/polar-webhook.ts`

```typescript
import { Request, Response } from 'express';
import crypto from 'crypto';
import {
  upgradeSubscription,
  downgradeSubscription,
  updateSubscriptionStatus,
  getSubscriptionByPolarId
} from '../services/subscriptionService';

/**
 * Verify Polar.sh webhook signature
 */
function verifyPolarWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Handle Polar.sh webhook events
 *
 * Polar events we handle:
 * - checkout.completed: User completed purchase → Upgrade to paid
 * - subscription.active: Subscription became active → Ensure active status
 * - subscription.canceled: User canceled → Mark as canceled (stay active until period end)
 * - subscription.ended: Subscription period ended → Downgrade to free
 * - subscription.updated: Billing updated → Update period dates
 * - payment.failed: Payment failed → Mark as past_due
 */
export async function handlePolarWebhook(req: Request, res: Response): Promise<void> {
  try {
    // Get raw body for signature verification
    const payload = JSON.stringify(req.body);
    const signature = req.headers['polar-signature'] as string;
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('❌ POLAR_WEBHOOK_SECRET not configured');
      res.status(500).json({ error: 'Webhook secret not configured' });
      return;
    }

    // Verify webhook signature
    if (!signature || !verifyPolarWebhook(payload, signature, webhookSecret)) {
      console.error('❌ Invalid Polar webhook signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const event = req.body;
    console.log(`📥 Polar webhook received: ${event.type}`);

    // Extract event data
    const eventType = event.type;
    const eventData = event.data;

    switch (eventType) {
      case 'checkout.completed': {
        // User completed checkout - upgrade to paid
        const customerId = eventData.customer_id;
        const subscriptionId = eventData.subscription_id;
        const productId = eventData.product_id;
        const userId = eventData.metadata?.user_id; // We'll pass this in checkout

        if (!userId) {
          console.error('❌ No user_id in checkout metadata');
          res.status(400).json({ error: 'Missing user_id in metadata' });
          return;
        }

        await upgradeSubscription(userId, {
          customerId,
          subscriptionId,
          productId,
          currentPeriodStart: eventData.current_period_start,
          currentPeriodEnd: eventData.current_period_end
        });

        break;
      }

      case 'subscription.active': {
        // Subscription became active (renewal or reactivation)
        const subscription = await getSubscriptionByPolarId(eventData.id);
        if (!subscription) {
          console.error(`❌ Subscription not found: ${eventData.id}`);
          break;
        }

        await updateSubscriptionStatus(subscription.user_id, 'active', {
          current_period_end: eventData.current_period_end
        });

        break;
      }

      case 'subscription.canceled': {
        // User canceled subscription (stays active until period end)
        const subscription = await getSubscriptionByPolarId(eventData.id);
        if (!subscription) {
          console.error(`❌ Subscription not found: ${eventData.id}`);
          break;
        }

        await updateSubscriptionStatus(subscription.user_id, 'canceled', {
          cancel_at: eventData.cancel_at || eventData.current_period_end
        });

        console.log(`⚠️  User ${subscription.user_id} canceled, will end at ${eventData.cancel_at || eventData.current_period_end}`);

        break;
      }

      case 'subscription.ended': {
        // Subscription period ended - downgrade to free
        const subscription = await getSubscriptionByPolarId(eventData.id);
        if (!subscription) {
          console.error(`❌ Subscription not found: ${eventData.id}`);
          break;
        }

        await downgradeSubscription(subscription.user_id);

        break;
      }

      case 'subscription.updated': {
        // Billing cycle updated
        const subscription = await getSubscriptionByPolarId(eventData.id);
        if (!subscription) {
          console.error(`❌ Subscription not found: ${eventData.id}`);
          break;
        }

        await updateSubscriptionStatus(subscription.user_id, eventData.status, {
          current_period_end: eventData.current_period_end
        });

        break;
      }

      case 'payment.failed': {
        // Payment failed - mark as past_due
        const subscription = await getSubscriptionByPolarId(eventData.subscription_id);
        if (!subscription) {
          console.error(`❌ Subscription not found: ${eventData.subscription_id}`);
          break;
        }

        await updateSubscriptionStatus(subscription.user_id, 'past_due');

        console.log(`⚠️  Payment failed for user ${subscription.user_id}, marked as past_due`);

        break;
      }

      default:
        console.log(`ℹ️  Unhandled Polar event type: ${eventType}`);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Error handling Polar webhook:', error);
    res.status(500).json({ error: 'Webhook handler error' });
  }
}
```

---

## Phase 4: Add Backend API Endpoints

### File: `backend/src/index.ts` (ADD THESE)

```typescript
import { getUserSubscription, isPaidUser } from './services/subscriptionService';
import { handlePolarWebhook } from './api/polar-webhook';

// ... existing imports ...

// Get user subscription status
app.get('/api/subscription', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }

  const subscription = await getUserSubscription(userId);
  const isPaid = await isPaidUser(userId);

  res.json({
    ...subscription,
    is_paid: isPaid
  });
}));

// Polar.sh webhook endpoint
// IMPORTANT: Must use raw body for signature verification
app.post('/api/webhooks/polar',
  express.raw({ type: 'application/json' }), // Use raw body
  async (req: Request, res: Response) => {
    // Parse raw body back to JSON for handler
    req.body = JSON.parse(req.body.toString());
    await handlePolarWebhook(req, res);
  }
);

// Create Polar checkout URL (optional - can also use Polar's checkout links directly)
app.post('/api/checkout/create', asyncHandler(async (req: Request, res: Response) => {
  const { userId, userEmail } = req.body;

  if (!userId || !userEmail) {
    return res.status(400).json({ error: 'Missing userId or userEmail' });
  }

  // Option 1: Return Polar checkout link with metadata
  const checkoutUrl = `https://polar.sh/certverse/checkout?metadata[user_id]=${userId}&prefilled_email=${userEmail}`;

  res.json({ url: checkoutUrl });

  // Option 2: Use Polar API to create checkout session (if you want more control)
  // See Polar docs: https://docs.polar.sh/api/checkouts
}));
```

---

## Phase 5: Update Submit Answer Endpoint (Hide Explanations for Free)

### File: `backend/src/api/submit-answer.ts` (UPDATE)

```typescript
import { isPaidUser } from '../services/subscriptionService';

// In the submitAnswer function, after determining isCorrect:

// Check if user is paid to show explanation
const userIsPaid = await isPaidUser(userId);

// Step 6: Return success response
return {
  success: true,
  correct: isCorrect,
  correctAnswer: question.answer,
  explanation: userIsPaid
    ? (question.explanation || '')
    : '⭐ Upgrade to Premium to see detailed explanations',
  responseId: savedResponse.id,
  isPaid: userIsPaid // Add this so frontend knows
};
```

---

## Phase 6: Frontend - API Client Updates

### File: `frontend/lib/api.ts` (ADD THESE)

```typescript
export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'paid' | 'coach';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end: string | null;
  cancel_at: string | null;
  is_paid: boolean;
}

/**
 * Get user's subscription status
 */
export async function getUserSubscription(userId: string): Promise<Subscription> {
  try {
    const response = await fetch(`${API_URL}/api/subscription?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch subscription');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching subscription:', error);
    // Return free plan as fallback
    return {
      id: '',
      user_id: userId,
      plan_type: 'free',
      status: 'active',
      current_period_end: null,
      cancel_at: null,
      is_paid: false
    };
  }
}

/**
 * Create Polar checkout URL
 */
export async function createCheckoutUrl(userId: string, userEmail: string): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/api/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, userEmail }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw error;
  }
}
```

---

## Phase 7: Frontend - Pricing Page

### File: `frontend/app/(dashboard)/pricing/page.tsx` (CREATE NEW)

```typescript
"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, Loader2, Sparkles } from "lucide-react"
import { createCheckoutUrl } from "@/lib/api"

export default function PricingPage() {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    if (!user?.id || !user?.primaryEmailAddress?.emailAddress) {
      alert('Please sign in first')
      return
    }

    setIsLoading(true)
    try {
      const checkoutUrl = await createCheckoutUrl(
        user.id,
        user.primaryEmailAddress.emailAddress
      )

      // Redirect to Polar checkout
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
      setIsLoading(false)
    }
  }

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out Certverse",
      features: [
        "2 questions per day",
        "Basic stats tracking",
        "Streak tracking",
        "Mobile app access"
      ],
      limitations: [
        "No explanations",
        "No dashboard access",
        "No domain insights",
        "Limited progress tracking"
      ],
      cta: "Current Plan",
      ctaVariant: "outline" as const,
      popular: false
    },
    {
      name: "Premium",
      price: "$29",
      period: "per month",
      description: "Everything you need to ace your CISA exam",
      features: [
        "Unlimited questions",
        "Detailed explanations for every answer",
        "Advanced dashboard & analytics",
        "Domain-specific insights",
        "Streak tracking & gamification",
        "Daily unlock pacing",
        "Preparedness score",
        "Priority support"
      ],
      limitations: [],
      cta: "Upgrade to Premium",
      ctaVariant: "default" as const,
      popular: true
    },
    {
      name: "Coach",
      price: "$39",
      period: "per month",
      description: "AI-powered coaching (Coming Q2 2025)",
      features: [
        "Everything in Premium",
        "AI Reasoning Tutor",
        "Adaptive domain correction",
        "Socratic Q&A sessions",
        "Personalized study plan",
        "1 free call with CISA mentor",
        "Progress insights & recommendations"
      ],
      limitations: [],
      cta: "Join Waitlist",
      ctaVariant: "secondary" as const,
      popular: false,
      comingSoon: true
    }
  ]

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">Pricing</Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Choose Your CISA Prep Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade anytime. Cancel whenever you want.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${
                plan.popular
                  ? "border-primary shadow-lg scale-105"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {plan.comingSoon && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge variant="secondary">
                    Coming Q2 2025
                  </Badge>
                </div>
              )}

              <CardHeader className="pt-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <X className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {plan.name === "Premium" ? (
                  <Button
                    className="w-full"
                    variant={plan.ctaVariant}
                    onClick={handleUpgrade}
                    disabled={isLoading || plan.comingSoon}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.ctaVariant}
                    disabled={plan.name === "Free" || plan.comingSoon}
                  >
                    {plan.cta}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can cancel your subscription at any time. You'll keep premium access
                  until the end of your billing period, then automatically switch to the free plan.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens after I cancel?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You'll be downgraded to the free plan (2 questions/day) at the end of your
                  current billing period. Your progress and stats are preserved.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We offer a 7-day money-back guarantee. If you're not satisfied, email us
                  within 7 days of purchase for a full refund.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

This is a comprehensive guide. Let me know if you want me to continue with:
1. Upgrade CTAs throughout the app
2. Settings page for subscription management
3. Environment variables setup
4. Testing guide

Shall I continue?
