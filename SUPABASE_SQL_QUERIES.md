# Supabase SQL Queries

All SQL queries needed to set up the question metadata feature.

---

## 1. Run the Complete Migration

**Copy and paste this entire block into Supabase SQL Editor:**

```sql
-- ============================================
-- Migration: Add question metadata fields
-- Created: 2026-01-19
-- ============================================

-- Add new columns to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS question_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS reasoning TEXT,
ADD COLUMN IF NOT EXISTS incorrect_rationale TEXT,
ADD COLUMN IF NOT EXISTS enhanced_reasoning TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_question_id ON questions(question_id);

-- Ensure RLS policies allow service role full access
DROP POLICY IF EXISTS "Service role can manage questions" ON questions;
CREATE POLICY "Service role can manage questions"
  ON questions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow public read access (questions are public content)
DROP POLICY IF EXISTS "Public read access to questions" ON questions;
CREATE POLICY "Public read access to questions"
  ON questions FOR SELECT
  USING (true);

-- Verify the changes
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'questions'
ORDER BY ordinal_position;
```

---

## 2. Verify Migration Completed

```sql
-- Check if new columns exist
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'questions'
  AND column_name IN ('difficulty', 'topic', 'question_id', 'reasoning', 'incorrect_rationale', 'enhanced_reasoning');
```

**Expected Output:**
```
column_name          | data_type
---------------------|----------
difficulty           | text
topic                | text
question_id          | text
reasoning            | text
incorrect_rationale  | text
enhanced_reasoning   | text
```

---

## 3. Check Database Statistics

### Total Questions

```sql
SELECT COUNT(*) as total_questions FROM questions;
```

### Questions by Domain

```sql
SELECT 
  domain,
  COUNT(*) as count
FROM questions
GROUP BY domain
ORDER BY domain;
```

### Questions by Difficulty

```sql
SELECT 
  COALESCE(difficulty, 'Not Set') as difficulty,
  COUNT(*) as count
FROM questions
GROUP BY difficulty
ORDER BY 
  CASE difficulty
    WHEN 'Easy' THEN 1
    WHEN 'Medium' THEN 2
    WHEN 'Hard' THEN 3
    ELSE 4
  END;
```

### Top Topics

```sql
SELECT 
  topic,
  COUNT(*) as count
FROM questions
WHERE topic IS NOT NULL
GROUP BY topic
ORDER BY count DESC
LIMIT 10;
```

### Questions with Complete Metadata

```sql
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN difficulty IS NOT NULL THEN 1 END) as with_difficulty,
  COUNT(CASE WHEN topic IS NOT NULL THEN 1 END) as with_topic,
  COUNT(CASE WHEN question_id IS NOT NULL THEN 1 END) as with_id,
  COUNT(CASE WHEN enhanced_reasoning IS NOT NULL THEN 1 END) as with_enhanced
FROM questions;
```

---

## 4. Sample Question Queries

### View Recent Questions with Metadata

```sql
SELECT 
  question_id,
  domain,
  difficulty,
  topic,
  SUBSTRING(q_text, 1, 80) as question_preview,
  answer,
  created_at
FROM questions
WHERE question_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Find Questions by Topic

```sql
SELECT 
  question_id,
  domain,
  difficulty,
  SUBSTRING(q_text, 1, 100) as question
FROM questions
WHERE topic ILIKE '%IT Strategy%'  -- Case-insensitive search
ORDER BY created_at DESC;
```

### Find Questions by Difficulty

```sql
SELECT 
  COUNT(*) as count,
  domain
FROM questions
WHERE difficulty = 'Hard'  -- Change to 'Easy', 'Medium', or 'Hard'
GROUP BY domain
ORDER BY domain;
```

---

## 5. Data Cleanup Queries

### Update Null Explanations to Use Enhanced Reasoning

```sql
-- If enhanced_reasoning exists but explanation is missing, copy it over
UPDATE questions
SET explanation = enhanced_reasoning
WHERE enhanced_reasoning IS NOT NULL 
  AND (explanation IS NULL OR explanation = '');
```

### Find Duplicate Question IDs

```sql
SELECT 
  question_id, 
  COUNT(*) as count
FROM questions
WHERE question_id IS NOT NULL
GROUP BY question_id
HAVING COUNT(*) > 1;
```

### Remove Duplicate Questions

```sql
-- Keep only the most recent duplicate
DELETE FROM questions a
USING questions b
WHERE a.question_id = b.question_id
  AND a.created_at < b.created_at;
```

---

## 6. Maintenance Queries

### Vacuum Table (Optimize Performance)

```sql
VACUUM ANALYZE questions;
```

### Rebuild Indexes

```sql
REINDEX TABLE questions;
```

### Check Table Size

```sql
SELECT 
  pg_size_pretty(pg_total_relation_size('questions')) as total_size,
  pg_size_pretty(pg_relation_size('questions')) as table_size,
  pg_size_pretty(pg_indexes_size('questions')) as indexes_size;
```

---

## 7. RLS Policy Management

### View Current Policies

```sql
SELECT 
  policyname as policy_name,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE tablename = 'questions';
```

### Disable RLS (Development Only - NOT RECOMMENDED FOR PRODUCTION)

```sql
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
```

### Enable RLS

```sql
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
```

---

## 8. Troubleshooting Queries

### Check Missing Indexes

```sql
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'questions'
  AND schemaname = 'public';
```

### Find Questions with Validation Issues

```sql
-- Questions with invalid domains
SELECT question_id, domain, q_text
FROM questions
WHERE domain NOT BETWEEN 1 AND 5;

-- Questions with invalid difficulty
SELECT question_id, difficulty, q_text
FROM questions
WHERE difficulty IS NOT NULL 
  AND difficulty NOT IN ('Easy', 'Medium', 'Hard');

-- Questions with invalid answers
SELECT question_id, answer, q_text
FROM questions
WHERE answer NOT IN ('A', 'B', 'C', 'D');

-- Questions missing required fields
SELECT question_id, q_text
FROM questions
WHERE q_text IS NULL 
   OR choice_a IS NULL 
   OR choice_b IS NULL
   OR choice_c IS NULL
   OR choice_d IS NULL
   OR answer IS NULL;
```

---

## 9. Backup and Restore

### Export Questions to CSV

```sql
COPY (
  SELECT 
    question_id,
    domain,
    difficulty,
    topic,
    q_text,
    choice_a,
    choice_b,
    choice_c,
    choice_d,
    answer,
    reasoning,
    incorrect_rationale,
    enhanced_reasoning
  FROM questions
  ORDER BY created_at
) TO '/tmp/questions_backup.csv' WITH CSV HEADER;
```

**Note:** This requires superuser access. Alternative: Use Supabase Dashboard → Table Editor → Export to CSV

### Count Before/After Upload

```sql
-- Run BEFORE upload
SELECT COUNT(*) as questions_before FROM questions;

-- Run AFTER upload
SELECT COUNT(*) as questions_after FROM questions;

-- Show difference
SELECT 
  (SELECT COUNT(*) FROM questions) - 
  (SELECT COUNT(*) FROM questions WHERE created_at < NOW() - INTERVAL '1 hour')
  AS questions_added_in_last_hour;
```

---

## 10. Performance Optimization

### Analyze Query Performance

```sql
EXPLAIN ANALYZE
SELECT * FROM questions
WHERE difficulty = 'Hard' 
  AND domain = 2
  AND topic ILIKE '%Strategy%'
LIMIT 10;
```

### Create Additional Indexes (if needed)

```sql
-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_questions_domain_difficulty 
ON questions(domain, difficulty);

-- Full-text search index for topics
CREATE INDEX IF NOT EXISTS idx_questions_topic_gin 
ON questions USING GIN (to_tsvector('english', topic));
```

---

## Quick Reference Commands

```bash
# Connect to Supabase via psql (if you have connection string)
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres"

# Or use Supabase CLI
supabase db reset  # Reset database (DESTRUCTIVE)
supabase db push   # Push migrations
```

---

**All queries are safe to run multiple times (using IF NOT EXISTS clauses).**
