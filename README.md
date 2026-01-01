# Atlas Economy - AI Video Generation Platform

A production-ready Next.js application that automates the creation of financial education videos using AI. Combines script processing, scene generation, voiceover synthesis, and video assembly into a seamless automation pipeline.

## 🌟 Features

- **AI Script Processing** - Converts user scripts into structured visual scenes using Groq LLM
- **Automatic Scene Generation** - Creates stick figure animations with AI-generated images via HuggingFace
- **Text-to-Speech** - Generates professional voiceovers using ElevenLabs
- **Video Assembly** - Combines images and audio into MP4 videos using FFmpeg
- **Real-time Status** - Live progress tracking with 10-second polling updates
- **Cloud Storage** - Videos and images stored on Firebase Cloud Storage
- **Job Queue** - Processes videos asynchronously using BullMQ + Redis
- **Rate Limiting** - Built-in API rate limiting to prevent abuse
- **Comprehensive Logging** - Winston-based logging to files and console
- **Input Validation** - Server-side validation for all user inputs
- **Error Handling** - Graceful error handling with user-friendly messages
- **API Authentication** - API key validation for secure endpoint access

## 🏗️ Architecture

### Frontend

- **Next.js 15** - React framework with server-side rendering
- **Client Components** - VideoGenerator, VideoQueue, CompletedVideos
- **Polling** - 10-second intervals to check video status
- **LocalStorage** - Stores API key securely on client

### Backend

- **API Routes** - `/api/generate-video`, `/api/check-status`
- **Middleware** - Authentication, rate limiting, error handling
- **Job Queue** - BullMQ + Redis for async video processing
- **Logging** - Winston logger for all operations

### External Services

- **Groq AI** - Script processing and scene generation
- **HuggingFace** - Stick figure image generation
- **ElevenLabs** - Professional text-to-speech
- **Firebase** - Firestore database + Cloud Storage
- **Redis** - Job queue and caching

## 📋 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── check-status/route.js      # GET /api/check-status
│   │   └── generate-video/route.js    # POST /api/generate-video
│   ├── globals.css
│   ├── layout.js
│   └── page.js                         # Main UI
├── components/
│   ├── VideoGenerator.js               # Form component
│   ├── VideoQueue.js                   # Processing videos
│   └── CompletedVideos.js              # Finished videos
├── lib/
│   ├── elevenlabs.js                   # TTS client
│   ├── firebase.js                     # Client-side Firebase
│   ├── firebaseAdmin.js                # Server-side Admin SDK
│   ├── groq.js                         # AI script processor
│   ├── huggingface.js                  # Image generator
│   ├── jobQueue.js                     # BullMQ worker
│   ├── logger.js                       # Winston logging
│   ├── middleware.js                   # Auth & rate limiting
│   └── validation.js                   # Input validation
└── utils/
    └── videoAssembler.js               # FFmpeg video creation

Public/
├── .env.example                        # Environment template
├── DEPLOYMENT.md                       # Deployment guide
└── README.md                           # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Redis (local or cloud)
- FFmpeg
- Firebase project
- API keys: Groq, ElevenLabs, HuggingFace

### Installation

1. **Clone and install**

```bash
git clone <repo>
cd finance-video-automation
npm install
```

2. **Configure environment**

```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

3. **Start Redis**

```bash
# Docker
docker run -d -p 6379:6379 redis:alpine

# Or local installation
redis-server
```

4. **Run development server**

```bash
npm run dev
```

5. **Set API key in UI**

- Navigate to http://localhost:3000
- Click "Configure" button
- Enter your API secret key
- Generate videos!

## 📡 API Reference

### Generate Video

**POST** `/api/generate-video`

```bash
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_secret_key" \
  -d '{
    "script": "Your financial story...",
    "title": "Video Title",
    "videoLength": 60
  }'
```

**Response** (202 Accepted):

```json
{
  "success": true,
  "videoId": "abc123xyz",
  "message": "Video generation started",
  "sceneCount": 12
}
```

### Check Status

**GET** `/api/check-status`

```bash
curl -H "x-api-key: your_secret_key" \
  http://localhost:3000/api/check-status
```

**Response**:

```json
{
  "success": true,
  "videos": [
    {
      "id": "abc123xyz",
      "title": "My Video",
      "status": "processing",
      "progress": 45,
      "currentStep": "Generated 8/12 images",
      "createdAt": "2025-01-01T12:00:00Z"
    }
  ],
  "count": 1
}
```

## ⚙️ Configuration

### Environment Variables

**Required:**

- `GROQ_API_KEY` - Groq LLM API key
- `ELEVENLABS_API_KEY` - ElevenLabs text-to-speech key
- `HUGGINGFACE_API_KEY` - HuggingFace model API key
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Firebase admin email
- `FIREBASE_PRIVATE_KEY` - Firebase private key
- `API_SECRET_KEY` - Your API authentication secret
- `REDIS_URL` - Redis connection URL

**Optional:**

- `NODE_ENV` - Development or production
- `NEXT_PUBLIC_API_RATE_LIMIT` - Rate limit requests (default: 10)
- `NEXT_PUBLIC_API_RATE_WINDOW` - Time window in seconds (default: 3600)

See `.env.example` for complete list.

## 🎥 Video Generation Pipeline

1. **Script Submission** → User provides script and title
2. **Script Processing** → Groq AI converts to scene structure
3. **Image Generation** → HuggingFace creates stick figure images
4. **Voiceover** → ElevenLabs generates audio from scenes
5. **Video Assembly** → FFmpeg combines images + audio
6. **Cloud Upload** → Firebase Storage saves video
7. **Status Update** → Firestore updated with completion

Each step updates progress (0-100%) displayed in real-time.

## 🔐 Security

- ✅ API key validation on all endpoints
- ✅ Input validation (length, type, format)
- ✅ Rate limiting (10 req/hour per IP)
- ✅ Firebase credentials in env variables
- ✅ No sensitive data in logs
- ✅ Error messages don't expose internals
- ✅ CORS headers properly configured

## 📊 Monitoring & Logging

### Log Locations

- **Console** - Development environment
- **logs/combined.log** - All events
- **logs/error.log** - Errors only

### Log Levels

- `error` - Critical failures
- `warn` - Warnings (rate limits, retries)
- `info` - Key events (video created, uploaded)
- `debug` - Detailed progress (disabled in production)

### View Logs

```bash
# Real-time error log
tail -f logs/error.log

# All events
tail -f logs/combined.log

# Last 100 lines
tail -100 logs/combined.log
```

## 🛠️ Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Missing Modules

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Redis Connection Issues

```bash
# Check Redis running
redis-cli ping  # Should return: PONG

# View Redis status
redis-cli info server
```

### Firebase Auth Errors

- Verify private key format (check for escaped newlines)
- Ensure all Firebase credentials are present
- Check Firebase permissions in console

### API Rate Limit Hit

- Wait for time window to expire (default 1 hour)
- Increase `NEXT_PUBLIC_API_RATE_LIMIT` in env vars
- For production, implement Redis-based rate limiting

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub**

```bash
git push origin main
```

2. **Connect to Vercel**

- Go to vercel.com
- Import your GitHub repo
- Add environment variables

3. **Set up Redis**

- Use Upstash (https://upstash.com)
- Add `REDIS_URL` to Vercel env vars

4. **Create Firestore Indexes**

```bash
firebase firestore:indexes:create
```

5. **Deploy**

- Vercel auto-deploys on push to main
- Monitor deployment at vercel.com/dashboard

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed steps.

## 📈 Performance Tips

- Enable video result caching in Firestore
- Use Upstash Redis for production job queue
- Implement CDN for video delivery
- Monitor API usage and costs
- Batch process during off-peak hours

## 🤝 Contributing

1. Create feature branch
2. Make changes with proper logging
3. Add tests for new features
4. Submit PR with description

## 📝 License

MIT License - see LICENSE file

## 📞 Support

- 📚 See [DEPLOYMENT.md](./DEPLOYMENT.md) for setup help
- 🐛 Check logs in `logs/` directory
- 💬 Enable debug mode for detailed logging
- 🔗 Review API documentation above

---

**Built with** Next.js • Groq AI • Firebase • BullMQ
