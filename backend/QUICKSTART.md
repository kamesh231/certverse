# Certverse Backend - Quick Start Guide

Get the backend running in 5 minutes!

## Step 1: Install Dependencies (1 min)

```bash
cd backend
npm install
```

## Step 2: Set Up Supabase (2 mins)

1. Go to https://supabase.com → Create account
2. Click "New Project"
   - Name: `certverse`
   - Database Password: (save this!)
   - Region: (choose closest)
3. Wait for project to provision (~2 mins)

## Step 3: Configure Environment (1 min)

Create `.env` file:

```bash
# Copy from Supabase Dashboard → Settings → API
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxxxx  # Use service_role key

PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Step 4: Run Database Migration (30 sec)

1. Supabase Dashboard → SQL Editor
2. Copy entire contents of `src/migrations/001_initial_schema.sql`
3. Paste → Click "Run"
4. ✅ You should see "Success. No rows returned"

## Step 5: Seed Questions (30 sec)

```bash
npm run seed
```

Expected output:
```
🌱 Starting to seed questions...
📝 Inserting 20 questions...
✅ Successfully seeded 20 questions!

📊 Breakdown by domain:
   Domain 1: 5 questions
   Domain 2: 5 questions
   Domain 3: 5 questions
   Domain 4: 5 questions

✨ Seeding complete!
```

## Step 6: Start Server (10 sec)

```bash
npm run dev
```

Expected output:
```
🔍 Checking database connection...
✅ Database connected successfully
📝 Questions in database: 20
🚀 Certverse API running on port 3001
🌐 Health check: http://localhost:3001/health
📚 API docs: http://localhost:3001/
```

## Step 7: Test API (30 sec)

Open browser or use curl:

```bash
# Health check
curl http://localhost:3001/health

# Get random question
curl "http://localhost:3001/api/question?userId=test-123"

# Get question count
curl http://localhost:3001/api/question-count
```

## ✅ Success!

Your backend is now running on `http://localhost:3001`

---

## Common Issues

### ❌ "Missing Supabase credentials"

**Fix:** Check `.env` file exists and has correct values

### ❌ "Failed to connect to Supabase"

**Fix:**
1. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
2. Check Supabase project is active (not paused)
3. Ensure you're using `service_role` key (not `anon` key)

### ❌ "No questions found"

**Fix:** Run seed script: `npm run seed`

### ❌ "Error inserting questions"

**Fix:**
1. Ensure migration ran successfully (check Supabase Table Editor)
2. Run seed with force: `npm run seed -- --force`

---

## Next: Deploy to Railway

Once local setup works, deploy to Railway:

1. Push to GitHub:
```bash
git init
git add .
git commit -m "Initial setup"
git remote add origin https://github.com/yourusername/certverse-backend.git
git push -u origin main
```

2. Deploy to Railway:
   - Go to https://railway.app
   - "New Project" → "Deploy from GitHub"
   - Select repo → Add env vars → Deploy

3. Get URL: Railway Dashboard → Generate Domain

Done! 🚀
