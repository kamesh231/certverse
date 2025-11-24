# Frontend Quick Start (5 Minutes)

Get the Certverse frontend running locally.

---

## Step 1: Install Dependencies (1 min)

```bash
cd frontend
npm install
```

---

## Step 2: Set Up Clerk (2 mins)

1. Go to [clerk.com](https://clerk.com) → Sign up
2. Create application: **"Certverse"**
3. Copy your keys:
   - Settings → API Keys
   - Copy `Publishable Key` and `Secret Key`

---

## Step 3: Create Environment File (1 min)

Create `.env.local`:

```bash
# Paste your Clerk keys here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Keep these as-is
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/question
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/question

# Point to your backend (localhost or Railway URL)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Important:** Make sure your backend is running on port 3001!

---

## Step 4: Start Dev Server (30 sec)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Step 5: Test the Flow (1 min)

1. **Homepage** → Redirects to `/sign-in`
2. **Click "Sign up"** → Create account
3. **Verify email** → Check inbox
4. **Redirects to `/question`** → See a CISA question
5. **Select answer** → Submit → See feedback
6. **Click "Next Question"** → Load new question
7. **Toggle dark mode** → Moon icon in navbar

---

## ✅ Success Checklist

- [ ] Frontend runs on http://localhost:3000
- [ ] Can sign up with email
- [ ] Email verification works
- [ ] Question displays after login
- [ ] Can select and submit answer
- [ ] See correct/incorrect feedback
- [ ] "Next Question" loads new question
- [ ] Dark mode toggle works
- [ ] Backend connection working (check console)

---

## 🔧 Troubleshooting

### "Clerk keys not found"
→ Check `.env.local` exists and has correct keys

### "Failed to fetch question"
→ Ensure backend is running: `cd backend && npm run dev`

### "CORS error"
→ Backend must allow http://localhost:3000 in CORS settings

### Stuck on sign-in page
→ Check Clerk Dashboard → Paths are correct

---

## 🚀 Next: Deploy to Vercel

Once everything works locally:

```bash
# Push to GitHub
git init
git add .
git commit -m "Frontend complete"
git push

# Deploy on Vercel
# → Import from GitHub
# → Add environment variables
# → Deploy!
```

---

**Ready to go!** 🎉
