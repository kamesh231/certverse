/**
 * Template for bulk question insertion
 * 
 * This script provides a template for importing large numbers of questions
 * from CSV or JSON files into the database.
 * 
 * Usage:
 * 1. Prepare your questions in the format shown below
 * 2. Update the questions array with your data
 * 3. Run: npm run seed:bulk (or tsx src/seed/bulk-questions-template.ts)
 */

import { supabase } from '../lib/supabase';
import logger from '../lib/logger';

interface QuestionInput {
  domain: number;
  q_text: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

// Example questions array - replace with your actual questions
const questions: QuestionInput[] = [
  // Example question format:
  // {
  //   domain: 1,
  //   q_text: 'What is the PRIMARY role of an IS auditor?',
  //   choice_a: 'To design information systems',
  //   choice_b: 'To implement security controls',
  //   choice_c: 'To evaluate and assess information systems',
  //   choice_d: 'To manage IT operations',
  //   answer: 'C',
  //   explanation: 'The primary role of an IS auditor is to evaluate and assess information systems, controls, and processes to ensure they meet organizational objectives and comply with policies and regulations.',
  //   difficulty: 'medium',
  // },
  // Add your questions here...
];

/**
 * Validate a single question
 */
function validateQuestion(q: QuestionInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!q.domain || q.domain < 1 || q.domain > 5) {
    errors.push('Domain must be between 1 and 5');
  }

  if (!q.q_text || q.q_text.trim().length < 10) {
    errors.push('Question text must be at least 10 characters');
  }

  if (!q.choice_a || !q.choice_b || !q.choice_c || !q.choice_d) {
    errors.push('All four answer choices (A, B, C, D) are required');
  }

  if (!['A', 'B', 'C', 'D'].includes(q.answer)) {
    errors.push('Answer must be A, B, C, or D');
  }

  if (!q.explanation || q.explanation.trim().length < 20) {
    errors.push('Explanation must be at least 20 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check for duplicate questions
 */
async function checkDuplicates(questions: QuestionInput[]): Promise<string[]> {
  const duplicates: string[] = [];
  const seen = new Set<string>();

  for (const q of questions) {
    const key = q.q_text.toLowerCase().trim();
    if (seen.has(key)) {
      duplicates.push(q.q_text);
    }
    seen.add(key);
  }

  return duplicates;
}

/**
 * Import questions in batches
 */
async function importQuestions(
  questions: QuestionInput[],
  batchSize: number = 100
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  // Validate all questions first
  logger.info(`Validating ${questions.length} questions...`);
  const invalidQuestions: QuestionInput[] = [];

  for (const q of questions) {
    const validation = validateQuestion(q);
    if (!validation.valid) {
      invalidQuestions.push(q);
      errors.push(`Invalid question: ${q.q_text.substring(0, 50)}... - ${validation.errors.join(', ')}`);
    }
  }

  if (invalidQuestions.length > 0) {
    logger.error(`Found ${invalidQuestions.length} invalid questions. Please fix them before importing.`);
    return { success: 0, failed: invalidQuestions.length, errors };
  }

  // Check for duplicates
  logger.info('Checking for duplicates...');
  const duplicates = await checkDuplicates(questions);
  if (duplicates.length > 0) {
    logger.warn(`Found ${duplicates.length} duplicate questions. They will be skipped.`);
    // Remove duplicates
    const uniqueQuestions = questions.filter((q, index, self) =>
      index === self.findIndex((q2) => q2.q_text.toLowerCase().trim() === q.q_text.toLowerCase().trim())
    );
    questions = uniqueQuestions;
  }

  // Import in batches
  logger.info(`Importing ${questions.length} questions in batches of ${batchSize}...`);

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    logger.info(`Importing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(questions.length / batchSize)}...`);

    try {
      // Prepare data for insertion (remove difficulty if not in schema)
      const insertData = batch.map((q) => ({
        domain: q.domain,
        q_text: q.q_text.trim(),
        choice_a: q.choice_a.trim(),
        choice_b: q.choice_b.trim(),
        choice_c: q.choice_c.trim(),
        choice_d: q.choice_d.trim(),
        answer: q.answer,
        explanation: q.explanation.trim(),
        // Add difficulty if column exists in schema
        // difficulty: q.difficulty,
      }));

      const { error } = await supabase.from('questions').insert(insertData);

      if (error) {
        logger.error(`Error importing batch ${Math.floor(i / batchSize) + 1}:`, error);
        failed += batch.length;
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        success += batch.length;
        logger.info(`Successfully imported ${batch.length} questions`);
      }
    } catch (error: any) {
      logger.error(`Error importing batch ${Math.floor(i / batchSize) + 1}:`, error);
      failed += batch.length;
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
    }
  }

  return { success, failed, errors };
}

/**
 * Main function
 */
async function main() {
  logger.info('Starting bulk question import...');
  logger.info(`Total questions to import: ${questions.length}`);

  if (questions.length === 0) {
    logger.warn('No questions to import. Please add questions to the questions array.');
    return;
  }

  // Validate and import
  const result = await importQuestions(questions);

  // Summary
  logger.info('Import complete!');
  logger.info(`Successfully imported: ${result.success}`);
  logger.info(`Failed: ${result.failed}`);

  if (result.errors.length > 0) {
    logger.error('Errors encountered:');
    result.errors.forEach((error) => logger.error(`  - ${error}`));
  }

  // Verify import
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  logger.info(`Total questions in database: ${count}`);
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => {
      logger.info('Bulk import completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Bulk import failed:', error);
      process.exit(1);
    });
}

export { importQuestions, validateQuestion, checkDuplicates };

