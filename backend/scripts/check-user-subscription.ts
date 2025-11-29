import { supabase } from '../src/lib/supabase';
import { findUserByEmail } from '../src/lib/userLookup';
import { upgradeSubscription } from '../src/services/subscriptionService';
import { fetchPolarCustomer, fetchPolarSubscriptions } from '../src/lib/polarClient';
import logger from '../src/lib/logger';

async function checkUserSubscription() {
  const email = 'venkata.motamarry@gmail.com'; // Replace with the user's email

  console.log('🔍 Checking subscription for:', email);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Step 1: Find user in Clerk
    console.log('1️⃣ Looking up user in Clerk...');
    const userId = await findUserByEmail(email);

    if (!userId) {
      console.error('❌ User not found in Clerk for email:', email);
      console.log('\n💡 The user needs to sign up at your app first!');
      process.exit(1);
    }

    console.log('✅ Found Clerk user ID:', userId);
    console.log();

    // Step 2: Check subscription in database
    console.log('2️⃣ Checking subscription in database...');
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Database error:', error);
      process.exit(1);
    }

    if (!subscription || error?.code === 'PGRST116') {
      console.log('⚠️  No subscription found in database');
      console.log('   Creating free subscription...');

      const { data: newSub, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: 'free',
          status: 'active',
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating subscription:', createError);
        process.exit(1);
      }

      console.log('✅ Created free subscription');
      console.log('   Subscription:', newSub);
    } else {
      console.log('✅ Found subscription in database:');
      console.log('   Plan:', subscription.plan_type);
      console.log('   Status:', subscription.status);
      console.log('   Polar Customer ID:', subscription.polar_customer_id || 'None');
      console.log('   Polar Subscription ID:', subscription.polar_subscription_id || 'None');
    }
    console.log();

    // Step 3: Check Polar subscriptions
    console.log('3️⃣ Checking Polar subscriptions...');
    const polarSubs = await fetchPolarSubscriptions();

    const userPolarSub = polarSubs.find(sub => {
      // Match by customer ID or subscription ID
      if (subscription?.polar_subscription_id) {
        return sub.id === subscription.polar_subscription_id;
      }
      return false;
    });

    if (!userPolarSub) {
      console.log('⚠️  No active Polar subscription found for this user');
      console.log('   Total Polar subscriptions:', polarSubs.length);

      // Try to find by email match
      console.log('\n   Searching for subscription by email...');
      for (const sub of polarSubs) {
        try {
          const customer = await fetchPolarCustomer(sub.customer_id);
          if (customer && customer.email.toLowerCase() === email.toLowerCase()) {
            console.log('✅ Found matching Polar subscription!');
            console.log('   Subscription ID:', sub.id);
            console.log('   Customer ID:', sub.customer_id);
            console.log('   Status:', sub.status);
            console.log('   Current Period:', sub.current_period_start, 'to', sub.current_period_end);

            // Ask if we should sync
            console.log('\n🔄 This subscription should be synced to the database!');
            console.log('   Running sync...');

            await upgradeSubscription(userId, {
              polarCustomerId: sub.customer_id,
              polarSubscriptionId: sub.id,
              currentPeriodStart: sub.current_period_start,
              currentPeriodEnd: sub.current_period_end,
            });

            console.log('✅ Subscription synced successfully!');
            break;
          }
        } catch (error) {
          // Continue searching
        }
      }
    } else {
      console.log('✅ Found Polar subscription:');
      console.log('   Subscription ID:', userPolarSub.id);
      console.log('   Status:', userPolarSub.status);
      console.log('   Current Period:', userPolarSub.current_period_start, 'to', userPolarSub.current_period_end);
    }
    console.log();

    // Step 4: Final status
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Final Status:');

    const { data: finalSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('   Clerk User ID:', userId);
    console.log('   Email:', email);
    console.log('   Plan Type:', finalSub?.plan_type || 'unknown');
    console.log('   Status:', finalSub?.status || 'unknown');
    console.log('   Is Paid:', finalSub?.plan_type === 'paid' && finalSub?.status === 'active' ? 'YES' : 'NO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

checkUserSubscription();
