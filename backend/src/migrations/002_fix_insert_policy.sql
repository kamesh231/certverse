-- Fix RLS policies to allow service role to insert questions
-- Run this in Supabase SQL Editor if seeding fails

-- Temporarily disable RLS on questions table for seeding
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;

-- OR keep RLS enabled but add proper policy for service role
-- (Uncomment this section if you prefer to keep RLS always enabled)
/*
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Drop existing insert policy for service role if any
DROP POLICY IF EXISTS "Service role can insert questions" ON questions;
DROP POLICY IF EXISTS "Enable insert for service role" ON questions;

-- Create new policy for service role to insert
CREATE POLICY "Enable insert for service role"
  ON questions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Also allow service role to do everything (alternative approach)
DROP POLICY IF EXISTS "Service role full access" ON questions;
CREATE POLICY "Service role full access"
  ON questions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
*/
