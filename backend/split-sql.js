const fs = require('fs');

const inputFile = 'questions-insert.sql';
const outputDir = '.';

console.log(`📖 Reading ${inputFile}...`);

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Error: ${inputFile} not found`);
  process.exit(1);
}

const sql = fs.readFileSync(inputFile, 'utf8');
const lines = sql.split('\n');

console.log(`📊 Total lines: ${lines.length}`);

// Split into chunks
const chunks = [];
let currentChunk = [];
const linesPerChunk = 300; // Approximately 300 lines per chunk

// Extract the constraint update (first few lines)
const constraintEndIndex = lines.findIndex(line => line.includes('CHECK (difficulty'));
const constraintLines = lines.slice(0, constraintEndIndex + 2); // Include the constraint and blank line

console.log(`🔧 Constraint update found (${constraintLines.length} lines)`);

// First chunk includes the constraint
currentChunk = [...constraintLines, ''];

let lineCount = 0;
for (let i = constraintEndIndex + 2; i < lines.length; i++) {
  const line = lines[i];
  currentChunk.push(line);
  lineCount++;
  
  // Split after each batch completion (ON CONFLICT line)
  if (line.includes('ON CONFLICT') && lineCount >= linesPerChunk) {
    chunks.push(currentChunk.join('\n'));
    currentChunk = [];
    lineCount = 0;
  }
}

// Add remaining lines as last chunk
if (currentChunk.length > 0) {
  chunks.push(currentChunk.join('\n'));
}

// Write chunks to files
console.log(`\n✂️  Splitting into ${chunks.length} parts...\n`);

chunks.forEach((chunk, index) => {
  const filename = `questions-insert-part${index + 1}.sql`;
  const filepath = `${outputDir}/${filename}`;
  fs.writeFileSync(filepath, chunk);
  
  const sizeKB = (chunk.length / 1024).toFixed(2);
  const lineCount = chunk.split('\n').length;
  console.log(`✅ ${filename}`);
  console.log(`   Size: ${sizeKB} KB | Lines: ${lineCount}`);
});

console.log(`\n🎉 Successfully split into ${chunks.length} files!`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Go to Supabase → SQL Editor`);
console.log(`   2. Run the parts IN ORDER:`);
chunks.forEach((_, index) => {
  console.log(`      ${index + 1}. questions-insert-part${index + 1}.sql`);
});
console.log(`   3. Wait for each to complete before running the next`);
console.log(`   4. Done! 🚀\n`);
