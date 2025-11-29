import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Running Trial Tracking Migration\n');

  try {
    // First, check current table structure
    console.log('📊 Checking current subscriptions table structure...');
    const { data: currentData, error: checkError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking table:', checkError.message);
      throw checkError;
    }

    console.log('✅ Current table accessible\n');

    // Check if columns already exist
    if (currentData && currentData.length > 0) {
      const firstRow = currentData[0];
      if ('has_used_trial' in firstRow) {
        console.log('⚠️  Migration appears to already be applied (has_used_trial column exists)');
        console.log('✨ Migration check complete!');
        return;
      }
    }

    console.log('⚠️  IMPORTANT: SQL migrations with ALTER TABLE need to be run via Supabase Dashboard SQL Editor\n');
    console.log('Please copy and paste the following SQL into your Supabase Dashboard → SQL Editor:\n');
    console.log('='.repeat(80));
    console.log(`
-- Add trial tracking fields to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS trial_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN DEFAULT FALSE;

-- Create index for trial lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial ON subscriptions(user_id, has_used_trial);

-- Update existing trialing subscriptions
UPDATE subscriptions
SET has_used_trial = TRUE
WHERE status = 'trialing' OR status = 'active';

-- Add comments
COMMENT ON COLUMN subscriptions.trial_start IS 'When the trial period started';
COMMENT ON COLUMN subscriptions.trial_end IS 'When the trial period ends/ended';
COMMENT ON COLUMN subscriptions.has_used_trial IS 'Whether user has ever used a trial (prevents repeat trials)';
    `);
    console.log('='.repeat(80));
    console.log('\n📍 Steps:');
    console.log('1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new');
    console.log('2. Copy the SQL above');
    console.log('3. Paste into the SQL Editor');
    console.log('4. Click "Run" to execute the migration');
    console.log('\n✨ After running, you can verify with: npm run check-migration\n');

  } catch (error) {
    console.error('\n❌ Migration check failed:', error);
    process.exit(1);
  }
}

runMigration();
