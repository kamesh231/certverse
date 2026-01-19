-- Migration: Add billing interval tracking for quarterly subscriptions
-- Created: 2026-01-19

-- Add billing interval to track monthly vs quarterly subscriptions
ALTER TABLE subscriptions 
ADD COLUMN billing_interval TEXT DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'quarterly'));

-- Add price_id to track which Polar price was used
ALTER TABLE subscriptions 
ADD COLUMN polar_price_id TEXT;

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_interval ON subscriptions(billing_interval);

-- Update existing subscriptions to 'monthly' (default already set)
COMMENT ON COLUMN subscriptions.billing_interval IS 'Billing period: monthly or quarterly';
COMMENT ON COLUMN subscriptions.polar_price_id IS 'Polar price ID used for this subscription';
