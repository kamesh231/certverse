# 🔒 Security Hardening Checklist

## Current Security Status: ⚠️ NOT PRODUCTION READY

### Critical Security Issues:

1. ❌ Row-Level Security (RLS) disabled on responses table
2. ❌ Backend accepts any `userId` without verification
3. ❌ No input validation on API endpoints
4. ⚠️ CORS allows all Vercel/Railway domains (overly permissive)

---

## 🚨 CRITICAL - Must Fix Before Public Launch

### 1. Re-enable Row-Level Security (RLS) ⏱️ 15 minutes

**Current State:** RLS is disabled on the `responses` table, allowing anyone to read/write any user's data.

**Why it's critical:** Without RLS, a malicious user could:
- View other users' answers and scores
- Insert fake responses for other users
- Delete other users' data

**How to fix:**

```sql
-- Step 1: Re-enable RLS
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Step 2: Create proper policies
-- Allow anyone to INSERT (Clerk handles auth in application)
CREATE POLICY "Anyone can insert responses"
ON responses FOR INSERT
WITH CHECK (true);

-- Allow users to read only their own responses
-- Note: This requires passing userId from Clerk, which we validate in Step 2
CREATE POLICY "Users can read own responses"
ON responses FOR SELECT
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Prevent updates and deletes (responses are immutable)
CREATE POLICY "No one can update responses"
ON responses FOR UPDATE
USING (false);

CREATE POLICY "No one can delete responses"
ON responses FOR DELETE
USING (false);
```

**Priority:** 🔴 CRITICAL
**Estimated Time:** 15 minutes
**Risk if not fixed:** Data breach, integrity violation

---

### 2. Verify Clerk JWT on Backend ⏱️ 1-2 hours

**Current State:** Backend trusts whatever `userId` is sent in the request.

**Why it's critical:** A malicious user could:
```javascript
// Fake a request with someone else's userId
fetch('/api/question?userId=someone_else_id')
```

**How to fix:**

#### Option A: Verify Clerk JWT (Recommended)

Install Clerk SDK:
```bash
cd backend
npm install @clerk/clerk-sdk-node
```

Create auth middleware:
```typescript
// backend/src/middleware/verifyClerk.ts
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

export const verifyClerk = ClerkExpressRequireAuth({
  // Automatically validates JWT from Authorization header
});

// Extract userId from verified JWT
export const extractUserId = (req: any, res: any, next: any) => {
  req.userId = req.auth.userId;
  next();
};
```

Update routes:
```typescript
// backend/src/index.ts
import { verifyClerk, extractUserId } from './middleware/verifyClerk';

// Protect all user-specific routes
app.get('/api/question',
  verifyClerk,           // Verify JWT is valid
  extractUserId,         // Extract userId from JWT
  questionLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId; // Use verified userId
    const question = await getRandomQuestion(userId);
    res.json(question);
  })
);

app.post('/api/submit',
  verifyClerk,
  extractUserId,
  submitLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId; // Use verified userId, ignore req.body.userId
    const { questionId, selectedChoice } = req.body;
    const result = await submitAnswer({ userId, questionId, selectedChoice });
    res.json(result);
  })
);

app.get('/api/stats', verifyClerk, extractUserId, asyncHandler(...));
app.get('/api/history', verifyClerk, extractUserId, asyncHandler(...));
```

Update environment variables:
```bash
# backend/.env
CLERK_SECRET_KEY=sk_test_xxxxx  # Same key as frontend
```

**Priority:** 🔴 CRITICAL
**Estimated Time:** 1-2 hours
**Risk if not fixed:** Authentication bypass, impersonation attacks

---

### 3. Add Input Validation ⏱️ 1 hour

**Current State:** No validation on request inputs.

**Why it's critical:** Prevents:
- SQL injection
- XSS attacks
- Invalid data in database
- Server crashes from malformed input

**How to fix:**

Install Zod:
```bash
cd backend
npm install zod
```

Create validation schemas:
```typescript
// backend/src/lib/validation.ts
import { z } from 'zod';

export const submitAnswerSchema = z.object({
  questionId: z.string().uuid('Invalid question ID format'),
  selectedChoice: z.enum(['A', 'B', 'C', 'D'], {
    errorMap: () => ({ message: 'Choice must be A, B, C, or D' }),
  }),
});

export const getUserStatsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export const getUserHistorySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  limit: z.number().int().min(1).max(100).optional().default(10),
});
```

Use in routes:
```typescript
// backend/src/index.ts
import { submitAnswerSchema } from './lib/validation';

app.post('/api/submit',
  verifyClerk,
  extractUserId,
  submitLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    // Validate input
    const validatedInput = submitAnswerSchema.parse(req.body);
    const userId = (req as any).userId;

    const result = await submitAnswer({
      userId,
      questionId: validatedInput.questionId,
      selectedChoice: validatedInput.selectedChoice,
    });

    res.json(result);
  })
);
```

**Priority:** 🔴 HIGH
**Estimated Time:** 1 hour
**Risk if not fixed:** Data corruption, injection attacks

---

## 🟡 HIGH PRIORITY - Recommended Before Launch

### 4. Tighten CORS Policy ⏱️ 10 minutes

**Current State:** Accepts all `*.vercel.app` and `*.railway.app` domains.

**How to fix:**

```typescript
// backend/src/index.ts
app.use(cors({
  origin: [
    'https://certverse.vercel.app',           // Production only
    'http://localhost:3000',                   // Development
    ...(process.env.NODE_ENV === 'development'
      ? ['http://localhost:3001']
      : []
    ),
  ],
  credentials: true,
}));
```

**Priority:** 🟡 HIGH
**Estimated Time:** 10 minutes
**Risk if not fixed:** CSRF attacks from malicious Vercel/Railway sites

---

### 5. Sanitize Error Messages ⏱️ 30 minutes

**Current State:** Error messages might leak sensitive info.

**How to fix:**

```typescript
// backend/src/middleware/errorHandler.ts
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = err as AppError;
  const statusCode = error.statusCode || 500;

  // Generic message for production
  const message = process.env.NODE_ENV === 'production'
    ? (statusCode >= 500 ? 'Internal server error' : error.message)
    : error.message;

  logError('Error occurred', err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).userId,
  });

  // Send to Sentry for non-operational errors
  if (!error.isOperational || statusCode >= 500) {
    Sentry.captureException(err);
  }

  // Only send stack trace in development
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
};
```

**Priority:** 🟡 MEDIUM
**Estimated Time:** 30 minutes
**Risk if not fixed:** Information disclosure

---

### 6. Add HTTPS-Only Cookies ⏱️ 15 minutes

**Current State:** No custom cookies set (Clerk handles auth cookies).

**If you add cookies in the future:**

```typescript
import cookieParser from 'cookie-parser';

app.use(cookieParser());

// When setting cookies:
res.cookie('session', token, {
  httpOnly: true,      // Prevent XSS access
  secure: true,        // HTTPS only
  sameSite: 'strict',  // CSRF protection
  maxAge: 3600000,     // 1 hour
});
```

**Priority:** 🟢 LOW (only if you add cookies)
**Estimated Time:** 15 minutes

---

### 7. Implement Request Size Limits ⏱️ 5 minutes

**Current State:** No size limits on request bodies.

**How to fix:**

```typescript
// backend/src/index.ts
app.use(express.json({
  limit: '10kb'  // Prevent large payload attacks
}));
```

**Priority:** 🟡 MEDIUM
**Estimated Time:** 5 minutes
**Risk if not fixed:** DoS via large payloads

---

### 8. Add Security Headers (Already Done! ✅)

Already implemented via Helmet:
- ✅ X-Frame-Options (clickjacking protection)
- ✅ X-Content-Type-Options (MIME sniffing protection)
- ✅ X-XSS-Protection
- ✅ Content-Security-Policy
- ✅ HSTS (HTTPS enforcement)

---

## 📋 Security Checklist Summary

### Before Public Launch (CRITICAL):
- [ ] 1. Re-enable RLS on responses table (15 min)
- [ ] 2. Verify Clerk JWT on backend (1-2 hours)
- [ ] 3. Add input validation with Zod (1 hour)
- [ ] 4. Tighten CORS policy (10 min)
- [ ] 5. Sanitize error messages (30 min)
- [ ] 7. Add request size limits (5 min)

**Total Time:** ~3-4 hours

### Already Implemented ✅:
- ✅ Rate limiting (DDoS protection)
- ✅ Helmet security headers
- ✅ HTTPS on Vercel/Railway
- ✅ Environment variable protection (.gitignore)
- ✅ Error logging with Sentry

---

## 🧪 Security Testing

After implementing fixes, test:

### 1. Test RLS Policies:
```sql
-- Try to read another user's data (should fail)
SELECT * FROM responses WHERE user_id = 'different_user_id';
```

### 2. Test JWT Verification:
```bash
# Try to access API without auth header (should fail with 401)
curl https://certverse-production.up.railway.app/api/question

# Try with invalid JWT (should fail)
curl -H "Authorization: Bearer fake_token" \
  https://certverse-production.up.railway.app/api/question
```

### 3. Test Input Validation:
```bash
# Try invalid choice (should return 400)
curl -X POST https://certverse-production.up.railway.app/api/submit \
  -H "Content-Type: application/json" \
  -d '{"questionId":"test","selectedChoice":"Z"}'

# Try SQL injection (should be sanitized)
curl -X POST https://certverse-production.up.railway.app/api/submit \
  -H "Content-Type: application/json" \
  -d '{"questionId":"test","selectedChoice":"A\"; DROP TABLE responses;--"}'
```

### 4. Test Rate Limiting:
```bash
# Make 101 requests rapidly (101st should return 429)
for i in {1..101}; do
  curl https://certverse-production.up.railway.app/api/question?userId=test
done
```

---

## 🎯 Priority Order

If you have limited time, do these in order:

1. **RLS Re-enable** (15 min) - Prevents unauthorized data access
2. **Clerk JWT Verification** (1-2 hours) - Prevents impersonation
3. **Input Validation** (1 hour) - Prevents injection attacks
4. **CORS Tightening** (10 min) - Prevents CSRF
5. **Error Sanitization** (30 min) - Prevents info leakage
6. **Request Size Limits** (5 min) - Prevents DoS

**Total: 3-4 hours to be production-ready from security perspective**

---

## 📚 Resources

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **Clerk Security:** https://clerk.com/docs/security
- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **Zod Validation:** https://zod.dev/

---

**Last Updated:** 2025-01-15
**Status:** ⚠️ Security hardening needed before public launch
