-- Migration: Add onboarding tracking
-- Created: 2025-11-29

-- User onboarding state
CREATE TABLE IF NOT EXISTS user_onboarding (
  user_id VARCHAR PRIMARY KEY,

  -- Onboarding progress
  completed BOOLEAN DEFAULT false,
  current_step VARCHAR DEFAULT 'welcome',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- User selections during onboarding
  primary_goal VARCHAR,
  target_certification VARCHAR,
  experience_level VARCHAR,
  study_time_per_week INT,
  target_exam_date DATE,

  -- Assessment results
  assessment_score INT,
  assessment_completed BOOLEAN DEFAULT false,
  weak_topics TEXT[],
  strong_topics TEXT[]

  -- Onboarding steps completed
  steps_completed JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User goals and preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id VARCHAR PRIMARY KEY,

  -- Study preferences
  daily_reminder_time TIME DEFAULT '09:00:00',
  reminder_enabled BOOLEAN DEFAULT true,
  preferred_difficulty VARCHAR DEFAULT 'medium',
  questions_per_session INT DEFAULT 10,

  -- Notification preferences
  email_daily_reminder BOOLEAN DEFAULT true,
  email_streak_warning BOOLEAN DEFAULT true,
  email_weekly_report BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,

  -- Display preferences
  show_hints BOOLEAN DEFAULT true,
  show_timer BOOLEAN DEFAULT false,
  dark_mode BOOLEAN DEFAULT false,

  -- Learning preferences
  focus_areas TEXT[],
  skip_known_topics BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding assessment questions
CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR NOT NULL,
  topic VARCHAR NOT NULL,
  difficulty VARCHAR DEFAULT 'medium',
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option VARCHAR NOT NULL,
  explanation TEXT,

  -- Assessment metadata
  assessment_type VARCHAR DEFAULT 'initial',
  order_index INT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User assessment responses
CREATE TABLE IF NOT EXISTS assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  assessment_question_id UUID REFERENCES assessment_questions(id),
  selected_option VARCHAR,
  is_correct BOOLEAN,
  time_taken_seconds INT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding tips/tooltips shown
CREATE TABLE IF NOT EXISTS onboarding_tips_shown (
  user_id VARCHAR,
  tip_id VARCHAR,
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed BOOLEAN DEFAULT false,

  PRIMARY KEY (user_id, tip_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON user_onboarding(completed);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_current_step ON user_onboarding(current_step);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_user ON assessment_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tips_user ON onboarding_tips_shown(user_id);

-- Add comments
COMMENT ON TABLE user_onboarding IS 'Tracks user onboarding progress and selections';
COMMENT ON TABLE user_preferences IS 'User study and notification preferences';
COMMENT ON TABLE assessment_questions IS 'Questions used for initial skill assessment';
COMMENT ON TABLE assessment_responses IS 'User responses during assessment';
COMMENT ON TABLE onboarding_tips_shown IS 'Tracks which onboarding tips have been shown to users';
