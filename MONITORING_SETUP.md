# Monitoring & Troubleshooting Setup Guide

This document explains all the monitoring and troubleshooting tools configured for Certverse.

---

## 🛠️ Monitoring Stack Overview

### 1. **Sentry** - Error Tracking & Performance Monitoring
- **Frontend**: Next.js error tracking
- **Backend**: Express.js error tracking + performance profiling
- **Features**: Real-time error alerts, stack traces, breadcrumbs, performance monitoring

### 2. **Winston** - Production Logging (Backend)
- **Features**: Structured logging, log rotation, different log levels
- **Storage**: Daily rotating files (14 day retention)

### 3. **Express Rate Limiting** - DDoS Protection
- **API General**: 100 requests per 15 minutes
- **Questions**: 30 per minute
- **Submissions**: 20 per minute

### 4. **Helmet** - Security Headers
- **Features**: XSS protection, HSTS, CSP, etc.

### 5. **Vercel Analytics** - Performance Monitoring (Frontend)
- **Features**: Core Web Vitals, page load times, user analytics

---

## 📋 Setup Instructions

### Step 1: Create Sentry Account

1. Go to **https://sentry.io/** and sign up
2. Create a new project for **Next.js** (frontend)
3. Create another project for **Node.js/Express** (backend)
4. You'll get two DSN URLs (one for each project)

### Step 2: Add Sentry Environment Variables

#### Backend (.env):
```bash
# Add to /backend/.env
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NODE_ENV=production
LOG_LEVEL=info
```

#### Frontend (.env.local):
```bash
# Add to /frontend/.env.local
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=your_auth_token  # Get from Sentry settings
```

### Step 3: Update Railway Environment Variables

Go to your Railway backend project and add:
```
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NODE_ENV=production
LOG_LEVEL=info
```

### Step 4: Update Vercel Environment Variables

Go to your Vercel frontend project and add:
```
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=your_auth_token
```

### Step 5: Enable Vercel Analytics

1. Go to your Vercel project dashboard
2. Click **Analytics** tab
3. Enable **Web Analytics**
4. No code changes needed - it's automatic!

### Step 6: Set Up Uptime Monitoring (Optional but Recommended)

#### Option A: UptimeRobot (Free)
1. Go to **https://uptimerobot.com/**
2. Create monitor for:
   - `https://certverse.vercel.app/` (HTTP check every 5 minutes)
   - `https://certverse-production.up.railway.app/health` (HTTP check every 5 minutes)
3. Set up email alerts

#### Option B: Better Uptime (Free tier available)
1. Go to **https://betterstack.com/better-uptime**
2. More features than UptimeRobot
3. Slack/Discord integration available

---

## 📊 What Each Tool Monitors

### Sentry Tracks:
- ✅ JavaScript errors (frontend)
- ✅ API errors (backend)
- ✅ Unhandled promise rejections
- ✅ Network failures
- ✅ Performance bottlenecks
- ✅ User sessions with errors
- ✅ Stack traces with source maps

### Winston Logs:
- ✅ API requests (method, path, IP)
- ✅ Errors with stack traces
- ✅ Database connection issues
- ✅ Server startup/shutdown events
- ✅ Rate limiting violations

**Log Location** (Production):
- `/backend/logs/error-2025-01-15.log` - Errors only
- `/backend/logs/combined-2025-01-15.log` - All logs

### Rate Limiting Protects Against:
- ✅ DDoS attacks
- ✅ Brute force attempts
- ✅ API abuse
- ✅ Excessive question scraping

### Vercel Analytics Shows:
- ✅ Page load times
- ✅ Core Web Vitals (LCP, FID, CLS)
- ✅ Visitor count
- ✅ Geographic distribution
- ✅ Top pages

---

## 🚨 Alert Configuration

### Sentry Alerts (Recommended Setup):

1. Go to **Sentry Dashboard** → **Alerts**
2. Create these alert rules:

**Critical Error Alert:**
- Condition: New issue occurs with level "error" or "fatal"
- Action: Email + Slack notification
- Trigger: Immediately

**High Error Rate Alert:**
- Condition: >10 errors in 1 hour
- Action: Email notification
- Trigger: When threshold exceeded

**Performance Alert:**
- Condition: Page load time >3 seconds
- Action: Email notification
- Trigger: When affecting >100 users

### UptimeRobot Alerts:

- Email when site is down for >2 minutes
- Email when site comes back up
- Weekly uptime report

---

## 🔍 Debugging in Production

### View Logs (Railway Backend):

1. Go to Railway dashboard
2. Click on your backend service
3. Click **"Logs"** tab
4. View real-time logs with Winston formatting

### View Errors (Sentry):

1. Go to Sentry dashboard
2. Click on **"Issues"** tab
3. Filter by:
   - Environment (production/development)
   - Time range
   - Error type
4. Click on an issue to see:
   - Stack trace
   - User context (IP, browser, etc.)
   - Breadcrumbs (events leading to error)
   - Tags and metadata

### View Performance (Vercel Analytics):

1. Go to Vercel dashboard
2. Click **"Analytics"** tab
3. View:
   - Real User Monitoring (RUM)
   - Core Web Vitals scores
   - Page load distribution
   - Traffic sources

---

## 📈 Key Metrics to Monitor

### Health Indicators:

**Healthy:**
- ✅ Error rate: <1% of requests
- ✅ API response time: <500ms (p95)
- ✅ Uptime: >99.9%
- ✅ Core Web Vitals: All green

**Warning:**
- ⚠️ Error rate: 1-5% of requests
- ⚠️ API response time: 500ms-1s (p95)
- ⚠️ Uptime: 99.5-99.9%
- ⚠️ Some yellow Core Web Vitals

**Critical:**
- 🔴 Error rate: >5% of requests
- 🔴 API response time: >1s (p95)
- 🔴 Uptime: <99.5%
- 🔴 Multiple red Core Web Vitals

---

## 🧪 Testing Monitoring

### Test Sentry Error Tracking:

**Frontend:**
```javascript
// Add this to any page temporarily
throw new Error("Test Sentry frontend error");
```

**Backend:**
```bash
# Make an invalid API request
curl https://certverse-production.up.railway.app/api/invalid
```

### Test Rate Limiting:

```bash
# Run this to trigger rate limit (adjust URL to your backend)
for i in {1..101}; do
  curl https://certverse-production.up.railway.app/api/question?userId=test
done
```

You should get a 429 error after 100 requests in 15 minutes.

### Test Logging:

Check Railway logs after making API requests. You should see:
```
2025-01-15 10:30:15 [info]: GET /api/question {"ip":"1.2.3.4","userAgent":"curl/7.68.0"}
```

---

## 📊 Dashboard Recommendations

Create a monitoring dashboard with:

1. **Sentry Dashboard**
   - Pin your most important errors
   - Set up weekly email digest

2. **Vercel Analytics**
   - Monitor Core Web Vitals daily
   - Track user growth

3. **Railway Metrics**
   - Watch memory usage
   - Monitor CPU usage
   - Track request counts

4. **UptimeRobot Dashboard**
   - 30-day uptime percentage
   - Response time graph

---

## 🔧 Troubleshooting Common Issues

### Issue: Sentry not capturing errors

**Check:**
1. Is `SENTRY_DSN` environment variable set?
2. Is Sentry initialized before other code?
3. Check Sentry dashboard for "Events" count
4. Verify DSN is correct (test with a manual error)

**Fix:**
```bash
# Backend
echo $SENTRY_DSN  # Should output the DSN

# Frontend
console.log(process.env.NEXT_PUBLIC_SENTRY_DSN)
```

### Issue: Logs not appearing

**Check:**
1. Is `logs/` directory created? (Auto-created but may have permission issues)
2. Check log level: `LOG_LEVEL=info` (not `error`)
3. Railway logs vs local file logs are different

**Fix:**
```bash
# Create logs directory if missing
mkdir -p /backend/logs
chmod 755 /backend/logs
```

### Issue: Rate limiting too strict

**Adjust:**
Edit `/backend/src/middleware/rateLimiter.ts`:
```typescript
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,  // Increase from 100 to 200
  // ...
})
```

---

## 💰 Cost Breakdown

### Free Tier Limits:

**Sentry:**
- 5,000 errors/month free
- 10,000 performance transactions/month free
- Upgrade: $26/month for 50K errors

**Vercel Analytics:**
- Free tier: 2,500 data points/day
- Pro: $20/month unlimited

**UptimeRobot:**
- Free: 50 monitors, 5-min intervals
- Pro: $7/month, 1-min intervals

**Railway:**
- Free: $5 credit/month
- Pay as you go after that

**Total Monthly Cost (Free Tier):** $0
**Total Monthly Cost (Paid):** ~$50-100 depending on traffic

---

## 🎯 Next Steps

After setting up monitoring:

1. ✅ Add Sentry DSN to both environments
2. ✅ Enable Vercel Analytics
3. ✅ Set up UptimeRobot monitors
4. ✅ Configure Sentry alert rules
5. ✅ Test error tracking (throw test errors)
6. ✅ Create a monitoring checklist (daily/weekly)
7. ✅ Set up on-call rotation (if team)

---

## 📞 Support & Resources

- **Sentry Docs:** https://docs.sentry.io/
- **Winston Docs:** https://github.com/winstonjs/winston
- **Vercel Analytics:** https://vercel.com/docs/analytics
- **UptimeRobot:** https://uptimerobot.com/faq
- **Express Rate Limit:** https://github.com/express-rate-limit/express-rate-limit

---

**Last Updated:** 2025-01-15
**Status:** ✅ Backend configured, ⏳ Frontend Sentry pending DSN
