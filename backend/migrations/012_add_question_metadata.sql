-- Migration: Add question metadata fields
-- Created: 2026-01-19
-- Description: Adds difficulty, topic, question_id, and enhanced reasoning fields to questions table

-- Add new columns to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS question_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS reasoning TEXT,
ADD COLUMN IF NOT EXISTS incorrect_rationale TEXT,
ADD COLUMN IF NOT EXISTS enhanced_reasoning TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_question_id ON questions(question_id);

-- Ensure RLS policies allow service role full access
DROP POLICY IF EXISTS "Service role can manage questions" ON questions;
CREATE POLICY "Service role can manage questions"
  ON questions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow public read access (questions are public content)
DROP POLICY IF EXISTS "Public read access to questions" ON questions;
CREATE POLICY "Public read access to questions"
  ON questions FOR SELECT
  USING (true);

-- Verify the changes
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'questions'
ORDER BY ordinal_position;
