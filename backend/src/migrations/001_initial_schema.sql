-- Certverse Database Schema - Initial Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- TABLE: questions
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain INTEGER NOT NULL CHECK (domain >= 1 AND domain <= 4),
  q_text TEXT NOT NULL,
  choice_a TEXT NOT NULL,
  choice_b TEXT NOT NULL,
  choice_c TEXT NOT NULL,
  choice_d TEXT NOT NULL,
  answer TEXT NOT NULL CHECK (answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: responses
-- ============================================
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_choice TEXT NOT NULL CHECK (selected_choice IN ('A', 'B', 'C', 'D')),
  correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_responses_user_id ON responses(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON responses(question_id);
CREATE INDEX IF NOT EXISTS idx_questions_domain ON questions(domain);
CREATE INDEX IF NOT EXISTS idx_responses_user_question ON responses(user_id, question_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can read all questions" ON questions;
DROP POLICY IF EXISTS "Users can insert their own responses" ON responses;
DROP POLICY IF EXISTS "Users can read their own responses" ON responses;

-- Questions: All authenticated users can read
CREATE POLICY "Authenticated users can read all questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Questions: Service role can insert (for seeding)
DROP POLICY IF EXISTS "Service role can insert questions" ON questions;
CREATE POLICY "Service role can insert questions"
  ON questions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Responses: Users can only insert their own
CREATE POLICY "Users can insert their own responses"
  ON responses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- Responses: Users can only read their own
CREATE POLICY "Users can read their own responses"
  ON responses
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Responses: Service role can read all (for admin/analytics)
DROP POLICY IF EXISTS "Service role can read all responses" ON responses;
CREATE POLICY "Service role can read all responses"
  ON responses
  FOR SELECT
  TO service_role
  USING (true);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the setup:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- SELECT * FROM pg_policies WHERE tablename IN ('questions', 'responses');
