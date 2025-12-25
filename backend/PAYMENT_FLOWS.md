# Certverse Payment Flows & Use Cases

## Overview
This document outlines all payment-related use cases and how Certverse should respond to each Polar webhook event.

---

## Subscription Lifecycle States

### Plan Types
- **free**: 2 questions/day, no explanations
- **paid**: Unlimited questions, explanations visible, analytics

### Subscription Status
- **active**: Subscription is active and paid
- **trialing**: In trial period (7 days)
- **past_due**: Payment failed, retry in progress
- **canceled**: Canceled but still active until period end
- **unpaid**: Payment failed permanently, access revoked

---

## Use Case 1: New User Trial

### Flow
1. User signs up for free account
2. User clicks "Upgrade to Premium"
3. Backend creates checkout with trial enabled
4. User completes checkout
5. Polar creates subscription with `status: "trialing"`
6. Webhook: `subscription.created` received

### Polar Webhook Payload
```json
{
  "type": "subscription.created",
  "data": {
    "id": "sub_xxxxx",
    "status": "trialing",
    "trial_start": "2025-12-25T00:00:00Z",
    "trial_end": "2026-01-01T00:00:00Z",
    "current_period_start": "2025-12-25T00:00:00Z",
    "current_period_end": "2026-01-25T00:00:00Z",
    "customer_id": "cus_xxxxx"
  }
}
```

### Certverse Response
**Database Update:**
```sql
UPDATE subscriptions SET
  plan_type = 'paid',
  status = 'trialing',
  polar_subscription_id = 'sub_xxxxx',
  polar_customer_id = 'cus_xxxxx',
  trial_start = '2025-12-25T00:00:00Z',
  trial_end = '2026-01-01T00:00:00Z',
  has_used_trial = true,
  current_period_start = '2025-12-25T00:00:00Z',
  current_period_end = '2026-01-25T00:00:00Z'
WHERE user_id = 'user_xxxxx';
```

**User Experience:**
- ✅ Unlimited questions immediately
- ✅ Explanations visible
- ✅ Dashboard shows "Trial - Ends Jan 1, 2026"
- ✅ Banner: "🎉 You're on a 7-day free trial!"

---

## Use Case 2: Trial Converts to Paid

### Flow
1. Trial period ends (7 days)
2. Polar charges the user
3. Subscription transitions from `trialing` → `active`
4. Webhook: `subscription.active` received

### Polar Webhook Payload
```json
{
  "type": "subscription.active",
  "data": {
    "id": "sub_xxxxx",
    "status": "active",
    "trial_start": "2025-12-25T00:00:00Z",
    "trial_end": "2026-01-01T00:00:00Z",
    "current_period_start": "2026-01-01T00:00:00Z",
    "current_period_end": "2026-02-01T00:00:00Z",
    "customer_id": "cus_xxxxx"
  }
}
```

### Certverse Response
**Database Update:**
```sql
UPDATE subscriptions SET
  status = 'active',
  current_period_start = '2026-01-01T00:00:00Z',
  current_period_end = '2026-02-01T00:00:00Z',
  updated_at = NOW()
WHERE polar_subscription_id = 'sub_xxxxx';
```

**User Experience:**
- ✅ No interruption to service
- ✅ Dashboard shows "Active - Renews Feb 1, 2026"
- ✅ Badge changes from "Trial" to "Active"

---

## Use Case 3: Monthly Renewal (Successful)

### Flow
1. Subscription period ends (monthly)
2. Polar charges the user
3. New billing period starts
4. Webhook: `subscription.updated` or `order.created` received

### Polar Webhook Payload
```json
{
  "type": "subscription.updated",
  "data": {
    "id": "sub_xxxxx",
    "status": "active",
    "current_period_start": "2026-02-01T00:00:00Z",
    "current_period_end": "2026-03-01T00:00:00Z",
    "customer_id": "cus_xxxxx"
  }
}
```

### Certverse Response
**Database Update:**
```sql
UPDATE subscriptions SET
  current_period_start = '2026-02-01T00:00:00Z',
  current_period_end = '2026-03-01T00:00:00Z',
  updated_at = NOW()
WHERE polar_subscription_id = 'sub_xxxxx';
```

**User Experience:**
- ✅ No action required
- ✅ Service continues uninterrupted
- ✅ Dashboard shows updated renewal date

---

## Use Case 4: User Upgrades (Direct to Paid, No Trial)

### Flow
1. User has already used trial (`has_used_trial = true`)
2. User clicks "Upgrade to Premium"
3. Backend creates checkout without trial
4. User completes checkout immediately
5. Webhook: `subscription.created` with `status: "active"`

### Polar Webhook Payload
```json
{
  "type": "subscription.created",
  "data": {
    "id": "sub_xxxxx",
    "status": "active",
    "trial_start": null,
    "trial_end": null,
    "current_period_start": "2025-12-25T00:00:00Z",
    "current_period_end": "2026-01-25T00:00:00Z",
    "customer_id": "cus_xxxxx"
  }
}
```

### Certverse Response
**Database Update:**
```sql
UPDATE subscriptions SET
  plan_type = 'paid',
  status = 'active',
  polar_subscription_id = 'sub_xxxxx',
  polar_customer_id = 'cus_xxxxx',
  current_period_start = '2025-12-25T00:00:00Z',
  current_period_end = '2026-01-25T00:00:00Z'
WHERE user_id = 'user_xxxxx';
```

**User Experience:**
- ✅ Unlimited questions immediately
- ✅ Explanations visible
- ✅ Dashboard shows "Active"

---

## Use Case 5: User Cancels Subscription

### Flow
1. User clicks "Cancel Subscription" in customer portal
2. Polar marks subscription as canceled
3. Subscription remains active until period end
4. Webhook: `subscription.canceled` received

### Polar Webhook Payload
```json
{
  "type": "subscription.canceled",
  "data": {
    "id": "sub_xxxxx",
    "status": "canceled",
    "cancel_at": "2026-02-01T00:00:00Z",
    "canceled_at": "2025-12-25T00:00:00Z",
    "current_period_end": "2026-02-01T00:00:00Z",
    "customer_id": "cus_xxxxx"
  }
}
```

### Certverse Response
**Database Update:**
```sql
UPDATE subscriptions SET
  status = 'canceled',
  cancel_at = '2026-02-01T00:00:00Z',
  canceled_at = '2025-12-25T00:00:00Z',
  updated_at = NOW()
WHERE polar_subscription_id = 'sub_xxxxx';
```

**User Experience:**
- ✅ Premium access continues until Feb 1, 2026
- ⚠️ Dashboard shows "Canceling - Access until Feb 1, 2026"
- ⚠️ Banner: "Your subscription ends on Feb 1. Reactivate anytime."
- ✅ Unlimited questions still available
- ✅ Explanations still visible

---

## Use Case 6: Canceled Subscription Ends

### Flow
1. Canceled subscription reaches `cancel_at` date
2. Polar revokes subscription
3. User loses premium access
4. Webhook: `subscription.revoked` received

### Polar Webhook Payload
```json
{
  "type": "subscription.revoked",
  "data": {
    "id": "sub_xxxxx",
    "status": "canceled",
    "cancel_at": "2026-02-01T00:00:00Z",
    "customer_id": "cus_xxxxx"
  }
}
```

### Certverse Response
**Database Update:**
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
WHERE polar_subscription_id = 'sub_xxxxx';
```

**User Experience:**
- ❌ Downgraded to free plan
- ❌ Limited to 2 questions/day
- ❌ Explanations hidden
- ⚠️ Dashboard shows "Free Plan"
- 📧 Email: "Your subscription has ended. Upgrade anytime to regain access."

---

## Use Case 7: Payment Failed (Dunning - First Attempt)

### Flow
1. Monthly renewal payment fails (card expired, insufficient funds)
2. Polar attempts to charge, fails
3. Subscription marked as `past_due`
4. Webhook: `subscription.past_due` received

### Polar Webhook Payload
```json
{
  "type": "subscription.past_due",
  "data": {
    "id": "sub_xxxxx",
    "status": "past_due",
    "current_period_end": "2026-02-01T00:00:00Z",
    "customer_id": "cus_xxxxx"
  }
}
```

### Certverse Response
**Database Update:**
```sql
UPDATE subscriptions SET
  status = 'past_due',
  updated_at = NOW()
WHERE polar_subscription_id = 'sub_xxxxx';
```

**User Experience:**
- ⚠️ Premium access **continues** (grace period)
- ⚠️ Dashboard shows "Payment Failed - Update Payment Method"
- ⚠️ Urgent banner: "⚠️ Payment failed. Update your payment method to keep premium access."
- ⚠️ Button: "Update Payment Method" → Opens customer portal
- ✅ Unlimited questions still available (temporarily)
- ✅ Explanations still visible (temporarily)

**Retry Logic:**
- Polar retries payment automatically (3-4 attempts over 7-14 days)
- We keep premium access during retry period
- User can update payment method anytime

---

## Use Case 8: Payment Failed (Dunning - Final Failure)

### Flow
1. All payment retry attempts fail
2. Polar gives up on payment
3. Subscription revoked
4. Webhook: `subscription.revoked` or `subscription.unpaid` received

### Polar Webhook Payload
```json
{
  "type": "subscription.revoked",
  "data": {
    "id": "sub_xxxxx",
    "status": "unpaid",
    "customer_id": "cus_xxxxx"
  }
}
```

### Certverse Response
**Database Update:**
```sql
UPDATE subscriptions SET
  plan_type = 'free',
  status = 'active',
  polar_subscription_id = NULL,
  polar_customer_id = NULL,
  current_period_start = NULL,
  current_period_end = NULL,
  updated_at = NOW()
WHERE polar_subscription_id = 'sub_xxxxx';
```

**User Experience:**
- ❌ Downgraded to free plan
- ❌ Limited to 2 questions/day
- ❌ Explanations hidden
- ⚠️ Dashboard shows "Free Plan"
- ⚠️ Banner: "Your subscription ended due to payment failure. Resubscribe to regain access."
- 📧 Email: "Your premium access has ended. We couldn't process your payment."

---

## Use Case 9: User Reactivates Canceled Subscription

### Flow
1. User had canceled subscription (still has access)
2. User clicks "Reactivate" before `cancel_at` date
3. Polar uncancels subscription
4. Webhook: `subscription.uncanceled` received

### Polar Webhook Payload
```json
{
  "type": "subscription.uncanceled",
  "data": {
    "id": "sub_xxxxx",
    "status": "active",
    "cancel_at": null,
    "current_period_end": "2026-02-01T00:00:00Z",
    "customer_id": "cus_xxxxx"
  }
}
```

### Certverse Response
**Database Update:**
```sql
UPDATE subscriptions SET
  status = 'active',
  cancel_at = NULL,
  canceled_at = NULL,
  updated_at = NOW()
WHERE polar_subscription_id = 'sub_xxxxx';
```

**User Experience:**
- ✅ Subscription continues normally
- ✅ Dashboard shows "Active"
- ✅ Cancellation warning removed
- 📧 Email: "Welcome back! Your subscription has been reactivated."

---

## Use Case 10: Payment Method Updated (During Past Due)

### Flow
1. Subscription is `past_due`
2. User updates payment method in customer portal
3. Polar retries payment, succeeds
4. Webhook: `subscription.active` received

### Polar Webhook Payload
```json
{
  "type": "subscription.active",
  "data": {
    "id": "sub_xxxxx",
    "status": "active",
    "current_period_start": "2026-02-01T00:00:00Z",
    "current_period_end": "2026-03-01T00:00:00Z",
    "customer_id": "cus_xxxxx"
  }
}
```

### Certverse Response
**Database Update:**
```sql
UPDATE subscriptions SET
  status = 'active',
  current_period_start = '2026-02-01T00:00:00Z',
  current_period_end = '2026-03-01T00:00:00Z',
  updated_at = NOW()
WHERE polar_subscription_id = 'sub_xxxxx';
```

**User Experience:**
- ✅ Premium access secured
- ✅ Dashboard shows "Active"
- ✅ Warning banner removed
- 📧 Email: "Payment successful! Your subscription is active."

---

## Webhook Event Summary Table

| Polar Event | Certverse Action | DB Update | User Impact |
|-------------|------------------|-----------|-------------|
| `checkout.created` | Log only | None | N/A |
| `checkout.updated` (succeeded) | Log, wait for subscription | None | N/A |
| `subscription.created` | **Create/upgrade subscription** | `plan_type='paid'`, set IDs | ✅ Premium access |
| `subscription.active` | Update status to active | `status='active'` | ✅ Continue access |
| `subscription.updated` | Update period dates | Update `current_period_*` | No change |
| `subscription.canceled` | Mark as canceling | `status='canceled'`, set `cancel_at` | ⚠️ Access until period end |
| `subscription.revoked` | **Downgrade to free** | `plan_type='free'`, clear IDs | ❌ Lose premium |
| `subscription.uncanceled` | Reactivate | `status='active'`, clear `cancel_at` | ✅ Continue access |
| `subscription.past_due` | Mark payment issue | `status='past_due'` | ⚠️ Keep access (grace) |
| `order.created` | Update renewal dates | Update `current_period_*` | No change |
| `customer.state_changed` | Log only | None | N/A |

---

## UI States & Messaging

### Dashboard Badge Colors
- **Free Plan**: Gray badge
- **Trial**: Amber/Yellow badge "Trial"
- **Active**: Green badge "Active"
- **Canceling**: Orange badge "Canceling"
- **Past Due**: Red badge "Payment Failed"

### Banners to Show
1. **Trial Active**: "🎉 You're on a 7-day free trial! Ends on {date}"
2. **Canceled**: "⚠️ Your subscription ends on {date}. Reactivate anytime."
3. **Past Due**: "🚨 Payment failed. Update your payment method to keep premium access."
4. **Revoked**: "Your subscription has ended. Upgrade to regain premium features."

### Email Notifications (Future Feature)
- Trial started
- Trial ending (2 days before)
- Payment successful
- Payment failed (with retry info)
- Subscription canceled
- Subscription ended
- Reactivation confirmation

---

## Implementation Checklist

### Backend (Current)
- [x] Handle `subscription.created` → upgrade
- [x] Handle `subscription.canceled` → mark canceling
- [x] Handle `subscription.revoked` → downgrade
- [x] Handle `subscription.active` → update status
- [x] Handle `subscription.updated` → update dates
- [ ] Handle `subscription.uncanceled` → reactivate
- [ ] Handle `subscription.past_due` → mark past_due

### Frontend (Current)
- [x] Show subscription status badge
- [x] Show trial end date
- [x] Show renewal date
- [x] Show cancellation date
- [ ] Show payment failed banner
- [ ] "Update Payment Method" button
- [ ] "Reactivate Subscription" button

### Database (Current)
- [x] `plan_type` field (free/paid)
- [x] `status` field (active/trialing/canceled/past_due)
- [x] `trial_start`, `trial_end` fields
- [x] `cancel_at`, `canceled_at` fields
- [x] `current_period_start`, `current_period_end` fields
- [x] `has_used_trial` field

---

## Testing Scenarios

### Test in Sandbox
1. **New trial**: Sign up, upgrade, verify 7-day trial
2. **Trial conversion**: Wait for trial end (or manually trigger)
3. **Renewal**: Wait for monthly renewal (or manually trigger webhook)
4. **Cancel**: Cancel via portal, verify access continues
5. **Revoke**: Wait for cancel_at date (or manually trigger)
6. **Payment fail**: Use test card that fails
7. **Update payment**: Fix failed payment
8. **Reactivate**: Cancel then reactivate before period end

### Test Cards (Polar Sandbox)
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`

---

## Summary

**Core Principle**: Always maintain user access during grace periods (trial, past_due, canceling). Only revoke access when subscription is truly ended (revoked, unpaid).

**User-Friendly Approach**:
- Give users time to fix payment issues
- Show clear warnings before access ends
- Make it easy to reactivate or update payment
- Never surprise users with sudden access loss
