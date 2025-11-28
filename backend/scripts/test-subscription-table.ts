import { supabase } from '../src/lib/supabase';

async function testSubscriptionTable() {
  console.log('🔍 Testing subscription table...\n');

  try {
    // Test 1: Check if table exists by querying it
    console.log('Test 1: Check if table exists...');
    const { data: existingData, error: existError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);

    if (existError) {
      console.error('❌ Table does not exist or cannot be queried');
      console.error('Error:', existError.message);
      process.exit(1);
    }

    console.log('✅ Table exists and is queryable');
    console.log(`   Found ${existingData?.length || 0} existing records\n`);

    // Test 2: Insert a test record
    console.log('Test 2: Insert test record...');
    const testUserId = `test_${Date.now()}`;
    const { data: insertData, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: testUserId,
        plan_type: 'free',
        status: 'active'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to insert test record');
      console.error('Error:', insertError.message);
      process.exit(1);
    }

    console.log('✅ Insert successful');
    console.log('   Record ID:', insertData.id);
    console.log('   User ID:', insertData.user_id);
    console.log('   Plan:', insertData.plan_type);
    console.log('   Status:', insertData.status);
    console.log('   Created:', insertData.created_at);
    console.log();

    // Test 3: Read the record back
    console.log('Test 3: Read test record...');
    const { data: readData, error: readError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (readError) {
      console.error('❌ Failed to read test record');
      console.error('Error:', readError.message);
      process.exit(1);
    }

    console.log('✅ Read successful');
    console.log('   Retrieved user:', readData.user_id);
    console.log();

    // Test 4: Update the record
    console.log('Test 4: Update test record...');
    const { data: updateData, error: updateError } = await supabase
      .from('subscriptions')
      .update({ plan_type: 'paid', polar_subscription_id: 'test_sub_123' })
      .eq('user_id', testUserId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update test record');
      console.error('Error:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Update successful');
    console.log('   New plan:', updateData.plan_type);
    console.log('   Polar ID:', updateData.polar_subscription_id);
    console.log();

    // Test 5: Delete the test record
    console.log('Test 5: Delete test record...');
    const { error: deleteError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', testUserId);

    if (deleteError) {
      console.error('❌ Failed to delete test record');
      console.error('Error:', deleteError.message);
      process.exit(1);
    }

    console.log('✅ Delete successful');
    console.log();

    // Final success message
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ All tests passed! Subscriptions table is ready.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Milestone 1 Complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

testSubscriptionTable();
