# Production Deployment Checklist

Complete this checklist before deploying to production.

## Environment & Configuration

- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill all required environment variables:
  - [ ] GROQ_API_KEY
  - [ ] ELEVENLABS_API_KEY
  - [ ] HUGGINGFACE_API_KEY
  - [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID
  - [ ] FIREBASE_CLIENT_EMAIL
  - [ ] FIREBASE_PRIVATE_KEY
  - [ ] API_SECRET_KEY (strong, random string)
  - [ ] REDIS_URL
- [ ] Verify all keys are valid and active
- [ ] Set NODE_ENV=production
- [ ] Verify jsconfig.json aliases are correct

## Dependencies

- [ ] Run `npm install` to install all dependencies
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Fix any critical vulnerabilities
- [ ] Verify FFmpeg is installed on server
- [ ] Test all external API connections

## Build & Testing

- [ ] Clean build: `rm -rf .next && npm run build`
- [ ] Build completes without errors
- [ ] No webpack warnings about missing modules
- [ ] Verify output size is reasonable (< 500MB)
- [ ] Test dev build locally: `npm run dev`
- [ ] Generate test video end-to-end
- [ ] Check logs for any errors

## Database (Firestore)

- [ ] Create Firestore database (production mode)
- [ ] Create `videos` collection
- [ ] Set up required indexes:
  ```
  Collection: videos
  Index 1: createdAt (Descending) + status (Ascending)
  Index 2: status (Ascending) + createdAt (Descending)
  ```
- [ ] Configure Firestore backup (daily)
- [ ] Set up read/write rules (secure by default)
- [ ] Test database read/write permissions

## Firebase Storage

- [ ] Create Cloud Storage bucket
- [ ] Set storage permissions (allow authenticated only)
- [ ] Configure lifecycle rules (delete old files after 90 days)
- [ ] Enable CDN/caching
- [ ] Test upload/download functionality

## Redis/Job Queue

- [ ] Set up Redis instance:
  - [ ] Option 1: Upstash Cloud (recommended for Vercel)
  - [ ] Option 2: Self-hosted Redis
- [ ] Verify Redis URL is correct
- [ ] Test job queue with sample video
- [ ] Configure Redis persistence if needed
- [ ] Set up Redis monitoring/alerts

## Logging & Monitoring

- [ ] Create `logs/` directory
- [ ] Verify logger writes to files
- [ ] Test log rotation settings
- [ ] Set up monitoring (optional):
  - [ ] Sentry for error tracking
  - [ ] LogRocket for session replay
  - [ ] Google Analytics for usage
- [ ] Configure alerts for critical errors

## API & Rate Limiting

- [ ] Set NEXT_PUBLIC_API_RATE_LIMIT (recommended: 5)
- [ ] Set NEXT_PUBLIC_API_RATE_WINDOW (recommended: 3600)
- [ ] Test rate limiting works
- [ ] Verify API key validation on all endpoints
- [ ] Test with invalid API key (should return 401)

## Security Review

- [ ] HTTPS enabled on domain
- [ ] API secret key is strong (min 32 characters)
- [ ] No sensitive data in error messages
- [ ] CORS headers properly configured
- [ ] Content Security Policy headers set
- [ ] X-Frame-Options header prevents clickjacking
- [ ] X-Content-Type-Options header prevents MIME sniffing
- [ ] SQL injection protection (using Firebase, not applicable)
- [ ] XSS protection enabled (React by default)
- [ ] CSRF tokens not needed (API-only, no forms)
- [ ] Rate limiting active
- [ ] Input validation enabled

## Performance

- [ ] Enable Vercel caching
- [ ] Configure build cache
- [ ] Test page load performance (> 3s is bad)
- [ ] Verify images are optimized
- [ ] Check Time to First Byte (TTFB < 600ms)
- [ ] Monitor database query performance

## Vercel Deployment

- [ ] Repository pushed to GitHub
- [ ] Project imported in Vercel
- [ ] Environment variables added to Vercel project
- [ ] Deployment preview tested
- [ ] Production domain configured
- [ ] Custom domain SSL certificate valid
- [ ] Email notifications configured
- [ ] Git integration verified (auto-deploy on push)

## DNS & Domain

- [ ] Domain A record points to Vercel
- [ ] Domain www CNAME points to Vercel
- [ ] SSL certificate is valid
- [ ] DNS propagation complete
- [ ] Test domain in browser

## Testing - Core Functionality

- [ ] Test video generation end-to-end:
  - [ ] Submit script
  - [ ] Receive videoId
  - [ ] Monitor progress in UI
  - [ ] Video completes successfully
  - [ ] Video is downloadable
  - [ ] Video plays correctly
- [ ] Test error handling:
  - [ ] Missing API key returns 401
  - [ ] Invalid input returns 400
  - [ ] Server error returns 500
  - [ ] Rate limit returns 429
- [ ] Test UI:
  - [ ] Forms validate correctly
  - [ ] Error messages display
  - [ ] Success messages display
  - [ ] Progress bar updates in real-time
  - [ ] Responsive on mobile

## Testing - Edge Cases

- [ ] Very short script (10 chars)
- [ ] Very long script (10000 chars)
- [ ] Special characters in title
- [ ] Rapid consecutive requests
- [ ] Simultaneous multiple videos
- [ ] Video cancellation (if implemented)
- [ ] Network timeout scenarios

## Backup & Disaster Recovery

- [ ] Firestore backup enabled (daily)
- [ ] Cloud Storage backup strategy defined
- [ ] Redis dump file backup strategy
- [ ] Secrets/keys backed up securely
- [ ] Disaster recovery procedure documented
- [ ] Team has access to backups

## Documentation

- [ ] README.md complete and accurate
- [ ] DEPLOYMENT.md complete
- [ ] API documentation clear
- [ ] Environment variables documented
- [ ] Troubleshooting guide provided
- [ ] Team access documentation

## Monitoring & Alerts

- [ ] Error tracking active (Sentry/LogRocket)
- [ ] Performance monitoring enabled
- [ ] Database quota alerts set
- [ ] API rate limit alerts set
- [ ] Redis memory alerts set
- [ ] Storage quota alerts set
- [ ] Team notified of critical alerts

## Post-Deployment

- [ ] Monitor for errors in first 24 hours
- [ ] Check application logs daily
- [ ] Monitor API usage and costs
- [ ] Verify backups are working
- [ ] Test recovery procedures
- [ ] Get team feedback
- [ ] Plan scaling if needed

## Maintenance Plan

- [ ] Weekly: Review logs and metrics
- [ ] Weekly: Check for security updates
- [ ] Monthly: Review performance metrics
- [ ] Monthly: Test backup restoration
- [ ] Quarterly: Security audit
- [ ] Quarterly: Dependency updates
- [ ] Annually: Full disaster recovery test

## Sign-off

- [ ] Project owner approval: ******\_\_\_****** Date: **\_\_**
- [ ] DevOps approval: ******\_\_\_****** Date: **\_\_**
- [ ] Security approval: ******\_\_\_****** Date: **\_\_**

---

**Deployment Date**: ******\_\_\_******

**Deployed By**: ******\_\_\_******

**Production URL**: ******\_\_\_******

**Notes**:
