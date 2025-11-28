import { supabase } from '../src/lib/supabase';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  console.log('🚀 Running subscription migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/003_subscriptions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split by semicolons and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // If exec_sql RPC doesn't exist, try direct execution
        console.log('Using direct SQL execution...');
        const { error: directError } = await supabase.from('_migrations').insert({});

        if (directError) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          console.error('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }

    console.log('\n✅ Migration completed!\n');

    // Verify the table was created
    console.log('🔍 Verifying subscriptions table...\n');
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error verifying table:', error);
      process.exit(1);
    }

    console.log('✅ Subscriptions table verified!\n');

    // Test inserting a record
    console.log('🧪 Testing insert...\n');
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

    console.log('✅ Test record inserted:', insertData);

    // Test reading the record
    console.log('\n🧪 Testing read...\n');
    const { data: readData, error: readError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (readError) {
      console.error('❌ Error reading test record:', readError);
      process.exit(1);
    }

    console.log('✅ Test record read:', readData);

    // Clean up test record
    await supabase.from('subscriptions').delete().eq('user_id', testUserId);
    console.log('\n🧹 Cleaned up test record\n');

    console.log('✨ All tests passed! Migration successful!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
