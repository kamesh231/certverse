# Certverse Backend API

Backend API for Certverse - CISA exam preparation platform.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Railway

## Project Structure

```
backend/
├── src/
│   ├── lib/
│   │   └── supabase.ts          # Supabase client initialization
│   ├── api/
│   │   ├── get-question.ts      # Fetch random questions
│   │   └── submit-answer.ts     # Submit and validate answers
│   ├── seed/
│   │   └── questions.ts         # Seed 20 CISA questions
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # Database schema
│   └── index.ts                 # Express server
├── package.json
├── tsconfig.json
└── railway.json                 # Railway deployment config
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account
- Railway account (for deployment)

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxxxx
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Get Supabase credentials:**
1. Go to https://supabase.com
2. Create new project: "certverse"
3. Settings → API → Copy `URL` and `service_role` key

### 4. Set Up Database Schema

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `src/migrations/001_initial_schema.sql`
3. Paste and click "Run"
4. Verify tables created in Table Editor

### 5. Seed Questions

```bash
npm run seed
```

This will insert 20 CISA practice questions (5 per domain).

To reseed (delete existing and re-insert):

```bash
npm run seed -- --force
```

### 6. Run Locally

Development mode (with hot reload):

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

### 7. Test API

**Health check:**
```bash
curl http://localhost:3001/health
```

**Get random question:**
```bash
curl "http://localhost:3001/api/question?userId=test-user-123"
```

**Submit answer:**
```bash
curl -X POST http://localhost:3001/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "questionId": "question-uuid-here",
    "selectedChoice": "A"
  }'
```

**Get user stats:**
```bash
curl "http://localhost:3001/api/stats?userId=test-user-123"
```

## API Endpoints

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-24T10:00:00Z",
  "database": "connected"
}
```

### GET `/api/question?userId={userId}`
Fetch random unanswered question for user.

**Query Parameters:**
- `userId` (required): User identifier from Clerk

**Response:**
```json
{
  "id": "uuid",
  "domain": 1,
  "q_text": "What is the PRIMARY purpose of...",
  "choice_a": "Option A",
  "choice_b": "Option B",
  "choice_c": "Option C",
  "choice_d": "Option D",
  "answer": "B",
  "explanation": "Detailed explanation..."
}
```

### POST `/api/submit`
Submit answer and get feedback.

**Request Body:**
```json
{
  "userId": "user-123",
  "questionId": "question-uuid",
  "selectedChoice": "B"
}
```

**Response:**
```json
{
  "success": true,
  "correct": true,
  "correctAnswer": "B",
  "explanation": "Detailed explanation...",
  "responseId": "response-uuid"
}
```

### GET `/api/stats?userId={userId}`
Get user statistics.

**Response:**
```json
{
  "totalAnswered": 15,
  "totalCorrect": 12,
  "accuracy": 80.00
}
```

### GET `/api/history?userId={userId}&limit={limit}`
Get user answer history.

**Query Parameters:**
- `userId` (required)
- `limit` (optional, default: 10)

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "user-123",
    "question_id": "question-uuid",
    "selected_choice": "A",
    "correct": true,
    "created_at": "2025-01-24T10:00:00Z"
  }
]
```

## Deployment to Railway

### 1. Create GitHub Repository

```bash
git init
git add .
git commit -m "Initial backend setup"
git branch -M main
git remote add origin https://github.com/yourusername/certverse-backend.git
git push -u origin main
```

### 2. Deploy to Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `certverse-backend` repository
4. Railway auto-detects config from `railway.json`

### 3. Add Environment Variables in Railway

In Railway Dashboard → Variables:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxxxx
NODE_ENV=production
FRONTEND_URL=https://certverse.vercel.app
```

### 4. Generate Domain

Railway Dashboard → Settings → Generate Domain

Copy URL: `https://certverse-backend.up.railway.app`

### 5. Verify Deployment

```bash
curl https://certverse-backend.up.railway.app/health
```

## Database Schema

### `questions` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| domain | INTEGER | Domain 1-4 |
| q_text | TEXT | Question text |
| choice_a/b/c/d | TEXT | Answer choices |
| answer | TEXT | Correct answer (A/B/C/D) |
| explanation | TEXT | Explanation |
| created_at | TIMESTAMPTZ | Creation timestamp |

### `responses` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | TEXT | Clerk user ID |
| question_id | UUID | Foreign key to questions |
| selected_choice | TEXT | User's choice (A/B/C/D) |
| correct | BOOLEAN | Whether answer is correct |
| created_at | TIMESTAMPTZ | Submission timestamp |

## Security

- **RLS Enabled**: Row Level Security enforced on all tables
- **Service Role**: Backend uses service_role key to bypass RLS
- **CORS**: Configured to allow frontend domain only
- **Input Validation**: All endpoints validate required parameters

## Troubleshooting

### Connection Issues

**Error:** `Failed to connect to Supabase`

1. Check `.env` file exists and has correct credentials
2. Verify Supabase project is active
3. Test connection: `npm run dev` (check logs)

### Seed Issues

**Error:** `Error inserting questions`

1. Ensure schema migration ran successfully
2. Check RLS policies allow service_role to INSERT
3. Run with force flag: `npm run seed -- --force`

### Railway Deployment Issues

**Build fails:**
1. Check `railway.json` exists
2. Verify `package.json` has `build` and `start` scripts
3. Check Railway logs for specific errors

**API returns 500 errors:**
1. Check Railway environment variables are set
2. View Railway logs: Dashboard → Deployments → Logs
3. Verify Supabase service key is correct

## Development Tips

### Hot Reload
```bash
npm run dev  # Uses tsx watch for auto-reload
```

### TypeScript Compilation
```bash
npm run build  # Compiles to dist/
```

### Database Queries
Use Supabase Dashboard → SQL Editor to run queries:

```sql
-- Count questions by domain
SELECT domain, COUNT(*) FROM questions GROUP BY domain;

-- Recent responses
SELECT * FROM responses ORDER BY created_at DESC LIMIT 10;

-- User accuracy
SELECT
  user_id,
  COUNT(*) as total,
  SUM(CASE WHEN correct THEN 1 ELSE 0 END) as correct,
  ROUND(AVG(CASE WHEN correct THEN 100 ELSE 0 END), 2) as accuracy
FROM responses
GROUP BY user_id;
```

## Next Steps (Week 2+)

- [ ] Add user dashboard endpoint (stats, history)
- [ ] Implement daily unlock logic
- [ ] Add domain-specific question filtering
- [ ] Create onboarding data endpoints
- [ ] Add Claude API for explanations (RAG)

## License

MIT

---

Built with ❤️ for CISA exam preparation
