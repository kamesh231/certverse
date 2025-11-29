/**
 * Quick Fix Script - Manual Subscription Sync
 *
 * Use this when you've manually upgraded a user in Polar and need to sync to Supabase
 *
 * Steps:
 * 1. Get the Clerk user ID from Clerk Dashboard
 * 2. Get the Polar customer ID and subscription ID from Polar Dashboard
 * 3. Update the values below
 * 4. Run: npx tsx scripts/quick-fix-subscription.ts
 */

import { supabase } from '../src/lib/supabase';

// ==================== UPDATE THESE VALUES ====================
const CLERK_USER_ID = 'user_2qCE0bQ39BT0XdM3R6qJWFpkwsy'; // Get from Clerk Dashboard
const POLAR_CUSTOMER_ID = ''; // Get from Polar Dashboard (starts with cus_)
const POLAR_SUBSCRIPTION_ID = ''; // Get from Polar Dashboard (starts with sub_)
const USER_EMAIL = 'venkata.motamarry@gmail.com'; // For verification
// =============================================================

async function quickFix() {
  console.log('🔧 Quick Fix: Manual Subscription Sync\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Configuration:');
  console.log('  User Email:', USER_EMAIL);
  console.log('  Clerk User ID:', CLERK_USER_ID);
  console.log('  Polar Customer:', POLAR_CUSTOMER_ID || '⚠️  NOT SET');
  console.log('  Polar Subscription:', POLAR_SUBSCRIPTION_ID || '⚠️  NOT SET');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!CLERK_USER_ID) {
    console.error('❌ ERROR: Please set CLERK_USER_ID');
    console.log('   Find it in: Clerk Dashboard → Users → Search for', USER_EMAIL);
    process.exit(1);
  }

  if (!POLAR_CUSTOMER_ID || !POLAR_SUBSCRIPTION_ID) {
    console.error('❌ ERROR: Please set POLAR_CUSTOMER_ID and POLAR_SUBSCRIPTION_ID');
    console.log('   Find them in: Polar Dashboard → Subscriptions → Search for', USER_EMAIL);
    process.exit(1);
  }

  try {
    // Check if subscription exists
    console.log('1️⃣ Checking for existing subscription...');
    const { data: existing, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', CLERK_USER_ID)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!existing || fetchError?.code === 'PGRST116') {
      console.log('   No subscription found. Creating new one...\n');

      // Create new subscription
      console.log('2️⃣ Creating paid subscription...');
      const { error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: CLERK_USER_ID,
          plan_type: 'paid',
          status: 'active',
          polar_customer_id: POLAR_CUSTOMER_ID,
          polar_subscription_id: POLAR_SUBSCRIPTION_ID,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (createError) {
        throw createError;
      }

      console.log('   ✅ Subscription created!\n');
    } else {
      console.log('   Found existing subscription. Updating...\n');

      // Update existing subscription
      console.log('2️⃣ Updating subscription to paid...');
      const { error: updateError } = await supabase
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
        .eq('user_id', CLERK_USER_ID);

      if (updateError) {
        throw updateError;
      }

      console.log('   ✅ Subscription updated!\n');
    }

    // Verify
    console.log('3️⃣ Verifying subscription...');
    const { data: final, error: verifyError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', CLERK_USER_ID)
      .single();

    if (verifyError) {
      throw verifyError;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS! Subscription synced successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Final Status:');
    console.log('   User ID:', final.user_id);
    console.log('   Plan:', final.plan_type);
    console.log('   Status:', final.status);
    console.log('   Polar Customer:', final.polar_customer_id);
    console.log('   Polar Subscription:', final.polar_subscription_id);
    console.log('   Is Paid:', final.plan_type === 'paid' && final.status === 'active' ? 'YES ✅' : 'NO ❌');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n💡 Next Steps:');
    console.log('   1. Have the user refresh their app');
    console.log('   2. They should now see paid features enabled');
    console.log('   3. Set up webhooks to avoid manual syncs in the future');
    console.log('      See: SUBSCRIPTION_SYNC_FIX.md for webhook setup\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  }
}

quickFix();
