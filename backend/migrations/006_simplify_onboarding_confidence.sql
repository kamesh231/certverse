-- Migration: Simplify onboarding with confidence ratings instead of assessment
-- Created: 2025-11-29

-- Remove assessment tables (if they were created from previous migration)
DROP TABLE IF EXISTS assessment_responses;
DROP TABLE IF EXISTS assessment_questions;

-- Update user_onboarding table
ALTER TABLE user_onboarding
DROP COLUMN IF EXISTS assessment_score,
DROP COLUMN IF EXISTS assessment_completed,
DROP COLUMN IF EXISTS weak_topics,
DROP COLUMN IF EXISTS strong_topics;

-- Add confidence ratings field
ALTER TABLE user_onboarding
ADD COLUMN IF NOT EXISTS confidence_ratings JSONB DEFAULT '{}'::jsonb;

-- Update current_step to reflect new flow
-- New flow: 'welcome' → 'goal' → 'confidence' → 'first_question' → 'completed'

-- Add topic confidence tracking table (optional, for detailed tracking)
CREATE TABLE IF NOT EXISTS topic_confidence (
  user_id VARCHAR,
  topic VARCHAR, -- 'compute', 'networking', 'security', 'storage', etc.
  confidence_level INT CHECK (confidence_level >= 1 AND confidence_level <= 10),
  category VARCHAR, -- 'aws', 'azure', 'gcp', 'cisa', etc.
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (user_id, topic, category)
);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_topic_confidence_user ON topic_confidence(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_confidence_low ON topic_confidence(confidence_level) WHERE confidence_level <= 5;

-- Function to calculate recommended difficulty based on confidence
CREATE OR REPLACE FUNCTION get_recommended_difficulty(confidence INT)
RETURNS VARCHAR AS $$
BEGIN
  CASE
    WHEN confidence <= 3 THEN RETURN 'easy';
    WHEN confidence <= 6 THEN RETURN 'medium';
    WHEN confidence <= 8 THEN RETURN 'hard';
    ELSE RETURN 'mixed';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON COLUMN user_onboarding.confidence_ratings IS 'JSON object with topic confidence ratings (1-10 scale)';
COMMENT ON TABLE topic_confidence IS 'User self-assessed confidence levels per topic';
COMMENT ON FUNCTION get_recommended_difficulty IS 'Returns recommended question difficulty based on confidence level (1-10)';
