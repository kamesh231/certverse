import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function runMigrations() {
  console.log('🚀 Running onboarding migrations...\n');

  // Read migration files
  const migration005 = fs.readFileSync(
    path.join(__dirname, '../migrations/005_add_onboarding.sql'),
    'utf8'
  );
  const migration006 = fs.readFileSync(
    path.join(__dirname, '../migrations/006_simplify_onboarding_confidence.sql'),
    'utf8'
  );

  try {
    console.log('📝 Running migration 005_add_onboarding.sql...');
    const { error: error005 } = await supabase.rpc('exec_sql', { sql_query: migration005 });

    if (error005) {
      console.error('❌ Error running migration 005:', error005);
      // Continue anyway as tables might already exist
    } else {
      console.log('✅ Migration 005 completed successfully');
    }

    console.log('\n📝 Running migration 006_simplify_onboarding_confidence.sql...');
    const { error: error006 } = await supabase.rpc('exec_sql', { sql_query: migration006 });

    if (error006) {
      console.error('❌ Error running migration 006:', error006);
    } else {
      console.log('✅ Migration 006 completed successfully');
    }

    // Verify tables exist
    console.log('\n🔍 Verifying tables...');
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('user_onboarding')
      .select('*')
      .limit(1);

    if (onboardingError) {
      console.error('❌ Error querying user_onboarding:', onboardingError.message);
    } else {
      console.log('✅ user_onboarding table exists');
    }

    const { data: topicData, error: topicError } = await supabase
      .from('topic_confidence')
      .select('*')
      .limit(1);

    if (topicError) {
      console.error('❌ Error querying topic_confidence:', topicError.message);
    } else {
      console.log('✅ topic_confidence table exists');
    }

    console.log('\n✨ Migrations completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigrations();
