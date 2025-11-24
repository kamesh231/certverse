# Fix RLS Policy Error When Seeding

## The Error
```
❌ Error inserting questions: {
  code: '42501',
  message: 'new row violates row-level security policy for table "questions"'
}
```

## What This Means
Row Level Security (RLS) is blocking the INSERT operation. Even though you're using the `service_role` key (which should bypass RLS), Supabase still applies RLS policies in some cases.

---

## ✅ SOLUTION 1: Disable RLS (Recommended for Development)

**Fastest fix - takes 30 seconds:**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this command:

```sql
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
```

3. Run seed again:
```bash
npm run seed
```

4. **Done!** Questions will be inserted successfully.

> **Note:** For development, disabling RLS on `questions` is fine since they're public data anyway. Users can only read them, not modify.

---

## ✅ SOLUTION 2: Use Direct SQL Insert

**If Solution 1 doesn't work:**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open the file: `src/seed/insert_questions.sql`
3. **Copy entire contents**
4. **Paste into SQL Editor**
5. Click **"Run"**

This file contains:
- Command to temporarily disable RLS
- 20 INSERT statements for all questions
- Command to re-enable RLS
- Verification queries

**Expected output:**
```
Success. 20 rows affected.
```

---

## ✅ SOLUTION 3: Fix RLS Policies (Keep Security Enabled)

**If you want to keep RLS enabled:**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run these commands:

```sql
-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert
DROP POLICY IF EXISTS "Service role can insert questions" ON questions;
CREATE POLICY "Service role can insert questions"
  ON questions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

3. Verify service_role key in `.env`:
```bash
SUPABASE_SERVICE_KEY=eyJxxxx  # Must be service_role, not anon key!
```

4. Run seed again:
```bash
npm run seed
```

---

## How to Check Which Key You're Using

### Service Role Key (Correct ✅)
- Found in: Supabase Dashboard → Settings → API → `service_role` secret
- Starts with: `eyJ...`
- Length: Very long (~300+ characters)
- **This bypasses RLS**

### Anon Key (Wrong ❌)
- Found in: Supabase Dashboard → Settings → API → `anon` public
- Also starts with: `eyJ...`
- **This does NOT bypass RLS**

**Make sure your `.env` has the `service_role` key!**

---

## Verification After Seeding

Run this in SQL Editor to verify:

```sql
-- Count questions
SELECT COUNT(*) as total FROM questions;

-- Count by domain
SELECT domain, COUNT(*) as count
FROM questions
GROUP BY domain
ORDER BY domain;
```

**Expected output:**
```
total | 20

domain | count
-------+------
1      | 5
2      | 5
3      | 5
4      | 5
```

---

## Why This Happens

Supabase RLS policies can be strict even for service role keys when:
1. Policies are misconfigured
2. The client isn't properly authenticated
3. Multiple conflicting policies exist

The easiest solution for development is to **disable RLS on the `questions` table** since:
- Questions are public data (everyone can read them)
- Only admins insert questions (during seeding)
- Security is enforced on the `responses` table (user-specific data)

---

## After Fixing

Once questions are seeded, test your API:

```bash
# Start server
npm run dev

# Test question endpoint
curl "http://localhost:3001/api/question?userId=test-123"
```

You should see a random question returned!

---

## Still Having Issues?

1. **Check `.env` file exists:**
   ```bash
   cat .env
   ```

2. **Verify Supabase URL is correct:**
   ```bash
   echo $SUPABASE_URL
   ```

3. **Test connection:**
   ```bash
   npm run dev
   ```
   Look for: `✅ Database connected successfully`

4. **Check Supabase logs:**
   - Dashboard → Logs → API Logs
   - Look for any error messages

---

## Quick Reference Commands

```bash
# Check current questions
curl http://localhost:3001/api/question-count

# Reseed (delete and re-insert)
npm run seed -- --force

# Test API
./test-api.sh
```

---

**Recommended:** Use **Solution 1** (disable RLS) for development. It's the simplest and fastest fix!
