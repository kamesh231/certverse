-- Migration: Add timezone column to user_preferences
-- Created: 2025-12-09

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS timezone VARCHAR DEFAULT 'America/New_York';

COMMENT ON COLUMN user_preferences.timezone IS 'User timezone for scheduling and notifications';


