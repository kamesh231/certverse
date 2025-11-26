# Database Migrations

This directory contains SQL migration files for the Certverse database.

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the contents of the migration file (e.g., `002_user_stats.sql`)
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify success in the output panel

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Install CLI (if not installed)
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push
```

### Option 3: Direct SQL (Node.js)

```typescript
import { supabase } from '../lib/supabase';
import fs from 'fs';

const migrationSQL = fs.readFileSync('./migrations/002_user_stats.sql', 'utf-8');
const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

if (error) console.error('Migration failed:', error);
else console.log('Migration successful!');
```

## Migration History

### 001_initial_schema.sql
- Created `questions` table
- Created `responses` table
- Added RLS policies
- Status: ✅ Complete

### 002_user_stats.sql
- Created `user_stats` table for daily unlock tracking
- Added streak tracking fields
- Added RLS policies
- Status: ⏳ Pending (run this now!)

## Verifying Migration Success

After running `002_user_stats.sql`, verify it worked:

```sql
-- Check if table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'user_stats';

-- Check table structure
\d user_stats

-- Or in Supabase dashboard:
SELECT * FROM user_stats LIMIT 1;
```

You should see the `user_stats` table with all columns.

## Next Steps After Migration

1. Test inserting a row:
```sql
INSERT INTO user_stats (user_id, current_streak, questions_unlocked_today)
VALUES ('test_user_123', 1, 5);
```

2. Verify the row exists:
```sql
SELECT * FROM user_stats WHERE user_id = 'test_user_123';
```

3. Clean up test data:
```sql
DELETE FROM user_stats WHERE user_id = 'test_user_123';
```

## Troubleshooting

### Error: "relation 'user_stats' already exists"
The table is already created. Skip this migration or run:
```sql
DROP TABLE IF EXISTS user_stats CASCADE;
```
Then re-run the migration.

### Error: "permission denied"
Check that your database user has CREATE TABLE permissions.

### RLS Blocking Queries
If you can't read/write data, temporarily disable RLS for testing:
```sql
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
```
(Re-enable in production!)
