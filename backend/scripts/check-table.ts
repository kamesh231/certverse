import { supabase } from '../src/lib/supabase';

(async () => {
  try {
    console.log('Checking subscriptions table...');

    const { data, error } = await supabase
      .from('subscriptions')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ TABLE_DOES_NOT_EXIST');
      console.log('Error:', error.message);
      process.exit(1);
    } else {
      console.log('✅ TABLE_EXISTS');
      process.exit(0);
    }
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
