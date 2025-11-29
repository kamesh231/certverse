import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running migration: 004_add_trial_tracking.sql\n');

  const migrationPath = path.join(__dirname, '..', 'migrations', '004_add_trial_tracking.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📝 Migration SQL:');
  console.log(sql);
  console.log('\n⏳ Executing migration...\n');

  try {
    // Split SQL into individual statements (simple split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.startsWith('COMMENT ON')) {
        console.log('⏭️  Skipping COMMENT statement (not supported via Supabase client)');
        continue;
      }

      console.log(`Executing: ${statement.substring(0, 50)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        // Try direct execution if RPC fails
        console.log('RPC failed, trying alternative method...');
        // For Supabase, we'll need to use a custom function or execute via psql
        console.error('❌ Error:', error.message);
        throw error;
      }

      console.log('✅ Success');
    }

    console.log('\n✨ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
