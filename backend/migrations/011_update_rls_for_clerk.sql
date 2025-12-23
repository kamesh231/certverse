-- Migration: Update RLS policies for Clerk authentication
-- Since Clerk doesn't set Supabase auth.uid(), we use service role key
-- Backend enforces authorization via JWT verification
-- Created: 2025-01-XX

-- ============================================
-- RESPONSES TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own responses" ON responses;
DROP POLICY IF EXISTS "Users can read their own responses" ON responses;

-- Allow service role full access (backend handles auth via JWT)
CREATE POLICY "Service role can insert responses"
  ON responses
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read responses"
  ON responses
  FOR SELECT
  TO service_role
  USING (true);

-- ============================================
-- USER_STATS TABLE
-- ============================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON user_stats;
DROP POLICY IF EXISTS "Enable insert for all users" ON user_stats;
DROP POLICY IF EXISTS "Enable update for all users" ON user_stats;

-- Restrict to service role only
CREATE POLICY "Service role can read user_stats"
  ON user_stats
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert user_stats"
  ON user_stats
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update user_stats"
  ON user_stats
  FOR UPDATE
  TO service_role
  USING (true);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;

-- Restrict to service role only
CREATE POLICY "Service role can read subscriptions"
  ON subscriptions
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert subscriptions"
  ON subscriptions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update subscriptions"
  ON subscriptions
  FOR UPDATE
  TO service_role
  USING (true);

-- ============================================
-- QUESTION_ACCESSES TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own question accesses" ON question_accesses;
DROP POLICY IF EXISTS "Service can insert question accesses" ON question_accesses;

-- Restrict to service role only
CREATE POLICY "Service role can read question_accesses"
  ON question_accesses
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert question_accesses"
  ON question_accesses
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================
-- USER_ONBOARDING TABLE (if exists)
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own onboarding" ON user_onboarding;
DROP POLICY IF EXISTS "Users can insert own onboarding" ON user_onboarding;
DROP POLICY IF EXISTS "Users can update own onboarding" ON user_onboarding;

-- Restrict to service role only
CREATE POLICY "Service role can read user_onboarding"
  ON user_onboarding
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert user_onboarding"
  ON user_onboarding
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update user_onboarding"
  ON user_onboarding
  FOR UPDATE
  TO service_role
  USING (true);

-- ============================================
-- TOPIC_CONFIDENCE TABLE (if exists)
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own topic_confidence" ON topic_confidence;
DROP POLICY IF EXISTS "Users can insert own topic_confidence" ON topic_confidence;
DROP POLICY IF EXISTS "Users can update own topic_confidence" ON topic_confidence;

-- Restrict to service role only
CREATE POLICY "Service role can read topic_confidence"
  ON topic_confidence
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert topic_confidence"
  ON topic_confidence
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update topic_confidence"
  ON topic_confidence
  FOR UPDATE
  TO service_role
  USING (true);

-- ============================================
-- QUESTIONS TABLE
-- ============================================

-- Keep questions readable by all (public questions)
-- Service role can insert (for seeding)
-- No changes needed for questions table

-- ============================================
-- NOTES
-- ============================================
-- This migration updates RLS policies to work with Clerk authentication.
-- Since Clerk doesn't set Supabase's auth.uid(), we use service role key.
-- Backend enforces authorization via JWT verification middleware.
-- All user-specific data access is controlled by backend JWT verification.

