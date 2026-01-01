# Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Redis running locally (or Upstash account)
- Firebase project created
- API keys obtained:
  - Groq: https://console.groq.com
  - ElevenLabs: https://elevenlabs.io
  - HuggingFace: https://huggingface.co

## 1. Setup (2 minutes)

```bash
# Clone and install
git clone <your-repo>
cd finance-video-automation
npm install

# Copy environment template
cp .env.example .env.local
```

## 2. Configure Environment (2 minutes)

Edit `.env.local` with your keys:

```env
# Firebase (from Firebase Console)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_CLIENT_EMAIL=your-email@appspot.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# API Keys
GROQ_API_KEY=your_groq_key
ELEVENLABS_API_KEY=your_elevenlabs_key
HUGGINGFACE_API_KEY=your_huggingface_key

# Redis (local or Upstash)
REDIS_URL=redis://localhost:6379

# Security
API_SECRET_KEY=your_random_secret_key_min_32_chars
```

## 3. Start Services (30 seconds)

```bash
# Terminal 1: Start Redis
docker run -d -p 6379:6379 redis:alpine
# Or: redis-server

# Terminal 2: Start Next.js
npm run dev

# Open http://localhost:3000
```

## 4. Configure API Key in UI (15 seconds)

1. Click the "Configure" button (top right)
2. Paste your API_SECRET_KEY
3. Click "Save"

## 5. Generate Your First Video (2 minutes)

1. **Enter Video Title**: "My First Video"
2. **Paste Script** (or click "Load Example Script"):
   ```
   In the world of money, there are three enemies...
   ```
3. **Select Video Length**: 60 seconds
4. **Click "Generate Video"**

## Monitoring Progress

- Watch the progress bar in real-time
- Check logs for details:
  ```bash
  tail -f logs/combined.log
  ```

## Done! 🎉

Your video will complete in ~5-15 minutes depending on:

- API response times
- Number of scenes
- Server resources

## Next Steps

### Production Deployment

1. Read [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel setup
2. Use [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) before going live
3. Reference [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) if issues arise

### Advanced Configuration

- Adjust rate limiting in `.env.local`
- Configure logging levels
- Set up monitoring (Sentry, DataDog, etc.)
- Implement custom styling

## Common Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm start             # Start production server

# Debugging
tail -f logs/combined.log    # View all logs
tail -f logs/error.log       # View errors only
curl -H "x-api-key: key" http://localhost:3000/api/check-status

# Database
firebase firestore:query /videos
firebase firestore:delete --all
```

## Troubleshooting Quick Fixes

| Issue                      | Fix                                        |
| -------------------------- | ------------------------------------------ |
| "Cannot find module"       | `rm -rf .next node_modules && npm install` |
| "Redis connection refused" | `docker run -d -p 6379:6379 redis:alpine`  |
| "API key not configured"   | Reload page and set API key in UI          |
| "Video stuck on pending"   | Check logs: `tail -f logs/combined.log`    |
| "Rate limited"             | Wait 1 hour or increase `API_RATE_LIMIT`   |

For more help, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## API Example

```bash
# Generate a video
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_secret_key" \
  -d '{
    "script": "Your financial education script here",
    "title": "Video Title",
    "videoLength": 60
  }'

# Check status
curl -H "x-api-key: your_api_secret_key" \
  http://localhost:3000/api/check-status
```

## Key Files to Know

| File                                  | Purpose                                       |
| ------------------------------------- | --------------------------------------------- |
| `.env.local`                          | Environment variables (SECRET - don't commit) |
| `src/app/page.js`                     | Main UI                                       |
| `src/app/api/generate-video/route.js` | Video generation endpoint                     |
| `src/lib/groq.js`                     | AI script processing                          |
| `logs/combined.log`                   | Application logs                              |

## Documentation

- 📖 [README.md](./README.md) - Full documentation
- 🚀 [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- ✅ [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Pre-launch verification
- 🐛 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Debugging guide

---

**Having issues?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or review logs with `tail -f logs/combined.log`
