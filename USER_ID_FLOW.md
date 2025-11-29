# User ID Flow - Complete Trace

## TL;DR
**user_id is the Clerk User ID** (like `user_35w9rEJ46QL5Zl50DRx5URfYcn7`)

It comes from Clerk authentication and flows through your entire system.

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER SIGNS UP/LOGS IN                                        │
│    ┌──────────────┐                                            │
│    │   Frontend   │                                            │
│    │  (Next.js)   │                                            │
│    └──────┬───────┘                                            │
│           │                                                     │
│           │ User clicks "Sign Up" or "Log In"                  │
│           ↓                                                     │
│    ┌──────────────┐                                            │
│    │    Clerk     │ ← Creates user account                     │
│    │ (Auth SaaS)  │   Generates: user_2qCE0bQ39BT0XdM3R6qJWFpkwsy│
│    └──────┬───────┘                                            │
│           │                                                     │
│           │ Returns user object with:                          │
│           │  - id: "user_2qCE0bQ39BT0XdM3R6qJWFpkwsy"         │
│           │  - email: "user@example.com"                       │
│           │  - name: "John Doe"                                │
│           ↓                                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND GETS USER_ID FROM CLERK                             │
│                                                                  │
│    const { user } = useUser(); // Clerk React hook             │
│    const userId = user.id;     // "user_2qCE0bQ..."            │
│                                                                  │
│    This is available in ALL pages/components after login        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 3. FRONTEND SENDS USER_ID TO BACKEND                            │
│                                                                  │
│    Frontend makes API calls with userId:                        │
│                                                                  │
│    ┌──────────────────────────────────────────────────────┐   │
│    │ GET /api/subscription?userId=user_2qCE0b...          │   │
│    │ GET /api/stats?userId=user_2qCE0b...                 │   │
│    │ POST /api/checkout/create                             │   │
│    │      { userId: "user_2qCE0b...", email: "..." }      │   │
│    │ POST /api/submit-answer                               │   │
│    │      { userId: "user_2qCE0b...", ... }               │   │
│    └──────────────────────────────────────────────────────┘   │
│                                                                  │
│    Backend receives it in:                                      │
│    - req.query.userId (GET requests)                            │
│    - req.body.userId (POST requests)                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 4. HOW IT GETS INTO SUBSCRIPTIONS TABLE                         │
└─────────────────────────────────────────────────────────────────┘

PATH A: User visits app for the first time
────────────────────────────────────────────
  Frontend → GET /api/subscription?userId=user_2qCE0b...
           ↓
  Backend  → getUserSubscription(userId)
           → Checks subscriptions table
           → NOT FOUND
           → Creates free subscription:
              INSERT INTO subscriptions (user_id, plan_type, status)
              VALUES ('user_2qCE0b...', 'free', 'active')
           ✅ user_id now in database!

PATH B: User upgrades through YOUR APP
────────────────────────────────────────
  Frontend → POST /api/checkout/create
              { userId: "user_2qCE0b...", email: "user@example.com" }
           ↓
  Backend  → createCheckout(userId, email)
           → Creates Polar checkout URL:
              https://api.polar.sh/v1/checkout-links/...?
                customer_email=user@example.com&
                metadata[user_id]=user_2qCE0b...  ← USER_ID HERE!
           ↓
  User completes checkout on Polar
           ↓
  Polar    → Sends webhook: checkout.completed
              {
                customer_id: "cus_abc123",
                subscription_id: "sub_xyz789",
                metadata: {
                  user_id: "user_2qCE0b..."  ← RETURNED FROM POLAR!
                }
              }
           ↓
  Backend  → handleCheckoutCompleted(data)
           → userId = data.metadata.user_id  ← EXTRACTS user_id
           → upgradeSubscription(userId, { ... })
           → UPDATE subscriptions
              SET plan_type = 'paid',
                  polar_customer_id = 'cus_abc123',
                  polar_subscription_id = 'sub_xyz789'
              WHERE user_id = 'user_2qCE0b...'
           ✅ Subscription upgraded!

PATH C: You manually upgrade in Polar Dashboard (FALLBACK)
───────────────────────────────────────────────────────────
  You upgrade user in Polar Dashboard
           ↓
  Polar    → Sends webhook: subscription.updated
              {
                customer_id: "cus_abc123",
                subscription_id: "sub_xyz789",
                metadata: {}  ← NO user_id! (manual upgrade)
              }
           ↓
  Backend  → handleSubscriptionUpdated(data)
           → userId = data.metadata?.user_id  ← undefined!
           → FALLBACK: Email matching
              1. fetchPolarCustomer(data.customer_id)
                 → Gets email: "venkata.motamarry@gmail.com"
              2. findUserByEmail(email)
                 → Searches Clerk API for user by email
                 → Returns: "user_2qCE0b..."
              3. upgradeSubscription(userId, { ... })
           ✅ Subscription synced via email matching!

┌─────────────────────────────────────────────────────────────────┐
│ 5. CODE REFERENCES                                               │
└─────────────────────────────────────────────────────────────────┘

Frontend sends userId:
  - Everywhere: useUser() hook from @clerk/nextjs
  - Example: const { user } = useUser(); const userId = user.id;

Backend receives userId:
  - src/index.ts:55  → const userId = req.query.userId as string;
  - src/index.ts:67  → const { userId, userEmail } = req.body;

Checkout URL includes userId:
  - src/services/subscriptionService.ts:196-199
    → 'metadata[user_id]': userId

Webhook extracts userId from metadata:
  - src/api/polar-webhook.ts:75
    → let userId = data.metadata?.user_id;

Email fallback when no metadata:
  - src/api/polar-webhook.ts:78-106
    → const customer = await fetchPolarCustomer(data.customer_id);
    → userId = await findUserByEmail(customer.email);

findUserByEmail looks up in Clerk:
  - src/lib/userLookup.ts:19-20
    → const users = await clerkClient.users.getUserList({
        emailAddress: [normalizedEmail]
      });

Database operations:
  - src/services/subscriptionService.ts:21-59
    → getUserSubscription(userId) - creates subscription if not exists
  - src/services/subscriptionService.ts:68-96
    → upgradeSubscription(userId, polarData) - updates subscription

┌─────────────────────────────────────────────────────────────────┐
│ 6. CURRENT STATE OF YOUR DATABASE                               │
└─────────────────────────────────────────────────────────────────┘

From the database query we ran:

subscriptions table:
┌─────────────────────────────────────┬───────────┬─────────┐
│ user_id                             │ plan_type │ status  │
├─────────────────────────────────────┼───────────┼─────────┤
│ user_35w9rEJ46QL5Zl50DRx5URfYcn7   │ free      │ active  │  ← Real user
│ test_123                            │ free      │ active  │  ← Test data
│ test_user_123                       │ free      │ active  │  ← Test data
└─────────────────────────────────────┴───────────┴─────────┘

This means:
- user_35w9rEJ46QL5Zl50DRx5URfYcn7 is a Clerk User ID
- This user signed up/logged in via Clerk
- They visited your app and got a free subscription created
- They haven't upgraded to paid yet

┌─────────────────────────────────────────────────────────────────┐
│ 7. WHY VENKATA.MOTAMARRY ISN'T IN DATABASE                      │
└─────────────────────────────────────────────────────────────────┘

Two possibilities:

1. ❌ User hasn't signed up in your app yet
   - They were upgraded in Polar manually
   - But they never logged into your Certverse app
   - So no user_id exists in Clerk
   - Email matching fails → No sync

2. ❌ Webhook wasn't received/failed
   - Webhook URL not configured in Polar
   - OR webhook secret mismatch
   - OR CLERK_SECRET_KEY missing (email matching fails)

TO FIX: See SUBSCRIPTION_SYNC_FIX.md

┌─────────────────────────────────────────────────────────────────┐
│ 8. SUMMARY                                                       │
└─────────────────────────────────────────────────────────────────┘

user_id = Clerk User ID

Flow:
1. User signs up → Clerk creates user → Returns user.id
2. Frontend stores user.id from useUser() hook
3. Frontend sends user.id to backend in every API call
4. Backend stores user.id in subscriptions table
5. Polar stores user.id in metadata when user upgrades
6. Webhook returns user.id back to sync subscriptions

It's NOT:
- Supabase auth user ID
- Email address
- Custom generated ID
- Database auto-increment ID

It IS:
- Clerk User ID (starts with "user_")
- Example: user_2qCE0bQ39BT0XdM3R6qJWFpkwsy
- Generated by Clerk when user signs up
- Used throughout your entire system
