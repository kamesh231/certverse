-- Migration: Add subscriptions table for Polar.sh integration
-- Created: 2025-01-26

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'free', -- 'free', 'paid', 'coach'

  -- Polar.sh specific fields
  polar_customer_id TEXT,
  polar_subscription_id TEXT,
  polar_product_id TEXT,

  -- Subscription status
  status TEXT DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'trialing'

  -- Dates
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,

  -- Metadata
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_polar_customer ON subscriptions(polar_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own subscription" ON subscriptions
  FOR SELECT
  USING (true); -- Allow all reads for now (Clerk handles auth on frontend)

CREATE POLICY "Users can insert own subscription" ON subscriptions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own subscription" ON subscriptions
  FOR UPDATE
  USING (true);

-- Create default free subscription for existing users
-- This ensures all users have a subscription record
INSERT INTO subscriptions (user_id, plan_type, status)
SELECT DISTINCT user_id, 'free', 'active'
FROM user_stats
WHERE user_id NOT IN (SELECT user_id FROM subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscriptions_timestamp
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();
