# Fix: Questions in DB but API Returns 0

## The Problem
- ✅ 20 questions inserted into Supabase
- ❌ API returns `{"count": 0}`
- **Cause:** RLS is blocking SELECT queries

---

## ✅ QUICK FIX (Choose One)

### Option 1: Disable RLS Completely (Recommended)

Run this in **Supabase SQL Editor**:

```sql
-- Disable RLS on questions (public data, safe to expose)
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;

-- Verify questions are readable
SELECT COUNT(*) FROM questions;
```

**Why this works:**
- Questions are public data (everyone can read them)
- No sensitive info in questions
- Simplest solution for development

---

### Option 2: Fix RLS Policy to Allow Reads

If you want to keep RLS enabled, run this:

```sql
-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Authenticated users can read all questions" ON questions;
DROP POLICY IF EXISTS "Enable read access for all users" ON questions;
DROP POLICY IF EXISTS "Public read access" ON questions;

-- Create new policy: Allow ANYONE to read questions (even unauthenticated)
CREATE POLICY "Public read access to questions"
  ON questions
  FOR SELECT
  USING (true);

-- Allow service role to do everything
CREATE POLICY "Service role full access"
  ON questions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify
SELECT COUNT(*) FROM questions;
```

**Why this works:**
- Allows public SELECT (no auth required)
- Your backend uses service_role key which bypasses RLS anyway
- Questions are public data, so no security risk

---

## 🔍 Diagnose the Issue

Run this in **Supabase SQL Editor** to check current state:

```sql
-- 1. Check if questions exist
SELECT COUNT(*) as total_questions FROM questions;

-- 2. Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'questions';

-- 3. Check current policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'questions';
```

**Expected Results:**

**Query 1:** Should show `20`
```
total_questions
---------------
20
```

**Query 2:** Shows if RLS is enabled
```
rowsecurity
-----------
t (enabled) or f (disabled)
```

**Query 3:** Shows all policies on questions table

---

## 🧪 Test After Fix

After running the fix, test your API:

```bash
# 1. Restart your backend
npm run dev

# 2. Test question count endpoint
curl http://localhost:3001/api/question-count

# Expected: {"count": 20}

# 3. Test get random question
curl "http://localhost:3001/api/question?userId=test-123"

# Expected: Full question object with choices
```

---

## 📊 Understanding the Issue

### What Happened:
1. You ran the initial migration with RLS enabled
2. You disabled RLS to insert questions ✅
3. But RLS got re-enabled (maybe from migration script)
4. Now SELECT queries are blocked ❌

### Why Backend Can't Read:
Even with `service_role` key, if there's a restrictive policy like:
```sql
-- Bad policy: Only allows authenticated users
CREATE POLICY "Authenticated users only"
  ON questions FOR SELECT TO authenticated
  USING (true);
```

The backend call might fail because:
- Service role bypasses RLS in theory
- But Supabase client might not be properly configured
- Safest: Either disable RLS or allow public SELECT

---

## 🎯 Recommended Solution

**For Development:**
```sql
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
```

**For Production:**
```sql
-- Keep RLS enabled but allow public reads
CREATE POLICY "Public read access to questions"
  ON questions FOR SELECT USING (true);
```

Both are secure because:
- Questions contain no sensitive data
- Users can't INSERT/UPDATE/DELETE (only you can via backend)
- `responses` table still has RLS protection

---

## 🔧 If Still Not Working

### Check Backend Connection:

```bash
npm run dev
```

Look for this output:
```
✅ Database connected successfully
📝 Questions in database: 20  ← Should show 20
```

If it shows 0, then RLS is still blocking.

### Verify Service Key:

Check `.env` file:
```bash
cat .env | grep SUPABASE_SERVICE_KEY
```

Should be a very long key (300+ chars) starting with `eyJ...`

If it's short or missing, get the correct key:
1. Supabase Dashboard → Settings → API
2. Copy `service_role` secret (NOT `anon` public)
3. Update `.env`

---

## ✅ Complete Fix Script

Run this entire block in **Supabase SQL Editor**:

```sql
-- COMPLETE FIX: Disable RLS and verify

-- Disable RLS on questions
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on responses (user data)
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Verify questions are readable
SELECT 'Total Questions:' as check, COUNT(*)::text as value FROM questions
UNION ALL
SELECT 'Domain 1:' as check, COUNT(*)::text as value FROM questions WHERE domain = 1
UNION ALL
SELECT 'Domain 2:' as check, COUNT(*)::text as value FROM questions WHERE domain = 2
UNION ALL
SELECT 'Domain 3:' as check, COUNT(*)::text as value FROM questions WHERE domain = 3
UNION ALL
SELECT 'Domain 4:' as check, COUNT(*)::text as value FROM questions WHERE domain = 4;

-- Check RLS status
SELECT
  tablename,
  CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as rls_status
FROM pg_tables
WHERE tablename IN ('questions', 'responses')
ORDER BY tablename;
```

**Expected Output:**
```
check            | value
-----------------+-------
Total Questions: | 20
Domain 1:        | 5
Domain 2:        | 5
Domain 3:        | 5
Domain 4:        | 5

tablename  | rls_status
-----------+-----------
questions  | Disabled
responses  | Enabled
```

---

**Do this now:** Copy the complete fix script above and run it in Supabase SQL Editor. Then restart your backend and test!
