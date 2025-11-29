# Polar Webhook Events - Complete Coverage

## Summary

We now handle **ALL** important Polar webhook events for a complete subscription management system.

## Events Covered

### ✅ Checkout Events (3 events)

| Event | What It Does | Handler | Action |
|-------|--------------|---------|--------|
| `checkout.created` | User starts checkout | - | Log only (no action needed) |
| `checkout.updated` | Checkout details change | `handleCheckoutCompleted` | Upgrade to paid if completed |
| `checkout.completed` | User completes payment | `handleCheckoutCompleted` | Upgrade user to paid plan |

### ✅ Subscription Events (7 events)

| Event | What It Does | Handler | Action |
|-------|--------------|---------|--------|
| `subscription.created` | New subscription created | `handleSubscriptionUpdated` | Create/update subscription record |
| `subscription.active` | Subscription becomes active | `handleSubscriptionUpdated` | Mark as active |
| `subscription.updated` | Subscription details change | `handleSubscriptionUpdated` | Sync changes to database |
| `subscription.canceled` | User cancels subscription | `handleSubscriptionCanceled` | Mark as canceled, keep access until period end |
| `subscription.uncanceled` | User reactivates canceled sub | `handleSubscriptionUncanceled` | Reactivate subscription |
| `subscription.revoked` | Subscription revoked (immediate) | `handleSubscriptionEnded` | Downgrade to free immediately |
| `subscription.ended` | Subscription period ends | `handleSubscriptionEnded` | Downgrade to free plan |

### ✅ Order Events (1 event)

| Event | What It Does | Handler | Action |
|-------|--------------|---------|--------|
| `order.created` | Order created (purchase/renewal) | `handleOrderCreated` | Track renewals, update period dates |

**Order Billing Reasons:**
- `purchase` - One-time purchase
- `subscription_create` - First subscription charge
- `subscription_cycle` - Subscription renewal (we track this!)
- `subscription_update` - Subscription modification

### ✅ Payment Events (1 event)

| Event | What It Does | Handler | Action |
|-------|--------------|---------|--------|
| `payment.failed` | Payment fails | `handlePaymentFailed` | Mark subscription as past_due |

### ✅ Customer Events (1 event)

| Event | What It Does | Handler | Action |
|-------|--------------|---------|--------|
| `customer.state_changed` | Customer subscriptions/benefits change | `handleCustomerStateChanged` | Sync all active subscriptions |

## Event Flow Examples

### User Signs Up & Subscribes

```
1. checkout.created       → Log (user starts checkout)
2. checkout.completed     → Upgrade to paid
3. subscription.created   → Update subscription record
4. subscription.active    → Mark as active
5. customer.state_changed → Sync customer state
6. order.created          → Log initial purchase
```

**Result:** User is now on paid plan ✅

### User Cancels Subscription

```
1. subscription.canceled      → status='canceled', keep access until period end
2. subscription.updated       → Sync cancellation
3. customer.state_changed     → Update customer state
```

**Result:** User sees "Canceling - Access until Dec 6, 2025" ✅

### Subscription Period Ends (After Cancellation)

```
1. subscription.ended         → Downgrade to free
2. customer.state_changed     → No active subscriptions
```

**Result:** User is on free plan (2 questions/day) ✅

### User Reactivates Canceled Subscription

```
1. subscription.uncanceled    → status='active', remove cancel_at
2. subscription.updated       → Sync reactivation
3. customer.state_changed     → Update customer state
```

**Result:** User remains on paid plan ✅

### Monthly Renewal (Automatic)

```
1. order.created (billing_reason='subscription_cycle') → Update period end date
2. subscription.updated                                 → Sync new period
3. customer.state_changed                              → Update customer state
```

**Result:** Subscription continues, dates updated ✅

### Payment Fails

```
1. payment.failed         → status='past_due'
2. subscription.updated   → Sync past_due status
```

**Result:** User sees "Payment Failed" warning ⚠️

After retry succeeds:
```
1. subscription.active    → status='active'
2. order.created          → New payment processed
```

**Result:** User back to active ✅

## Event Handler Details

### handleCheckoutCompleted
- **Called by:** `checkout.completed`, `checkout.updated`
- **Purpose:** Upgrade user to paid when they complete checkout
- **Logic:**
  1. Get user_id from metadata or email matching
  2. Create/update subscription record
  3. Set plan_type='paid', status='active'

### handleSubscriptionUpdated
- **Called by:** `subscription.created`, `subscription.active`, `subscription.updated`
- **Purpose:** Sync subscription changes
- **Logic:**
  1. Find subscription by Polar ID or email
  2. Update status and dates
  3. Handle trialing status

### handleSubscriptionCanceled
- **Called by:** `subscription.canceled`
- **Purpose:** Mark subscription as canceling
- **Logic:**
  1. Set status='canceled'
  2. Set cancel_at = current_period_end
  3. User keeps access until then

### handleSubscriptionUncanceled
- **Called by:** `subscription.uncanceled`
- **Purpose:** Reactivate canceled subscription
- **Logic:**
  1. Set status='active'
  2. Clear cancel_at
  3. User continues with paid access

### handleSubscriptionEnded
- **Called by:** `subscription.ended`, `subscription.revoked`
- **Purpose:** Downgrade user to free
- **Logic:**
  1. Set plan_type='free'
  2. Clear Polar IDs
  3. User gets free plan limits (2 questions/day)

### handleOrderCreated
- **Called by:** `order.created`
- **Purpose:** Track purchases and renewals
- **Logic:**
  1. Check billing_reason
  2. If 'subscription_cycle' → update renewal dates
  3. Else → log only

### handlePaymentFailed
- **Called by:** `payment.failed`
- **Purpose:** Alert about payment issues
- **Logic:**
  1. Set status='past_due'
  2. User keeps access temporarily
  3. Retry payment flow begins

### handleCustomerStateChanged
- **Called by:** `customer.state_changed`
- **Purpose:** Sync customer's entire state
- **Logic:**
  1. Process all active_subscriptions
  2. Match by Polar ID or email
  3. Update or create subscriptions

## Events We DON'T Need to Handle

These events exist but aren't relevant for your use case:

- `benefit.granted` - If you had downloadable benefits
- `benefit.revoked` - If you had downloadable benefits
- `refund.created` - If you issue refunds
- Organization events - Not using organizations
- Discount/promotion events - Not using those features yet

## Testing Events

### In Polar Dashboard:
1. Go to Webhooks → Your webhook
2. Click "Send Test Event"
3. Choose event type
4. Check Railway logs

### Real-World Testing:
1. **Upgrade:** Create checkout → Complete → Check database
2. **Cancel:** Customer portal → Cancel → Check status='canceled'
3. **Reactivate:** Customer portal → Reactivate → Check status='active'
4. **Renewal:** Wait for next billing cycle → Check updated dates

## Debugging Webhooks

### Check Railway Logs:
```bash
railway logs --filter "webhook"
```

Look for:
```
✅ Received Polar webhook: subscription.canceled
✅ Subscription canceled for user user_xxx
```

### Check Polar Delivery Logs:
1. Polar Dashboard → Webhooks → Your webhook
2. Click "Recent Deliveries"
3. See status codes:
   - 200 ✅ Success
   - 401 ❌ Invalid signature
   - 500 ❌ Server error

### Common Issues:
- **401:** Wrong `POLAR_WEBHOOK_SECRET`
- **500:** Handler crashed, check Railway logs
- **No event:** Webhook not configured in Polar

## Summary

| Category | Events Handled | Coverage |
|----------|----------------|----------|
| **Checkout** | 3/3 | ✅ Complete |
| **Subscription** | 7/7 | ✅ Complete |
| **Order** | 1/1 | ✅ Complete |
| **Payment** | 1/1 | ✅ Complete |
| **Customer** | 1/1 | ✅ Complete |
| **TOTAL** | **13 events** | ✅ **100% Coverage** |

You now have comprehensive webhook coverage for subscription management!

## Sources:
- [Webhook Events - Polar.sh Docs](https://docs.polar.sh/integrate/webhooks/events)
- [subscription.updated - Polar.sh Docs](https://docs.polar.sh/api-reference/webhooks/subscription.updated)
- [subscription.canceled - Polar.sh Docs](https://docs.polar.sh/api-reference/webhooks/subscription.canceled)
- [customer.state_changed - Polar.sh Docs](https://docs.polar.sh/api-reference/webhooks/customer.state_changed)
