import { supabase } from '../src/lib/supabase';

async function verifyMigration() {
  console.log('🔍 Checking subscription table...\n');

  try {
    // Try to query the subscriptions table
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Subscriptions table does not exist\n');
      console.log('📋 To create it, run this SQL in Supabase SQL Editor:\n');
      console.log('   Dashboard > SQL Editor > New Query\n');
      console.log('   Then paste the contents of: backend/migrations/003_subscriptions.sql\n');
      process.exit(1);
    }

    console.log('✅ Subscriptions table exists!\n');

    // Test inserting a record
    console.log('🧪 Testing insert and read operations...\n');
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
      console.error('❌ Error inserting test record:', insertError);
      process.exit(1);
    }

    console.log('✅ Test insert successful');
    console.log('   User ID:', insertData.user_id);
    console.log('   Plan:', insertData.plan_type);
    console.log('   Status:', insertData.status);

    // Test reading
    const { data: readData, error: readError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (readError) {
      console.error('❌ Error reading test record:', readError);
      process.exit(1);
    }

    console.log('\n✅ Test read successful');

    // Clean up
    await supabase.from('subscriptions').delete().eq('user_id', testUserId);
    console.log('\n🧹 Test record cleaned up');

    console.log('\n✨ Milestone 1 Complete! Database is ready for subscription features.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyMigration();
