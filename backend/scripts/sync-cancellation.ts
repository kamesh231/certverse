/**
 * Manually sync subscription cancellation from Polar
 * Use this when webhooks don't fire
 */

import { fetchPolarSubscriptions, fetchPolarCustomer } from '../src/lib/polarClient';
import { updateSubscriptionStatus, downgradeSubscription } from '../src/services/subscriptionService';
import { supabase } from '../src/lib/supabase';

async function syncCancellation() {
  const email = 'venkata.motamarry@gmail.com';
  const userId = 'user_35w9rEJ46QL5Zl50DRx5URfYcn7';

  console.log('🔄 Syncing Subscription Cancellation from Polar');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. Get current state from database
    console.log('1️⃣ Current database state:');
    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('   Plan:', currentSub?.plan_type);
    console.log('   Status:', currentSub?.status);
    console.log('   Cancel At:', currentSub?.cancel_at || 'Not set');
    console.log('   Polar Subscription ID:', currentSub?.polar_subscription_id);
    console.log();

    if (!currentSub?.polar_subscription_id) {
      console.error('❌ No Polar subscription ID found');
      process.exit(1);
    }

    // 2. Fetch from Polar
    console.log('2️⃣ Fetching from Polar...');
    const polarSubs = await fetchPolarSubscriptions();
    const polarSub = polarSubs.find(s => s.id === currentSub.polar_subscription_id);

    if (!polarSub) {
      console.error('❌ Subscription not found in Polar');
      process.exit(1);
    }

    console.log('   Polar Status:', polarSub.status);
    console.log('   Current Period End:', polarSub.current_period_end);
    console.log('   Cancel At Period End:', polarSub.cancel_at_period_end);
    console.log('   Ended At:', polarSub.ended_at || 'Not ended');
    console.log();

    // 3. Determine what to do
    console.log('3️⃣ Determining action...');

    if (polarSub.status === 'canceled' || polarSub.ended_at) {
      console.log('   ➡️  Subscription has ENDED - downgrading to free');
      await downgradeSubscription(userId);
      console.log('   ✅ Downgraded to free plan');
    } else if (polarSub.cancel_at_period_end) {
      console.log('   ➡️  Subscription set to cancel at period end');
      await updateSubscriptionStatus(userId, 'canceled', {
        cancelAt: polarSub.current_period_end,
        currentPeriodEnd: polarSub.current_period_end,
      });
      console.log('   ✅ Marked as canceling (access until', new Date(polarSub.current_period_end).toDateString(), ')');
    } else {
      console.log('   ➡️  Subscription is still active in Polar');
      console.log('   ℹ️  No changes needed');
    }
    console.log();

    // 4. Verify
    console.log('4️⃣ Verifying update...');
    const { data: finalSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Sync Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Final Status:');
    console.log('   Plan:', finalSub?.plan_type);
    console.log('   Status:', finalSub?.status);
    console.log('   Cancel At:', finalSub?.cancel_at ? new Date(finalSub.cancel_at).toDateString() : 'None');
    console.log('   Access Until:', finalSub?.current_period_end ? new Date(finalSub.current_period_end).toDateString() : 'N/A');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n💡 What this means:');
    if (finalSub?.status === 'canceled') {
      console.log('   - User will see "Subscription Canceling" status');
      console.log('   - They still have paid access until:', new Date(finalSub.cancel_at || finalSub.current_period_end).toDateString());
      console.log('   - After that date, they\'ll be downgraded to free automatically');
    } else if (finalSub?.plan_type === 'free') {
      console.log('   - User has been downgraded to free plan');
      console.log('   - They now have limited access (2 questions/day)');
    } else {
      console.log('   - User subscription is active');
    }

    console.log('\n⚠️  Important: Set up webhooks to avoid manual syncs!');
    console.log('   See WEBHOOK_SETUP.md for instructions');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

syncCancellation();
