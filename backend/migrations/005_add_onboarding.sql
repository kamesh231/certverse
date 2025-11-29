-- Migration: Add onboarding tracking
-- Created: 2025-11-29

-- User onboarding state
CREATE TABLE IF NOT EXISTS user_onboarding (
  user_id VARCHAR PRIMARY KEY,

  -- Onboarding progress
  completed BOOLEAN DEFAULT false,
  current_step VARCHAR DEFAULT 'welcome', -- 'welcome', 'goal', 'assessment', 'learning_path', 'first_question', 'completed'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- User selections during onboarding
  primary_goal VARCHAR, -- 'certification', 'career_change', 'skill_improvement', 'interview_prep'
  target_certification VARCHAR, -- 'aws-saa', 'cka', 'azure-admin', etc.
  experience_level VARCHAR, -- 'beginner', 'intermediate', 'advanced'
  study_time_per_week INT, -- Hours per week
  target_exam_date DATE,

  -- Assessment results
  assessment_score INT, -- 0-100
  assessment_completed BOOLEAN DEFAULT false,
  weak_topics TEXT[], -- ['networking', 'security']
  strong_topics TEXT[], -- ['compute', 'storage']

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
  preferred_difficulty VARCHAR DEFAULT 'medium', -- 'easy', 'medium', 'hard', 'mixed'
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
  focus_areas TEXT[], -- Specific topics to focus on
  skip_known_topics BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding assessment questions
CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR NOT NULL, -- 'aws', 'azure', 'gcp', 'kubernetes'
  topic VARCHAR NOT NULL, -- 'compute', 'networking', 'security', etc.
  difficulty VARCHAR DEFAULT 'medium',
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- [{"id": "a", "text": "..."}, ...]
  correct_option VARCHAR NOT NULL,
  explanation TEXT,

  -- Assessment metadata
  assessment_type VARCHAR DEFAULT 'initial', -- 'initial', 'skill_check'
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
  tip_id VARCHAR, -- 'first_question', 'streak_explained', 'upgrade_benefits'
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
