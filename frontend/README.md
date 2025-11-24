# Certverse Frontend

Modern, beautiful frontend for Certverse CISA exam preparation platform.

## Features

✨ **Beautiful UI**
- Blue branding theme (#2563EB)
- Dark mode support
- Smooth animations
- Responsive design

🔐 **Authentication**
- Clerk integration
- Sign in / Sign up flows
- Protected routes
- User session management

📝 **Question Display**
- Clean, readable question cards
- Radio button answer selection
- Instant feedback (correct/incorrect)
- Detailed explanations
- Domain badges

🎨 **Tech Stack**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Clerk Auth
- shadcn/ui components
- Lucide icons

---

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Set Up Environment Variables

Create `.env.local`:

```bash
# Clerk (get from https://clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/question
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/question

# Backend API (your Railway URL or localhost)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx    # Sign in page
│   │   └── sign-up/[[...sign-up]]/page.tsx    # Sign up page
│   ├── (dashboard)/
│   │   └── question/page.tsx                   # Main question page
│   ├── layout.tsx                              # Root layout
│   ├── page.tsx                                # Home (redirect)
│   └── globals.css                             # Global styles
├── components/
│   ├── ui/                                     # shadcn components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── radio-group.tsx
│   ├── providers/
│   │   └── theme-provider.tsx                  # Dark mode provider
│   ├── navbar.tsx                              # Top navigation
│   ├── question-card.tsx                       # Question display
│   └── theme-toggle.tsx                        # Dark mode toggle
├── lib/
│   ├── api.ts                                  # Backend API client
│   └── utils.ts                                # Utility functions
├── middleware.ts                               # Clerk auth middleware
└── package.json
```

---

## Configuration

### Clerk Setup

1. Go to [clerk.com](https://clerk.com) → Create account
2. Create application: "Certverse"
3. Copy keys to `.env.local`
4. Configure redirect URLs:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/question`
   - After sign-up: `/question`

### Backend Connection

Update `NEXT_PUBLIC_API_URL` in `.env.local`:

**Development:**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Production:**
```
NEXT_PUBLIC_API_URL=https://certverse-backend.up.railway.app
```

---

## Deployment to Vercel

### Option 1: GitHub Integration (Recommended)

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial frontend"
git remote add origin https://github.com/YOUR_USERNAME/certverse-frontend.git
git push -u origin main
```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repo
   - Framework: Next.js (auto-detected)
   - Add environment variables:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`
     - `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
     - `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
     - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
     - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
     - `NEXT_PUBLIC_API_URL` (your Railway backend URL)
   - Click "Deploy"

3. **Update Clerk URLs:**
   - Go to Clerk Dashboard → Paths
   - Update with your Vercel domain:
     - `https://certverse.vercel.app/sign-in`
     - `https://certverse.vercel.app/sign-up`

### Option 2: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

---

## Features Implemented

### Week 1 MVP

- [x] Clerk authentication (sign-in/sign-up)
- [x] Protected routes with middleware
- [x] Question display with 4 choices
- [x] Answer submission
- [x] Instant feedback (correct/incorrect)
- [x] Explanation display
- [x] Next question flow
- [x] Dark mode toggle
- [x] Responsive navbar
- [x] Blue branding theme
- [x] Backend API integration

---

## API Integration

The frontend connects to the backend via `/lib/api.ts`:

### Available Functions:

```typescript
// Fetch random question
fetchQuestion(userId: string): Promise<Question>

// Submit answer
submitAnswer(
  userId: string,
  questionId: string,
  choice: 'A' | 'B' | 'C' | 'D'
): Promise<SubmitAnswerResponse>

// Get user stats
getUserStats(userId: string): Promise<UserStats>

// Get answer history
getUserHistory(userId: string, limit?: number): Promise<UserResponse[]>
```

---

## Styling & Theming

### Color Palette

**Light Mode:**
- Primary: Blue (#2563EB - blue-600)
- Background: White (#FFFFFF)
- Foreground: Dark Gray

**Dark Mode:**
- Primary: Blue (#2563EB)
- Background: Dark (#0F172A)
- Foreground: Light Gray

### Custom Classes

```css
/* Fade in animation */
.animate-fade-in

/* Custom scrollbar */
.scrollbar-thin
```

---

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Troubleshooting

### Clerk Auth Not Working

1. Check `.env.local` has correct keys
2. Verify Clerk redirect URLs match your domain
3. Restart dev server: `npm run dev`

### API Connection Failed

1. Check backend is running: `curl http://localhost:3001/health`
2. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check CORS settings in backend

### Dark Mode Not Persisting

1. Clear browser cache
2. Check `ThemeProvider` in `app/layout.tsx`
3. Verify `next-themes` is installed

---

## Next Steps (Week 2+)

- [ ] Dashboard page with stats
- [ ] Answer history view
- [ ] Domain filtering
- [ ] Progress tracking
- [ ] Streak counter
- [ ] Preparedness score

---

## License

MIT

---

Built with ❤️ for CISA exam success
