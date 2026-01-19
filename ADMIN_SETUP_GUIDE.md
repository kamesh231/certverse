# Admin Dashboard Setup Guide

Complete guide for setting up the admin dashboard and uploading questions.

---

## 1. Run Database Migration

### Option A: Using Migration Script (Recommended)

```bash
cd backend

# Run the migration
npx tsx scripts/run-migration.ts migrations/012_add_question_metadata.sql
```

### Option B: Run SQL Directly in Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy and paste the SQL from `backend/migrations/012_add_question_metadata.sql`
4. Click "Run"

The migration will:
- Add 6 new columns to questions table (difficulty, topic, question_id, reasoning, incorrect_rationale, enhanced_reasoning)
- Create indexes for performance
- Set up RLS policies

---

## 2. Configure Admin Access

### Set Up Admin Email(s)

Add to `backend/.env`:

```bash
# Admin emails (comma-separated)
ADMIN_EMAILS=your-email@example.com,another-admin@example.com
```

**Important:** Use the exact email addresses that your admins use to log into Clerk.

### Set Admin Role in Clerk Dashboard

1. Go to your Clerk Dashboard: https://dashboard.clerk.com
2. Navigate to **Users** → Select your admin user
3. Click **Metadata** tab
4. Under **Public Metadata**, add:

```json
{
  "role": "admin"
}
```

5. Click **Save**

**Note:** The admin page checks `user.publicMetadata.role === 'admin'`

---

## 3. Restart Backend

After adding environment variables:

```bash
cd backend
npm run dev  # Development
# or
npm run build && npm start  # Production
```

---

## 4. Access Admin Dashboard

Navigate to: **`http://localhost:3000/admin`** (or your production URL + `/admin`)

If you see "Access Denied":
- Verify your email is in `ADMIN_EMAILS`
- Verify your Clerk user has `role: "admin"` in public metadata
- Check backend logs for "Admin check for user:"

---

## 5. Upload Questions

### Step 1: Prepare CSV File

Create a tab-separated file with these columns:

```
ID	Domain	Difficulty	Topic	Question	Option A	Option B	Option C	Option D	Answer	Reasoning	Incorrect Rationale	Enhanced Reasoning
```

**Example Row:**
```
CISA-00001	Domain 2	Hard	IT Strategy Alignment	During a review of IT strategic alignment...	Option A text	Option B text	Option C text	Option D text	C	Basic explanation	Why others wrong	Full enhanced explanation with examples
```

### Step 2: Upload via Admin Dashboard

1. Go to `/admin`
2. Click "Choose File"
3. Select your CSV/TSV file
4. Review the preview:
   - ✅ Valid questions (green badge)
   - ❌ Invalid questions (red badge with errors)
5. Click "Upload X Valid Questions"
6. Wait for confirmation

### Step 3: Verify in Database

```sql
-- Check total questions
SELECT COUNT(*) FROM questions;

-- Check questions with metadata
SELECT 
  question_id,
  domain,
  difficulty,
  topic,
  substring(q_text, 1, 50) as question_preview
FROM questions
WHERE question_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

---

## 6. CSV Format Specification

### Required Columns

| Column | Type | Validation | Example |
|--------|------|-----------|---------|
| `ID` | string | Optional, unique if provided | CISA-00001 |
| `Domain` | string/number | "Domain 1" - "Domain 5" or 1-5 | Domain 2 |
| `Difficulty` | enum | Easy, Medium, Hard | Hard |
| `Topic` | string | Optional | IT Strategy Alignment |
| `Question` | string | Min 10 characters | What is the PRIMARY... |
| `Option A` | string | Required | First choice |
| `Option B` | string | Required | Second choice |
| `Option C` | string | Required | Third choice |
| `Option D` | string | Required | Fourth choice |
| `Answer` | enum | A, B, C, or D | C |
| `Reasoning` | string | Optional | Basic explanation |
| `Incorrect Rationale` | string | Optional | Why others are wrong |
| `Enhanced Reasoning` | string | Min 20 characters, used as primary explanation | Full detailed explanation |

### CSV Separator

Use **TAB** character (`\t`) to separate columns, not commas.

**Why tabs?** Question text and options often contain commas, which would break CSV parsing.

### Export from Excel/Google Sheets

**Excel:**
1. File → Save As
2. Choose "Text (Tab delimited) (*.txt)"

**Google Sheets:**
1. File → Download → Tab-separated values (.tsv)

---

## 7. SQL Queries for Supabase

### Run the Complete Migration

```sql
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
```

### Verify Schema Changes

```sql
-- Check if new columns exist
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'questions'
ORDER BY ordinal_position;
```

### Check Question Statistics

```sql
-- Total questions
SELECT COUNT(*) as total FROM questions;

-- By domain
SELECT domain, COUNT(*) as count
FROM questions
GROUP BY domain
ORDER BY domain;

-- By difficulty
SELECT difficulty, COUNT(*) as count
FROM questions
WHERE difficulty IS NOT NULL
GROUP BY difficulty;

-- By topic (top 10)
SELECT topic, COUNT(*) as count
FROM questions
WHERE topic IS NOT NULL
GROUP BY topic
ORDER BY count DESC
LIMIT 10;

-- Questions with full metadata
SELECT COUNT(*) as questions_with_metadata
FROM questions
WHERE difficulty IS NOT NULL 
  AND topic IS NOT NULL 
  AND enhanced_reasoning IS NOT NULL;
```

---

## 8. Troubleshooting

### Error: "Access Denied"

**Check:**
1. Email in `ADMIN_EMAILS` matches your Clerk login email exactly
2. Clerk user has `"role": "admin"` in public metadata
3. Backend restarted after adding env variable

**Debug:**
```bash
# Check backend logs
cd backend
npm run dev

# Look for:
# "Admin check for user: your-email@example.com"
# "Admin access granted for: your-email@example.com"
```

### Error: "Upload failed"

**Check:**
1. Backend is running
2. File format is tab-separated
3. All required columns are present
4. Validation errors in preview

**Debug:**
```bash
# Check backend logs for validation errors
cd backend
tail -f logs/*.log
```

### Error: "Failed to insert questions"

**Check:**
1. Supabase RLS policies allow service role access
2. Migration ran successfully
3. No duplicate `question_id` values

**Fix:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'questions';

-- Disable RLS temporarily (development only)
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
```

---

## 9. Production Deployment

### Vercel Environment Variables

Add in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### Railway Environment Variables

Add in Railway Dashboard → Variables:

```
ADMIN_EMAILS=admin1@example.com,admin2@example.com
SUPABASE_SERVICE_KEY=your_service_role_key
```

### Test Admin Access in Production

1. Deploy frontend and backend
2. Navigate to `https://yourapp.vercel.app/admin`
3. Verify access with admin credentials
4. Test uploading a small CSV (1-2 questions)
5. Verify questions appear in database

---

## 10. Security Considerations

### Backend Protection

✅ **Implemented:**
- JWT verification via `verifyAuth` middleware
- Email-based admin check via `ADMIN_EMAILS`
- Zod schema validation for all questions
- Batch processing with error handling

### Frontend Protection

✅ **Implemented:**
- Clerk publicMetadata role check
- Access denied message for non-admins
- File validation before upload
- Preview before inserting

### Best Practices

1. **Limit admin emails** - Only add trusted users
2. **Use separate environments** - Different admins for dev/prod
3. **Monitor uploads** - Check backend logs regularly
4. **Backup database** - Before large uploads
5. **Test in development** - Verify CSV format first

---

## 11. Quick Reference

### Files Created/Modified

**Backend:**
- `migrations/012_add_question_metadata.sql` - Database schema
- `src/api/admin-upload.ts` - Admin API endpoints
- `src/index.ts` - Register admin routes
- `src/lib/validation.ts` - Add difficulty to schema
- `src/api/get-question.ts` - Add difficulty filter

**Frontend:**
- `app/(dashboard)/admin/page.tsx` - Admin dashboard UI
- `lib/api.ts` - Add Question metadata fields & uploadQuestions function
- `app/(dashboard)/question/page.tsx` - Display topic & question_id badges

### Environment Variables

```bash
# Backend (.env)
ADMIN_EMAILS=your-email@example.com
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # Service role key

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Useful Commands

```bash
# Run migration
npx tsx scripts/run-migration.ts migrations/012_add_question_metadata.sql

# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Check question count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM questions;"
```

---

**Setup Complete!** 🎉

You can now access the admin dashboard at `/admin` and upload questions.
