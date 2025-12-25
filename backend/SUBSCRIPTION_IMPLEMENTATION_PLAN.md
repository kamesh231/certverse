# Certverse Subscription Implementation Plan

**Date**: December 25, 2025
**Status**: Ready for Implementation

---

## Business Logic Summary

Based on product requirements, here's how Certverse handles subscriptions:

| Scenario | User Experience |
|----------|----------------|
| **Plan Tiers** | 2 tiers only: Free (2 questions/day) & Paid (unlimited) |
| **Trial Cancellation** | Keep premium access until 7-day trial ends |
| **Paid Cancellation** | Keep premium access until current period ends (user paid for full month) |
| **Reactivation** | Users can resume canceled subscription before period_end via customer portal |
| **Payment Failure (Dunning)** | Keep premium access during entire Polar retry period (7-14 days), only downgrade when subscription.revoked fires |
| **Refund Issued** | Immediate downgrade to free plan |
| **Email Notifications** | Send for: trial started, trial ending (2 days before), payment failed, subscription canceled |

---

## Database Schema

### Current Schema (`subscriptions` table)

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,  -- Clerk user ID
  plan_type TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'paid'
  status TEXT NOT NULL DEFAULT 'active',   -- 'active' | 'trialing' | 'canceled' | 'past_due'
  polar_customer_id TEXT,
  polar_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  has_used_trial BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Access Rules

```typescript
// User has premium access if:
const hasPremiumAccess = (subscription: Subscription): boolean => {
  // Case 1: Active paid subscription
  if (subscription.plan_type === 'paid' && subscription.status === 'active') {
    return true;
  }

  // Case 2: Trial period (still paid access during trial)
  if (subscription.plan_type === 'paid' && subscription.status === 'trialing') {
    return true;
  }

  // Case 3: Canceled but period hasn't ended yet (user paid for full month)
  if (subscription.plan_type === 'paid' &&
      subscription.status === 'canceled' &&
      subscription.current_period_end &&
      new Date() < new Date(subscription.current_period_end)) {
    return true;
  }

  // Case 4: Payment failed but in grace period (dunning)
  if (subscription.plan_type === 'paid' &&
      subscription.status === 'past_due') {
    return true;
  }

  return false; // Free plan or expired subscription
};
```

---

## Webhook Event Handlers

### 1. `subscription.created` ✅ IMPLEMENTED

**Polar sends this**: When checkout completes and subscription is created

**Payload includes**: `metadata.user_id` (from checkout), `status: 'trialing'` or `'active'`

**Certverse action**:
```typescript
// Already implemented with special handler
await upgradeSubscription(metadata.user_id, {
  polarCustomerId: data.customer_id,
  polarSubscriptionId: data.id,
  currentPeriodStart: data.current_period_start,
  currentPeriodEnd: data.current_period_end,
  status: data.status, // 'trialing' or 'active'
  trialStart: data.trial_start,
  trialEnd: data.trial_end,
});

// Send email: "Trial Started" or "Subscription Activated"
```

**Database update**:
```sql
UPDATE subscriptions SET
  plan_type = 'paid',
  status = 'trialing', -- or 'active' if no trial
  polar_subscription_id = 'sub_xxx',
  polar_customer_id = 'cus_xxx',
  trial_start = '2025-12-25T00:00:00Z', -- if trialing
  trial_end = '2026-01-01T00:00:00Z',   -- if trialing
  has_used_trial = TRUE,
  current_period_start = '2025-12-25T00:00:00Z',
  current_period_end = '2026-01-25T00:00:00Z'
WHERE user_id = 'user_xxx';
```

**User sees**: Premium features unlocked immediately

---

### 2. `subscription.active` ✅ PARTIALLY IMPLEMENTED

**Polar sends this**: When trial converts to paid (first charge succeeds)

**Certverse action**:
```typescript
// Update status from 'trialing' to 'active'
await updateSubscriptionStatus(subscription.user_id, 'active', {
  currentPeriodEnd: data.current_period_end,
});

// No email needed - silent conversion
```

**Database update**:
```sql
UPDATE subscriptions SET
  status = 'active',
  current_period_start = '2026-01-01T00:00:00Z',
  current_period_end = '2026-02-01T00:00:00Z',
  updated_at = NOW()
WHERE polar_subscription_id = 'sub_xxx';
```

**User sees**: Badge changes from "Trial" to "Active", no interruption

---

### 3. `subscription.updated` ✅ IMPLEMENTED

**Polar sends this**: Monthly renewal or subscription modification

**Certverse action**:
```typescript
// Just update the period dates
await updateSubscriptionStatus(subscription.user_id, data.status, {
  currentPeriodEnd: data.current_period_end,
});
```

**Database update**:
```sql
UPDATE subscriptions SET
  current_period_start = '2026-02-01T00:00:00Z',
  current_period_end = '2026-03-01T00:00:00Z',
  updated_at = NOW()
WHERE polar_subscription_id = 'sub_xxx';
```

**User sees**: Updated renewal date in dashboard

---

### 4. `subscription.canceled` ✅ IMPLEMENTED

**Polar sends this**: User clicks "Cancel Subscription" in customer portal

**IMPORTANT**: Subscription remains active until `cancel_at` date (end of period)

**Certverse action**:
```typescript
await updateSubscriptionStatus(subscription.user_id, 'canceled', {
  cancelAt: data.cancel_at,
  currentPeriodEnd: data.current_period_end,
});

// Send email: "Subscription Canceled - Access Until [date]"
// Include "Resume Subscription" button linking to customer portal
```

**Database update**:
```sql
UPDATE subscriptions SET
  status = 'canceled',
  cancel_at = '2026-02-01T00:00:00Z', -- End of current period
  canceled_at = '2025-12-25T00:00:00Z', -- When they canceled
  updated_at = NOW()
WHERE polar_subscription_id = 'sub_xxx';

-- NOTE: plan_type stays 'paid' until period ends!
```

**User sees**:
- Still has premium access ✅
- Badge: "Canceling - Access until Feb 1, 2026"
- Banner: "⚠️ Your subscription ends on Feb 1. Resume anytime before then."
- "Resume Subscription" button in settings

---

### 5. `subscription.uncanceled` ✅ IMPLEMENTED

**Polar sends this**: User clicks "Resume Subscription" in customer portal before `cancel_at`

**Certverse action**:
```typescript
await updateSubscriptionStatus(subscription.user_id, 'active', {
  currentPeriodEnd: data.current_period_end,
});

// Clear cancel_at and canceled_at fields
```

**Database update**:
```sql
UPDATE subscriptions SET
  status = 'active',
  cancel_at = NULL,
  canceled_at = NULL,
  updated_at = NOW()
WHERE polar_subscription_id = 'sub_xxx';
```

**User sees**:
- Badge back to "Active"
- Cancellation warning removed
- Renewal date shows normally

---

### 6. `subscription.revoked` ✅ IMPLEMENTED

**Polar sends this**:
- Canceled subscription reaches `cancel_at` date
- Payment failure dunning period exhausted
- Manual revocation

**Certverse action**:
```typescript
// Downgrade to free plan
await downgradeSubscription(subscription.user_id);

// Check why it was revoked and send appropriate email
// - If was canceled: "Your subscription has ended"
// - If payment failed: "Subscription ended due to payment failure"
```

**Database update**:
```sql
UPDATE subscriptions SET
  plan_type = 'free',
  status = 'active',
  polar_subscription_id = NULL,
  polar_customer_id = NULL,
  current_period_start = NULL,
  current_period_end = NULL,
  cancel_at = NULL,
  updated_at = NOW()
WHERE polar_subscription_id = 'sub_xxx';

-- Keep has_used_trial = TRUE so they can't get another trial
```

**User sees**:
- Downgraded to free plan
- Limited to 2 questions/day
- Explanations hidden
- Dashboard shows "Free Plan"

---

### 7. `subscription.past_due` ⚠️ NEEDS IMPLEMENTATION

**Polar sends this**: Payment failed on renewal, Polar is retrying

**Certverse action**:
```typescript
await updateSubscriptionStatus(subscription.user_id, 'past_due');

// Send urgent email: "Payment Failed - Update Payment Method"
// Include direct link to customer portal
```

**Database update**:
```sql
UPDATE subscriptions SET
  status = 'past_due',
  updated_at = NOW()
WHERE polar_subscription_id = 'sub_xxx';

-- NOTE: plan_type stays 'paid' during grace period!
-- User keeps premium access while Polar retries (7-14 days)
```

**User sees**:
- ⚠️ Still has premium access (grace period)
- Badge: Red "Payment Failed"
- Urgent banner: "🚨 Payment failed. Update your payment method to keep premium access."
- "Update Payment Method" button → Opens customer portal

**Business logic**: Keep access during entire dunning period. Only downgrade when `subscription.revoked` fires.

---

### 8. `order.created` ✅ IMPLEMENTED

**Polar sends this**: Initial purchase or monthly renewal charge

**Certverse action**:
```typescript
if (data.billing_reason === 'subscription_cycle') {
  // This is a renewal - update period dates
  await updateSubscriptionStatus(subscription.user_id, 'active', {
    currentPeriodEnd: data.subscription?.current_period_end,
  });
}
// Ignore other billing reasons (handled by subscription events)
```

---

### 9. `checkout.updated` ✅ IMPLEMENTED

**Polar sends this**: Checkout session completed (before subscription created)

**Certverse action**:
```typescript
// Do nothing - wait for subscription.created
// Log for debugging purposes only
```

---

### 10. `order.refunded` ⚠️ NEEDS IMPLEMENTATION

**Polar sends this**: Full or partial refund issued

**Certverse action** (per business requirements):
```typescript
// Immediate downgrade on refund
await downgradeSubscription(subscription.user_id);

// Log refund amount and reason
logger.info(`Refund issued: $${data.amount} for subscription ${data.subscription_id}`);

// Send email: "Refund Processed - Subscription Canceled"
```

**Database update**:
```sql
UPDATE subscriptions SET
  plan_type = 'free',
  status = 'active',
  polar_subscription_id = NULL,
  polar_customer_id = NULL,
  current_period_start = NULL,
  current_period_end = NULL,
  updated_at = NOW()
WHERE polar_subscription_id = 'sub_xxx';
```

**User sees**: Immediately downgraded to free plan

---

## Frontend Implementation Needs

### Settings Page Updates

**File**: `frontend/app/(dashboard)/settings/page.tsx`

#### 1. Subscription Status Display

```typescript
// Show different badges based on status
const getBadgeColor = (subscription: Subscription) => {
  if (subscription.plan_type === 'free') return 'gray';
  if (subscription.status === 'trialing') return 'amber';
  if (subscription.status === 'active') return 'green';
  if (subscription.status === 'canceled') return 'orange';
  if (subscription.status === 'past_due') return 'red';
  return 'gray';
};

const getBadgeText = (subscription: Subscription) => {
  if (subscription.plan_type === 'free') return 'Free Plan';
  if (subscription.status === 'trialing') return 'Trial';
  if (subscription.status === 'active') return 'Active';
  if (subscription.status === 'canceled') return 'Canceling';
  if (subscription.status === 'past_due') return 'Payment Failed';
  return 'Unknown';
};
```

#### 2. Status-Specific Banners

```typescript
// Trial active banner
{subscription.status === 'trialing' && (
  <Banner variant="info">
    🎉 You're on a 7-day free trial!
    Ends on {formatDate(subscription.trial_end)}.
    Your card will be charged ${MONTHLY_PRICE} on that date.
  </Banner>
)}

// Canceled banner
{subscription.status === 'canceled' && (
  <Banner variant="warning">
    ⚠️ Your subscription ends on {formatDate(subscription.cancel_at)}.
    <Button onClick={openCustomerPortal}>Resume Subscription</Button>
  </Banner>
)}

// Past due banner
{subscription.status === 'past_due' && (
  <Banner variant="error">
    🚨 Payment failed. Update your payment method to keep premium access.
    <Button onClick={openCustomerPortal} variant="primary">
      Update Payment Method
    </Button>
  </Banner>
)}
```

#### 3. Renewal/End Date Display

```typescript
const getDateLabel = (subscription: Subscription) => {
  if (subscription.status === 'trialing') {
    return `Trial ends ${formatDate(subscription.trial_end)}`;
  }
  if (subscription.status === 'canceled') {
    return `Access until ${formatDate(subscription.cancel_at)}`;
  }
  if (subscription.status === 'active') {
    return `Renews ${formatDate(subscription.current_period_end)}`;
  }
  if (subscription.status === 'past_due') {
    return `Update payment to continue`;
  }
  return '';
};
```

#### 4. Customer Portal Button

```typescript
// Update existing implementation
async function openCustomerPortal() {
  const token = await getToken();
  const response = await fetch('/api/subscription/portal-url', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { url } = await response.json();
  window.open(url, '_blank');
}

// Show different button text based on status
const getPortalButtonText = (status: string) => {
  if (status === 'canceled') return 'Resume Subscription';
  if (status === 'past_due') return 'Update Payment Method';
  return 'Manage Subscription';
};
```

---

## Email Notification System

### Setup Required

**Recommended**: Use Resend (resend.com) for transactional emails

```bash
npm install resend
```

**Environment variable**: `RESEND_API_KEY`

### Email Templates to Create

#### 1. Trial Started

**Trigger**: `subscription.created` with `status: 'trialing'`

**Subject**: "🎉 Your Certverse Trial Has Started!"

**Body**:
```
Hi there,

Welcome to Certverse Premium! Your 7-day free trial has started.

What you get:
✅ Unlimited practice questions
✅ Detailed explanations for every answer
✅ Advanced analytics and progress tracking

Your trial ends on [TRIAL_END_DATE]. After that, you'll be charged $[PRICE]/month.

Cancel anytime in your account settings - no questions asked.

Start practicing: [LINK_TO_DASHBOARD]

Happy studying!
The Certverse Team
```

---

#### 2. Trial Ending Soon (2 days before)

**Trigger**: Scheduled job checks for `trial_end` in 48 hours

**Subject**: "Your Certverse trial ends in 2 days"

**Body**:
```
Hi there,

Just a heads up - your Certverse Premium trial ends in 2 days on [TRIAL_END_DATE].

Your card will be charged $[PRICE]/month to continue your subscription.

Want to cancel? No problem - just:
1. Go to Settings → Subscription
2. Click "Manage Subscription"
3. Click "Cancel Subscription"

Otherwise, you're all set! Your premium access will continue uninterrupted.

Questions? Just reply to this email.

The Certverse Team
```

**Implementation**: Create a scheduled job (cron) that runs daily:

```typescript
// backend/src/jobs/trialEndingNotifications.ts
export async function sendTrialEndingNotifications() {
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

  const { data: expiringTrials } = await supabase
    .from('subscriptions')
    .select('user_id, trial_end')
    .eq('status', 'trialing')
    .gte('trial_end', twoDaysFromNow.toISOString())
    .lt('trial_end', new Date(twoDaysFromNow.getTime() + 86400000).toISOString());

  for (const sub of expiringTrials) {
    await sendEmail({
      to: await getUserEmail(sub.user_id), // Fetch from Clerk
      subject: 'Your Certverse trial ends in 2 days',
      template: 'trial-ending',
      data: { trialEndDate: sub.trial_end }
    });
  }
}
```

---

#### 3. Payment Failed

**Trigger**: `subscription.past_due`

**Subject**: "⚠️ Payment Failed - Update Your Payment Method"

**Body**:
```
Hi there,

We couldn't process your payment for Certverse Premium.

Don't worry - you still have access while we retry. But to avoid any interruption:

👉 Update your payment method now: [CUSTOMER_PORTAL_LINK]

Common issues:
• Expired card
• Insufficient funds
• Card declined by bank

Need help? Reply to this email and we'll assist.

The Certverse Team
```

---

#### 4. Subscription Canceled

**Trigger**: `subscription.canceled`

**Subject**: "Subscription Canceled - Access Until [DATE]"

**Body**:
```
Hi there,

We've canceled your Certverse Premium subscription as requested.

You'll still have premium access until [CANCEL_AT_DATE].

Changed your mind? You can resume anytime before then:
👉 Resume subscription: [CUSTOMER_PORTAL_LINK]

After [CANCEL_AT_DATE], you'll be back on the free plan:
• 2 questions per day
• No explanations

We'd love to have you back! Feel free to resubscribe anytime.

The Certverse Team
```

---

## Testing Plan

### Test Scenarios (Polar Sandbox)

#### Scenario 1: Happy Path - Trial → Paid

**Steps**:
1. New user signs up in Certverse
2. User clicks "Upgrade to Premium"
3. Complete checkout with test card `4242 4242 4242 4242`
4. Verify webhook: `subscription.created` with `status: 'trialing'`
5. Verify DB: `plan_type = 'paid'`, `status = 'trialing'`, `trial_end` = 7 days
6. Verify email: "Trial Started" sent
7. Wait for trial to end (or manually trigger `subscription.active` webhook)
8. Verify DB: `status = 'active'`
9. Verify: No interruption to service

**Expected**: User has premium access throughout

---

#### Scenario 2: Cancel During Trial

**Steps**:
1. User on trial (from Scenario 1)
2. User opens customer portal
3. User clicks "Cancel Subscription"
4. Verify webhook: `subscription.canceled`
5. Verify DB: `status = 'canceled'`, `cancel_at = trial_end`
6. Verify email: "Subscription Canceled" sent
7. Verify: User still has premium access until `trial_end`
8. Wait for `cancel_at` date (or manually trigger `subscription.revoked`)
9. Verify DB: `plan_type = 'free'`, `status = 'active'`
10. Verify: User downgraded, limited to 2 questions/day

**Expected**: User keeps access until trial ends, then downgraded

---

#### Scenario 3: Payment Failure (Dunning)

**Steps**:
1. User has active paid subscription
2. Manually update card to failing test card `4000 0000 0000 0002`
3. Wait for renewal or manually trigger payment
4. Verify webhook: `subscription.past_due`
5. Verify DB: `status = 'past_due'`, `plan_type` still `'paid'`
6. Verify email: "Payment Failed" sent with urgent tone
7. Verify: User STILL has premium access (grace period)
8. Update to valid card `4242 4242 4242 4242` in customer portal
9. Verify webhook: `subscription.active`
10. Verify DB: `status = 'active'`

**Alternative path (payment never fixed)**:
- After 7-14 days, Polar gives up
- Verify webhook: `subscription.revoked`
- Verify DB: `plan_type = 'free'`
- Verify: User downgraded

**Expected**: User keeps access during entire retry period

---

#### Scenario 4: Cancel Paid Subscription

**Steps**:
1. User has active paid subscription (past trial)
2. User cancels in customer portal
3. Verify webhook: `subscription.canceled`
4. Verify DB: `status = 'canceled'`, `cancel_at = current_period_end`
5. Verify: `plan_type` still `'paid'` (user paid for full month)
6. Verify email: "Subscription Canceled - Access Until [date]" sent
7. Verify UI: "Canceling" badge, "Resume" button visible
8. User clicks "Resume Subscription"
9. Verify webhook: `subscription.uncanceled`
10. Verify DB: `status = 'active'`, `cancel_at = NULL`
11. Verify UI: "Active" badge, no cancellation warning

**Expected**: User keeps access, can easily reactivate

---

#### Scenario 5: Refund Issued

**Steps**:
1. User has active subscription
2. Issue refund via Polar dashboard
3. Verify webhook: `order.refunded`
4. Verify DB: `plan_type = 'free'`, Polar IDs cleared
5. Verify: User immediately loses premium access

**Expected**: Immediate downgrade on refund

---

## Implementation Checklist

### Backend - Webhooks ✅ DONE (5/10)

- [x] `subscription.created` - Upgrade to paid
- [x] `subscription.active` - Update status
- [x] `subscription.updated` - Update dates
- [x] `subscription.canceled` - Mark as canceling
- [x] `subscription.uncanceled` - Reactivate
- [x] `subscription.revoked` - Downgrade to free
- [x] `order.created` - Handle renewals
- [ ] `subscription.past_due` - Mark payment failed
- [ ] `order.refunded` - Immediate downgrade
- [x] Remove email lookup (DONE - Supabase doesn't store emails)

### Backend - Access Control ✅ DONE (1/1)

- [x] `isPaidUser()` helper already implements correct logic (checks `plan_type = 'paid'` AND `status = 'active'`)
- Note: Need to update to also allow `trialing`, `canceled` (before period end), and `past_due`

### Backend - Email Service ⚠️ TODO (0/5)

- [ ] Set up Resend account and get API key
- [ ] Create email templates (trial started, trial ending, payment failed, canceled)
- [ ] Implement email sending in webhook handlers
- [ ] Create cron job for "trial ending" (2 days before)
- [ ] Add email preferences table (let users opt out)

### Frontend - UI Updates ⚠️ TODO (0/6)

- [ ] Update subscription badge colors (trialing=amber, active=green, canceled=orange, past_due=red)
- [ ] Add status-specific banners (trial info, cancellation warning, payment failed)
- [ ] Show correct date label (trial end, renewal date, access until)
- [ ] Change customer portal button text based on status
- [ ] Add "Resume Subscription" flow
- [ ] Test all UI states

### Database - Schema ✅ DONE (1/1)

- [x] Schema already supports all needed fields
- Note: Consider adding `refunded_at` timestamp for audit trail

### Testing ⚠️ TODO (0/5)

- [ ] Test trial → paid conversion
- [ ] Test trial cancellation
- [ ] Test paid cancellation → reactivation
- [ ] Test payment failure (dunning) → recovery
- [ ] Test refund flow

---

## Priority Order

### Phase 1: Critical - Complete Webhook Handling (1-2 days)

1. Implement `subscription.past_due` handler ⚠️
2. Implement `order.refunded` handler ⚠️
3. Update `isPaidUser()` to include trialing/canceled/past_due states ⚠️
4. Test all webhook events in Polar sandbox

### Phase 2: User Experience - Frontend (2-3 days)

1. Update settings page with status badges
2. Add status-specific banners
3. Implement "Resume Subscription" button
4. Test all UI states with real subscriptions

### Phase 3: Communication - Email System (3-4 days)

1. Set up Resend account
2. Design email templates
3. Implement email sending in webhooks
4. Create cron job for trial ending reminders
5. Test email delivery

### Phase 4: Polish & Edge Cases (1-2 days)

1. Add error handling for failed emails
2. Add retry logic for failed webhooks
3. Create admin dashboard to view subscription stats
4. Document customer support procedures

---

## Monitoring & Observability

### Metrics to Track

1. **Conversion Rate**: Trial → Paid conversion %
2. **Churn Rate**: Cancellations per month
3. **Dunning Recovery**: Past due → Active recovery %
4. **MRR (Monthly Recurring Revenue)**: Track growth
5. **Trial Cancellations**: How many cancel during trial?

### Logging Requirements

```typescript
// Add structured logging for all subscription events
logger.info('subscription_event', {
  event_type: type,
  user_id: userId,
  subscription_id: data.id,
  status: data.status,
  plan_type: subscription.plan_type,
  is_trial: !!data.trial_start,
  timestamp: new Date().toISOString(),
});
```

### Alerts to Set Up (Railway/Sentry)

1. **Critical**: Webhook signature verification failures
2. **Critical**: Database upsert failures
3. **Warning**: High refund rate (>5% in 24h)
4. **Info**: Successful trial conversions

---

## Customer Support Playbook

### Common Issues & Resolutions

#### "I canceled but still have access"

**Response**: "That's expected! Since you paid for the full month, you'll keep premium access until [date]. If you want an immediate refund, we can arrange that."

#### "Payment failed but I still see premium features"

**Response**: "We're giving you time to update your payment method while we retry. Please update your card in Settings → Manage Subscription to avoid service interruption."

#### "I want my trial back"

**Response**: "Unfortunately, trials are one-time only per account. However, I can offer you [discount code] for your first month!"

#### "Refund requested"

**Action**:
1. Issue refund via Polar dashboard
2. `order.refunded` webhook will automatically downgrade user
3. Confirm with user: "Refund processed, you've been downgraded to free plan"

---

## Success Metrics

After implementation, track these KPIs:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Trial → Paid Conversion | >40% | `COUNT(status='active' after trial) / COUNT(status='trialing')` |
| Churn Rate | <5%/month | `COUNT(canceled) / COUNT(active)` per month |
| Dunning Recovery | >60% | `COUNT(past_due→active) / COUNT(past_due)` |
| MRR Growth | +20%/month | Track monthly revenue trend |

---

## Next Steps

1. Review this plan and approve business logic ✅ (waiting for confirmation)
2. Start Phase 1: Implement missing webhook handlers
3. Deploy and test in Polar sandbox
4. Move to Phase 2: Frontend updates
5. Launch Phase 3: Email system
6. Monitor metrics and iterate

---

**Questions or changes?** Let's discuss before implementation begins.
