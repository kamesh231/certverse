/**
 * Sync venkata.motamarry@gmail.com subscription to PAID
 */

import { supabase } from '../src/lib/supabase';
import { fetchPolarSubscriptions, fetchPolarCustomer } from '../src/lib/polarClient';

async function syncVenkata() {
  const userId = 'user_35w9rEJ46QL5Zl50DRx5URfYcn7';
  const email = 'venkata.motamarry@gmail.com';

  console.log('🔄 Syncing venkata.motamarry subscription...\n');
  console.log('User ID:', userId);
  console.log('Email:', email);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. Check current state
    console.log('1️⃣ Current subscription state:');
    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('   Plan:', currentSub?.plan_type || 'NOT FOUND');
    console.log('   Status:', currentSub?.status || 'N/A');
    console.log('   Polar Customer:', currentSub?.polar_customer_id || 'None');
    console.log('   Polar Subscription:', currentSub?.polar_subscription_id || 'None');
    console.log();

    // 2. Find subscription in Polar
    console.log('2️⃣ Searching Polar for subscription...');
    const polarSubs = await fetchPolarSubscriptions();
    console.log(`   Total Polar subscriptions: ${polarSubs.length}`);

    let matchedSub = null;
    let matchedCustomer = null;

    for (const sub of polarSubs) {
      try {
        const customer = await fetchPolarCustomer(sub.customer_id);
        if (customer && customer.email.toLowerCase() === email.toLowerCase()) {
          matchedSub = sub;
          matchedCustomer = customer;
          console.log('   ✅ FOUND matching subscription!');
          console.log('      Customer ID:', customer.id);
          console.log('      Customer Email:', customer.email);
          console.log('      Subscription ID:', sub.id);
          console.log('      Status:', sub.status);
          console.log('      Period:', sub.current_period_start, 'to', sub.current_period_end);
          break;
        }
      } catch (error) {
        // Skip this subscription
      }
    }

    if (!matchedSub) {
      console.log('   ❌ No Polar subscription found for', email);
      console.log('   Please verify the user has an active subscription in Polar dashboard');
      process.exit(1);
    }
    console.log();

    // 3. Update subscription
    console.log('3️⃣ Updating subscription to PAID...');
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan_type: 'paid',
        status: 'active',
        polar_customer_id: matchedCustomer!.id,
        polar_subscription_id: matchedSub.id,
        current_period_start: matchedSub.current_period_start,
        current_period_end: matchedSub.current_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('   ❌ Error updating subscription:', updateError);
      process.exit(1);
    }
    console.log('   ✅ Subscription updated!');
    console.log();

    // 4. Verify
    console.log('4️⃣ Verifying update...');
    const { data: finalSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS! Subscription synced!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Final Status:');
    console.log('   User ID:', finalSub?.user_id);
    console.log('   Email:', email);
    console.log('   Plan:', finalSub?.plan_type);
    console.log('   Status:', finalSub?.status);
    console.log('   Polar Customer:', finalSub?.polar_customer_id);
    console.log('   Polar Subscription:', finalSub?.polar_subscription_id);
    console.log('   Period:', finalSub?.current_period_start, 'to', finalSub?.current_period_end);
    console.log('   Is Paid:', finalSub?.plan_type === 'paid' && finalSub?.status === 'active' ? 'YES ✅' : 'NO ❌');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log();
    console.log('💡 User should now see paid features when they refresh the app!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

syncVenkata();
