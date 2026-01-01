# Atlas Economy - Deployment & Setup Guide

## Prerequisites

- Node.js 18+ installed
- Firebase project created
- Groq API key
- ElevenLabs API key
- HuggingFace API key
- Redis instance (for job queue)
- FFmpeg installed on server

## Environment Setup

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Fill in all required environment variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
GROQ_API_KEY=...
ELEVENLABS_API_KEY=...
HUGGINGFACE_API_KEY=...
REDIS_URL=redis://localhost:6379
API_SECRET_KEY=your_secret_key_here
```

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start Redis (if not running):

```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or using Redis installation
redis-server
```

3. Build the project:

```bash
npm run build
```

4. Start the development server:

```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

## Production Deployment (Vercel)

### 1. Push to GitHub

```bash
git push origin main
```

### 2. Set Environment Variables on Vercel

- Go to Vercel project settings
- Add all variables from `.env.example`
- Important: Add `API_SECRET_KEY` for API authentication

### 3. Configure Firestore Indexes

Run in Firebase Console or using Firebase CLI:

```bash
firebase firestore:indexes:create
```

Required indexes:

- Collection: `videos`
- Fields: `createdAt` (Descending), `status` (Ascending)

### 4. Deploy

- Vercel will automatically deploy on push to main branch
- Check deployment status at https://vercel.com/dashboard

### 5. Set up Redis for Production

Recommended: Use **Upstash Redis**

- Create account at https://upstash.com
- Create Redis database
- Copy connection URL to `REDIS_URL` env var on Vercel

## API Authentication

All API requests must include the `x-api-key` header:

```bash
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_secret_key" \
  -d '{
    "script": "Your script here...",
    "title": "Video Title",
    "videoLength": 60
  }'
```

## Database Indexes (Firestore)

Create these indexes for optimal performance:

### Videos Collection

1. **Index**: `createdAt` (Desc) + `status` (Asc)

   - Used by: getVideos() query
   - Priority: High

2. **Index**: `status` (Asc) + `createdAt` (Desc)
   - Used by: Status-based filtering
   - Priority: Medium

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── check-status/route.js      # Get videos
│   │   ├── generate-video/route.js     # Start video generation
│   │   └── process-script/route.js     # Process script (optional)
│   ├── page.js                          # Main UI
│   └── layout.js
├── components/
│   ├── VideoGenerator.js                # Form to submit scripts
│   ├── VideoQueue.js                    # Show processing videos
│   └── CompletedVideos.js               # Display finished videos
├── lib/
│   ├── elevenlabs.js                    # Text-to-speech
│   ├── firebase.js                      # Client Firebase config
│   ├── firebaseAdmin.js                 # Server Firebase admin
│   ├── groq.js                          # AI script processing
│   ├── huggingface.js                   # Image generation
│   ├── jobQueue.js                      # BullMQ job queue
│   ├── logger.js                        # Winston logging
│   ├── middleware.js                    # Auth & rate limiting
│   └── validation.js                    # Input validation
└── utils/
    ├── videoAssembler.js                # Video creation
    └── sceneProcessor.js                # Scene processing (optional)
```

## Monitoring & Logs

### Local Development

- Logs appear in console and in `logs/` directory
- Check `logs/combined.log` for all events
- Check `logs/error.log` for errors only

### Production (Vercel)

- View logs in Vercel dashboard
- Logs stored for 24 hours
- Integrate with external logging (Sentry, etc.) if needed

## Troubleshooting

### "Module not found" errors

- Ensure all imports use `@/` aliases correctly
- Check that `jsconfig.json` is in root directory
- Run `npm install` again if needed

### Redis connection errors

- Verify Redis is running
- Check `REDIS_URL` environment variable
- For production, use Upstash Redis URL

### API Key errors

- Add `x-api-key` header to all requests
- Verify key matches `API_SECRET_KEY` env var
- Check header spelling: `x-api-key` (lowercase)

### Video processing fails

- Check all API keys (Groq, ElevenLabs, HuggingFace)
- Verify FFmpeg is installed on server
- Check Firebase credentials and permissions
- Review logs in Vercel dashboard

### Firestore quota exceeded

- Upgrade Firebase billing plan
- Implement caching layer for frequently read data
- Batch write operations where possible

## Performance Optimization

### 1. Caching

- Video list is fetched every 10 seconds
- Consider implementing Redis caching for `getVideos()`

### 2. Rate Limiting

- Default: 10 requests per hour per IP
- Configure in `API_RATE_LIMIT` and `API_RATE_WINDOW` env vars

### 3. Job Queue

- Videos process one at a time
- Increase concurrency in `jobQueue.js` if needed
- Monitor queue backlog in BullMQ dashboard

### 4. Storage

- Videos stored on Firebase Cloud Storage
- Configure TTL for old files to save costs
- Use CDN for video delivery

## Security Checklist

- [ ] API_SECRET_KEY is strong and unique
- [ ] Firebase private key is in env vars (not in code)
- [ ] API keys are restricted to appropriate services
- [ ] CORS enabled only for your domain
- [ ] Rate limiting is enabled
- [ ] Firestore rules restrict writes to authenticated users
- [ ] Cloud Storage rules restrict access appropriately
- [ ] Regular backups of Firestore data
- [ ] Monitor API usage and costs

## Support & Debugging

### Enable Debug Logging

Set in `.env.local`:

```
NODE_ENV=development
```

### Check Specific Logs

```bash
# View recent errors
tail -f logs/error.log

# View all activity
tail -f logs/combined.log
```

### Test API Endpoints

```bash
# Check video status
curl -H "x-api-key: your_key" http://localhost:3000/api/check-status

# Generate video
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_key" \
  -d '{"script":"test","title":"test","videoLength":60}'
```

## Next Steps

1. ✅ Set up all environment variables
2. ✅ Test locally with `npm run dev`
3. ✅ Push to GitHub
4. ✅ Configure Vercel deployment
5. ✅ Set Firestore indexes
6. ✅ Set up production Redis
7. ✅ Monitor logs and metrics
8. ✅ Scale as needed
