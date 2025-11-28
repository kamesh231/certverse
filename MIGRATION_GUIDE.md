# Run Subscription Migration

## Steps to run the migration:

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project: `mwpjthedrvhldzktyfee`

2. **Open SQL Editor:**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and paste the migration SQL:**
   - Open `backend/migrations/003_subscriptions.sql`
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Run the migration:**
   - Click "Run" or press Cmd/Ctrl + Enter
   - You should see "Success. No rows returned"

5. **Verify the table was created:**
   - Go to "Table Editor" in the left sidebar
   - You should see a new "subscriptions" table

## Or run via command line:

If you have the database password, you can run:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.mwpjthedrvhldzktyfee.supabase.co:5432/postgres" -f backend/migrations/003_subscriptions.sql
```

To get your database password:
- Supabase Dashboard > Project Settings > Database > Connection String
