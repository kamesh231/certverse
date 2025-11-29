-- Migration: Add trial tracking to prevent multiple trials
-- Created: 2025-11-29

-- Add trial tracking fields to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS trial_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN DEFAULT FALSE;

-- Create index for trial lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial ON subscriptions(user_id, has_used_trial);

-- Update existing trialing subscriptions
UPDATE subscriptions
SET has_used_trial = TRUE
WHERE status = 'trialing' OR status = 'active';

-- Add comment
COMMENT ON COLUMN subscriptions.trial_start IS 'When the trial period started';
COMMENT ON COLUMN subscriptions.trial_end IS 'When the trial period ends/ended';
COMMENT ON COLUMN subscriptions.has_used_trial IS 'Whether user has ever used a trial (prevents repeat trials)';
