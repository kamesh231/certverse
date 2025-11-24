# Getting Started with Certverse Frontend

Complete setup guide for Certverse frontend.

---

## 📦 What You Have

A complete Next.js 14 frontend with:
- ✅ Clerk authentication (sign-in/sign-up)
- ✅ Question display with instant feedback
- ✅ Blue branding + dark mode
- ✅ Backend API integration
- ✅ Responsive design
- ✅ 30+ files generated and ready

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies (1 min)

```bash
cd frontend
npm install
```

**Expected output:**
```
added 300+ packages
```

---

### Step 2: Set Up Clerk Account (2 mins)

1. **Go to [clerk.com](https://clerk.com)**
2. **Sign up** (or login)
3. **Create application:**
   - Name: **"Certverse"**
   - Click "Create application"
4. **Copy your keys:**
   - Go to: **Dashboard → API Keys**
   - Copy: **Publishable Key** (starts with `pk_test_`)
   - Copy: **Secret Key** (starts with `sk_test_`)

---

### Step 3: Create Environment File (1 min)

Create `.env.local` in the `frontend/` directory:

```bash
# Clerk keys (paste from Step 2)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Clerk URLs (keep as-is)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/question
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/question

# Backend API
# For local development:
NEXT_PUBLIC_API_URL=http://localhost:3001

# For production (after backend deployment):
# NEXT_PUBLIC_API_URL=https://certverse-backend.up.railway.app
```

**Important:** Make sure your backend is running on port 3001!

---

### Step 4: Start Backend (if not running)

```bash
# In a separate terminal
cd backend
npm run dev
```

**Expected output:**
```
✅ Database connected successfully
📝 Questions in database: 20
🚀 Certverse API running on port 3001
```

---

### Step 5: Start Frontend (1 min)

```bash
cd frontend
npm run dev
```

**Expected output:**
```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.5s
```

---

### Step 6: Test the Application (2 mins)

1. **Open browser:** http://localhost:3000

2. **Sign up flow:**
   - Redirects to `/sign-in`
   - Click "Sign up"
   - Enter email + password
   - **Check your email** for verification link
   - Click verification link
   - Redirects to `/question`

3. **Question flow:**
   - See a CISA question with 4 choices (A/B/C/D)
   - Domain badge displayed (1-4)
   - Select an answer
   - Click "Submit Answer"
   - See feedback:
     - ✅ Green = Correct
     - ❌ Red = Incorrect (shows correct answer)
   - Read explanation
   - Click "Next Question"
   - New question loads!

4. **Dark mode:**
   - Click moon icon in navbar
   - Theme switches to dark
   - Click sun icon to switch back

5. **User menu:**
   - Click avatar in top-right
   - See dropdown menu
   - Click "Sign out"
   - Redirects to sign-in page

---

## ✅ Success Checklist

After completing steps above, verify:

- [ ] Frontend runs on http://localhost:3000
- [ ] Backend runs on http://localhost:3001
- [ ] Can sign up with email
- [ ] Email verification received and works
- [ ] Redirects to `/question` after verification
- [ ] Question displays with domain badge
- [ ] Can select answer (radio button)
- [ ] Submit button works
- [ ] See feedback (correct/incorrect)
- [ ] Explanation displays
- [ ] "Next Question" loads new question
- [ ] Dark mode toggle works
- [ ] User button dropdown shows
- [ ] Can sign out
- [ ] No console errors

---

## 🔧 Troubleshooting

### Issue: "Clerk keys not found"
**Solution:**
1. Check `.env.local` file exists in `frontend/` directory
2. Verify keys start with `pk_test_` and `sk_test_`
3. Restart dev server: `npm run dev`

---

### Issue: "Failed to fetch question"
**Possible causes:**
1. Backend not running
2. Wrong API URL in `.env.local`
3. CORS error

**Solution:**
```bash
# Check backend is running
curl http://localhost:3001/health

# Should return: {"status":"ok","database":"connected"}

# If not running, start it:
cd backend
npm run dev

# Check NEXT_PUBLIC_API_URL in .env.local
cat .env.local | grep NEXT_PUBLIC_API_URL
# Should be: http://localhost:3001
```

---

### Issue: Stuck on sign-in page after verification
**Solution:**
1. Go to Clerk Dashboard → Paths
2. Verify redirect URLs:
   - After sign-in: `/question`
   - After sign-up: `/question`
3. Try signing in again

---

### Issue: CORS error in console
**Solution:**
Backend needs to allow http://localhost:3000

Check `backend/src/index.ts`:
```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',  // ← Make sure this is present
    // ...
  ],
}));
```

---

### Issue: Dark mode not working
**Solution:**
1. Clear browser cache
2. Check console for errors
3. Verify `next-themes` is installed:
   ```bash
   npm list next-themes
   ```

---

### Issue: Blank page / white screen
**Solution:**
1. Check browser console for errors
2. Verify all files are in place
3. Try clearing `.next` folder:
   ```bash
   rm -rf .next
   npm run dev
   ```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `.env.local` | Environment variables (Clerk keys, API URL) |
| `app/layout.tsx` | Root layout with providers |
| `app/(auth)/sign-in` | Sign-in page |
| `app/(dashboard)/question` | Main question page |
| `components/question-card.tsx` | Question display component |
| `lib/api.ts` | Backend API client |
| `middleware.ts` | Route protection |

---

## 🎯 Next Steps

Once everything works locally:

### 1. Deploy Backend to Railway
See `backend/README.md`

### 2. Deploy Frontend to Vercel
```bash
# Push to GitHub
git init
git add .
git commit -m "Frontend complete"
git remote add origin https://github.com/YOUR_USERNAME/certverse-frontend.git
git push -u origin main

# Deploy on Vercel
# → Import from GitHub
# → Add environment variables
# → Deploy!
```

### 3. Update Clerk URLs
After deployment, update Clerk Dashboard:
- Allowed origins: `https://certverse.vercel.app`
- Redirect URLs: Use your Vercel domain

---

## 💡 Development Tips

### Hot Reload
Changes to files automatically refresh the browser.

### TypeScript Errors
Run type check:
```bash
npm run build
```

### Linting
Check code quality:
```bash
npm run lint
```

### Clean Build
If issues persist:
```bash
rm -rf .next node_modules
npm install
npm run dev
```

---

## 📞 Need Help?

1. Check console errors (browser + terminal)
2. Review `.env.local` file
3. Verify backend is running
4. Check Clerk Dashboard settings
5. Review `FRONTEND_COMPLETE.md` for detailed docs

---

## 🎉 You're Ready!

If all checks pass, you have a working Certverse frontend!

**What you can do:**
- Sign up users
- Display questions
- Submit answers
- See explanations
- Track progress (via backend)
- Toggle dark mode

**Week 1 MVP: Complete!** ✅

Time to deploy and share with users! 🚀
