-- Migration: Add user_stats table for tracking daily unlocks and streaks
-- Created: 2025-01-26

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  total_questions_attempted INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  questions_unlocked_today INTEGER DEFAULT 5,
  last_unlock_reset TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- Enable Row Level Security
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow users to manage their own stats
-- For now, we're keeping it simple (Clerk handles auth on frontend)
-- In Week 5, we'll add proper JWT verification

CREATE POLICY "Enable read access for all users" ON user_stats
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for all users" ON user_stats
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON user_stats
  FOR UPDATE
  USING (true);

-- Note: In production (Week 5), replace these with proper user-scoped policies:
-- USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub')
