const fs = require('fs');
const Papa = require('papaparse');

// Read your CSV/TSV file
const inputFile = process.argv[2] || 'questions.tsv';
const outputFile = 'questions-insert.sql';

console.log(`Reading from: ${inputFile}`);
console.log(`Writing to: ${outputFile}`);

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Error: File not found: ${inputFile}`);
  console.log(`\nUsage: node csv-to-sql.js <path-to-your-csv-file>`);
  process.exit(1);
}

const csvText = fs.readFileSync(inputFile, 'utf8');

// Parse CSV/TSV
const parsed = Papa.parse(csvText, {
  delimiter: '\t', // Tab-separated
  header: true,
  skipEmptyLines: true,
  transformHeader: (header) => header.trim(),
});

console.log(`Parsed ${parsed.data.length} rows`);

if (parsed.errors.length > 0) {
  console.warn(`⚠️  Parsing warnings: ${parsed.errors.length}`);
  parsed.errors.slice(0, 5).forEach(err => console.warn(`  - ${err.message}`));
}

// Function to escape SQL strings
function escapeSql(str) {
  if (!str) return 'NULL';
  return "'" + String(str).replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

// Function to extract domain number
function extractDomain(domainStr) {
  if (!domainStr) return 1;
  const match = domainStr.match(/\d+/);
  return match ? parseInt(match[0]) : 1;
}

// Generate SQL INSERT statements
let sql = `-- Generated INSERT statements for questions table\n`;
sql += `-- Total questions: ${parsed.data.length}\n`;
sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

// First, update the constraint to allow 'Expert' difficulty
sql += `-- Update difficulty constraint to include 'Expert'\n`;
sql += `ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;\n`;
sql += `ALTER TABLE questions ADD CONSTRAINT questions_difficulty_check \n`;
sql += `CHECK (difficulty IN ('Easy', 'Medium', 'Hard', 'Expert'));\n\n`;

// Process in batches of 100 for better performance
const batchSize = 100;
let totalQuestions = 0;

for (let i = 0; i < parsed.data.length; i += batchSize) {
  const batch = parsed.data.slice(i, i + batchSize);
  
  sql += `-- Batch ${Math.floor(i / batchSize) + 1} (rows ${i + 1} to ${Math.min(i + batchSize, parsed.data.length)})\n`;
  sql += `INSERT INTO questions (\n`;
  sql += `  question_id, domain, difficulty, topic, q_text,\n`;
  sql += `  choice_a, choice_b, choice_c, choice_d,\n`;
  sql += `  answer, explanation, reasoning, incorrect_rationale, enhanced_reasoning\n`;
  sql += `) VALUES\n`;

  const values = batch.map((row, idx) => {
    // Map CSV columns to database columns
    const questionId = row['ID'] || null;
    const domain = extractDomain(row['Domain']);
    const difficulty = row['Difficulty'] || null;
    const topic = row['Topic'] || null;
    const qText = row['Question'] || '';
    const choiceA = row['Option A'] || '';
    const choiceB = row['Option B'] || '';
    const choiceC = row['Option C'] || '';
    const choiceD = row['Option D'] || '';
    const answer = (row['Answer'] || '').trim().toUpperCase();
    const reasoning = row['Reasoning'] || null;
    const incorrectRationale = row['Incorrect Rationale'] || null;
    const enhancedReasoning = row['Enhanced Reasoning'] || null;
    
    // Use Enhanced Reasoning as explanation, fallback to Reasoning
    const explanation = enhancedReasoning || reasoning || '';

    totalQuestions++;
    
    return `  (${escapeSql(questionId)}, ${domain}, ${escapeSql(difficulty)}, ${escapeSql(topic)}, ${escapeSql(qText)}, ${escapeSql(choiceA)}, ${escapeSql(choiceB)}, ${escapeSql(choiceC)}, ${escapeSql(choiceD)}, ${escapeSql(answer)}, ${escapeSql(explanation)}, ${escapeSql(reasoning)}, ${escapeSql(incorrectRationale)}, ${escapeSql(enhancedReasoning)})`;
  });

  sql += values.join(',\n');
  sql += `\nON CONFLICT (question_id) DO NOTHING;\n\n`;
}

// Write to file
fs.writeFileSync(outputFile, sql);

console.log(`\n✅ Successfully generated ${outputFile}`);
console.log(`📊 Total questions: ${totalQuestions}`);
console.log(`📁 File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
console.log(`\n🚀 Next steps:`);
console.log(`   1. Review ${outputFile}`);
console.log(`   2. Go to Supabase → SQL Editor`);
console.log(`   3. Copy and paste the SQL from ${outputFile}`);
console.log(`   4. Click "Run" to execute`);
console.log(`   5. Done! 🎉\n`);
