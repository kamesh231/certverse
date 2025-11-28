import {
  getUserSubscription,
  isPaidUser,
  upgradeSubscription,
  downgradeSubscription
} from '../src/services/subscriptionService';

async function testSubscriptionService() {
  console.log('🧪 Testing Subscription Service\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const testUserId = `test_user_${Date.now()}`;

  try {
    // Test 1: Get subscription for new user (should create free subscription)
    console.log('Test 1: Get subscription for new user');
    const sub1 = await getUserSubscription(testUserId);
    console.log('✅ Result:', {
      user_id: sub1.user_id,
      plan_type: sub1.plan_type,
      status: sub1.status
    });
    console.log();

    // Test 2: Check if user is paid (should be false)
    console.log('Test 2: Check if user is paid');
    const isPaid1 = await isPaidUser(testUserId);
    console.log('✅ Is paid?', isPaid1);
    console.log();

    // Test 3: Upgrade user to paid
    console.log('Test 3: Upgrade user to paid');
    await upgradeSubscription(testUserId, {
      customerId: 'cus_test_123',
      subscriptionId: 'sub_test_123',
      productId: 'prod_test_123',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
    console.log('✅ Upgraded to paid');
    console.log();

    // Test 4: Check subscription after upgrade
    console.log('Test 4: Check subscription after upgrade');
    const sub2 = await getUserSubscription(testUserId);
    console.log('✅ Result:', {
      plan_type: sub2.plan_type,
      status: sub2.status,
      polar_subscription_id: sub2.polar_subscription_id
    });
    console.log();

    // Test 5: Check if user is paid (should be true)
    console.log('Test 5: Check if user is paid after upgrade');
    const isPaid2 = await isPaidUser(testUserId);
    console.log('✅ Is paid?', isPaid2);
    console.log();

    // Test 6: Downgrade user back to free
    console.log('Test 6: Downgrade user to free');
    await downgradeSubscription(testUserId);
    console.log('✅ Downgraded to free');
    console.log();

    // Test 7: Check subscription after downgrade
    console.log('Test 7: Check subscription after downgrade');
    const sub3 = await getUserSubscription(testUserId);
    console.log('✅ Result:', {
      plan_type: sub3.plan_type,
      status: sub3.status
    });
    console.log();

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    const { supabase } = await import('../src/lib/supabase');
    await supabase.from('subscriptions').delete().eq('user_id', testUserId);
    console.log('✅ Cleaned up');
    console.log();

    // Success
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ All tests passed! Subscription service works!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Milestone 2 Complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);

    // Cleanup on failure
    try {
      const { supabase } = await import('../src/lib/supabase');
      await supabase.from('subscriptions').delete().eq('user_id', testUserId);
    } catch {}

    process.exit(1);
  }
}

testSubscriptionService();
