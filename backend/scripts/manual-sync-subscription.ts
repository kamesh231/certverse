import { supabase } from '../src/lib/supabase';
import { fetchPolarSubscriptions, fetchPolarCustomer } from '../src/lib/polarClient';
import { upgradeSubscription } from '../src/services/subscriptionService';
import logger from '../src/lib/logger';

async function manualSyncSubscription() {
  const email = 'venkata.motamarry@gmail.com'; // The user's email
  const userId = 'user_2qCE0bQ39BT0XdM3R6qJWFpkwsy'; // Replace with actual Clerk user ID if known, or leave empty

  console.log('🔄 Manual Subscription Sync');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Step 1: Fetch all Polar subscriptions
    console.log('1️⃣ Fetching Polar subscriptions...');
    const polarSubs = await fetchPolarSubscriptions();
    console.log(`✅ Found ${polarSubs.length} total subscriptions in Polar\n`);

    // Step 2: Find subscription by email
    console.log(`2️⃣ Searching for subscription matching email: ${email}`);
    let matchedSub = null;
    let matchedCustomerId = null;

    for (const sub of polarSubs) {
      try {
        const customer = await fetchPolarCustomer(sub.customer_id);
        if (customer && customer.email.toLowerCase() === email.toLowerCase()) {
          matchedSub = sub;
          matchedCustomerId = sub.customer_id;
          console.log('✅ Found matching subscription!');
          console.log(`   Customer ID: ${customer.id}`);
          console.log(`   Customer Email: ${customer.email}`);
          console.log(`   Subscription ID: ${sub.id}`);
          console.log(`   Status: ${sub.status}`);
          console.log(`   Period: ${sub.current_period_start} to ${sub.current_period_end}\n`);
          break;
        }
      } catch (error) {
        // Skip this subscription
        continue;
      }
    }

    if (!matchedSub) {
      console.error('❌ No Polar subscription found for email:', email);
      console.log('\n💡 Make sure the user has an active subscription in Polar.sh');
      process.exit(1);
    }

    // Step 3: Check if user has subscription record
    console.log('3️⃣ Checking database subscription...');

    if (!userId) {
      console.error('❌ Please provide the Clerk user ID in the script');
      console.log('\n💡 You can find it by:');
      console.log('   1. Looking in Clerk dashboard');
      console.log('   2. OR checking the user_stats table:');
      console.log(`      SELECT user_id FROM user_stats LIMIT 5;`);
      process.exit(1);
    }

    const { data: existingSub, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Database error:', error);
      process.exit(1);
    }

    if (!existingSub || error?.code === 'PGRST116') {
      console.log('⚠️  No subscription record found, creating one...');

      const { error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: 'free',
          status: 'active',
        });

      if (createError) {
        console.error('❌ Error creating subscription:', createError);
        process.exit(1);
      }
      console.log('✅ Created subscription record\n');
    } else {
      console.log('✅ Found existing subscription:');
      console.log(`   Plan: ${existingSub.plan_type}`);
      console.log(`   Status: ${existingSub.status}\n`);
    }

    // Step 4: Sync the subscription
    console.log('4️⃣ Syncing subscription to database...');

    await upgradeSubscription(userId, {
      polarCustomerId: matchedCustomerId!,
      polarSubscriptionId: matchedSub.id,
      currentPeriodStart: matchedSub.current_period_start,
      currentPeriodEnd: matchedSub.current_period_end,
    });

    console.log('✅ Subscription synced successfully!\n');

    // Step 5: Verify the sync
    console.log('5️⃣ Verifying sync...');
    const { data: updatedSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Sync Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Final Status:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Plan: ${updatedSub?.plan_type}`);
    console.log(`   Status: ${updatedSub?.status}`);
    console.log(`   Polar Customer: ${updatedSub?.polar_customer_id}`);
    console.log(`   Polar Subscription: ${updatedSub?.polar_subscription_id}`);
    console.log(`   Is Paid: ${updatedSub?.plan_type === 'paid' && updatedSub?.status === 'active' ? 'YES ✅' : 'NO'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

manualSyncSubscription();
