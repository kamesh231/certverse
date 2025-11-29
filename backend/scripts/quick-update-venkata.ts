/**
 * Quick update for venkata.motamarry
 *
 * 1. Get Customer ID and Subscription ID from Polar Dashboard
 * 2. Update the values below
 * 3. Run: npx tsx scripts/quick-update-venkata.ts
 */

import { supabase } from '../src/lib/supabase';

// ==================== UPDATE THESE ====================
const POLAR_CUSTOMER_ID = '';     // From Polar Dashboard (cus_xxx)
const POLAR_SUBSCRIPTION_ID = ''; // From Polar Dashboard (sub_xxx)
// ======================================================

const USER_ID = 'user_35w9rEJ46QL5Zl50DRx5URfYcn7';
const EMAIL = 'venkata.motamarry@gmail.com';

async function quickUpdate() {
  console.log('🚀 Quick Update for venkata.motamarry\n');

  if (!POLAR_CUSTOMER_ID || !POLAR_SUBSCRIPTION_ID) {
    console.error('❌ Please update POLAR_CUSTOMER_ID and POLAR_SUBSCRIPTION_ID in the script');
    console.log('\n📍 Find them in: Polar Dashboard → Subscriptions → venkata.motamarry');
    process.exit(1);
  }

  try {
    console.log('Updating subscription...');
    console.log('  User:', EMAIL);
    console.log('  User ID:', USER_ID);
    console.log('  Polar Customer:', POLAR_CUSTOMER_ID);
    console.log('  Polar Subscription:', POLAR_SUBSCRIPTION_ID);
    console.log();

    const { error } = await supabase
      .from('subscriptions')
      .update({
        plan_type: 'paid',
        status: 'active',
        polar_customer_id: POLAR_CUSTOMER_ID,
        polar_subscription_id: POLAR_SUBSCRIPTION_ID,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', USER_ID);

    if (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }

    // Verify
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', USER_ID)
      .single();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Status:');
    console.log('  Plan:', data?.plan_type);
    console.log('  Status:', data?.status);
    console.log('  Is Paid:', data?.plan_type === 'paid' && data?.status === 'active' ? 'YES ✅' : 'NO ❌');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 User should refresh their app to see paid features!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

quickUpdate();
