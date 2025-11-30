import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function checkQuestions() {
  console.log('🔍 Checking for CISA questions...\n');

  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, question_text, category, topic')
    .eq('category', 'cisa')
    .limit(5);

  if (error) {
    console.log('❌ Error querying questions:', error.message);
  } else if (!questions || questions.length === 0) {
    console.log('❌ No CISA questions found in database!');
    console.log('\n📊 Checking all categories...');

    const { data: allQuestions } = await supabase
      .from('questions')
      .select('category')
      .limit(100);

    if (allQuestions && allQuestions.length > 0) {
      const categories = [...new Set(allQuestions.map(q => q.category))];
      console.log('Available categories:', categories);
      console.log('\n💡 You need to add CISA questions to the database!');
    } else {
      console.log('❌ No questions at all in database!');
    }
  } else {
    console.log('✅ Found', questions.length, 'CISA questions:');
    questions.forEach(q => {
      console.log('  -', q.id, '|', q.topic, '|', q.question_text.substring(0, 50) + '...');
    });
  }
}

checkQuestions().catch(console.error);
