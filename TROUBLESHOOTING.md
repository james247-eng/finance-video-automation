# Troubleshooting Guide

## Common Issues and Solutions

### Build Issues

#### Error: "Cannot find module '@/lib/groq'"

**Cause**: Module path alias not configured or import path wrong
**Solution**:

1. Check `jsconfig.json` has correct baseUrl and paths
2. Verify file exists at `src/lib/groq.js`
3. Clear cache: `rm -rf .next node_modules`
4. Reinstall: `npm install`
5. Rebuild: `npm run build`

#### Error: "Invalid next.config.js options"

**Cause**: Configuration contains unrecognized properties
**Solution**:

1. Remove `api` object from `next.config.js`
2. Use Next.js 15 compatible configuration only
3. See [next.config.js documentation](https://nextjs.org/docs/app/api-reference/next-config-js)

### Runtime Errors

#### Error: "GROQ_API_KEY not configured"

**Cause**: Environment variable missing or invalid
**Solution**:

1. Verify `GROQ_API_KEY` is in `.env.local`
2. Get key from https://console.groq.com
3. Restart dev server: `npm run dev`
4. Check `process.env.GROQ_API_KEY` is not undefined

#### Error: "Firebase Admin credentials invalid"

**Cause**: Firebase credentials not properly configured
**Solution**:

1. Download service account key from Firebase Console
2. Set environment variables:
   ```bash
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
   FIREBASE_CLIENT_EMAIL=your-email@appspot.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
3. Ensure private key has proper newline escaping (\n)
4. Test with: `firebase init` in CLI

#### Error: "Redis connection refused"

**Cause**: Redis not running or wrong URL
**Solution**:

1. Start Redis:

   ```bash
   # Docker
   docker run -d -p 6379:6379 redis:alpine

   # Or local
   redis-server
   ```

2. Verify REDIS_URL is correct
3. Test connection:
   ```bash
   redis-cli ping  # Should return: PONG
   ```
4. For Vercel, use Upstash Redis URL

#### Error: "API key unauthorized (401)"

**Cause**: Missing or invalid API key header
**Solution**:

1. Include `x-api-key` header in requests:
   ```bash
   curl -H "x-api-key: your_key" http://localhost:3000/api/check-status
   ```
2. Verify header name is lowercase: `x-api-key`
3. Ensure `API_SECRET_KEY` is set in environment
4. Check key matches exactly (case-sensitive)

#### Error: "Rate limit exceeded (429)"

**Cause**: Too many requests from same IP
**Solution**:

1. Wait for rate limit window to expire (default 1 hour)
2. Increase limit: Update `NEXT_PUBLIC_API_RATE_LIMIT` env var
3. Increase window: Update `NEXT_PUBLIC_API_RATE_WINDOW` env var
4. For production, implement Redis-based rate limiting

### Feature Issues

#### Videos stuck in "pending" status

**Cause**: Job queue not processing
**Solution**:

1. Verify Redis is running
2. Check job queue logs:
   ```bash
   tail -f logs/combined.log | grep -i job
   ```
3. Check BullMQ dashboard if available
4. Restart the application
5. Check if worker is running in server logs

#### Video generation fails with "No valid JSON"

**Cause**: Groq AI response invalid
**Solution**:

1. Check script is valid (min 10 chars)
2. Try with simpler script
3. Verify GROQ_API_KEY is correct
4. Check Groq API rate limits haven't been exceeded
5. Review request in logs: `tail -f logs/combined.log | grep -i groq`

#### Images not generated (HuggingFace errors)

**Cause**: Model loading or API errors
**Solution**:

1. Wait 30 seconds for model to load
2. Verify HUGGINGFACE_API_KEY is correct
3. Check if model is available: https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0
4. Check error log: `tail -f logs/error.log | grep -i huggingface`
5. Try simpler image prompts

#### Voiceover generation fails

**Cause**: ElevenLabs quota or API errors
**Solution**:

1. Check ElevenLabs quota: https://elevenlabs.io/app/subscription
2. Verify ELEVENLABS_API_KEY is correct
3. Try shorter text
4. Check character count isn't excessive
5. Review response: `tail -f logs/error.log | grep -i elevenlabs`

#### Video doesn't assemble (FFmpeg errors)

**Cause**: FFmpeg not installed or misconfigured
**Solution**:

1. Check FFmpeg installed:
   ```bash
   ffmpeg -version  # Should show version
   ```
2. Install if missing:

   ```bash
   # Mac
   brew install ffmpeg

   # Ubuntu/Debian
   sudo apt-get install ffmpeg

   # Windows
   choco install ffmpeg
   ```

3. Check temp directory has write permissions
4. Verify images are valid PNG files
5. Check audio file is valid MP3

### UI/UX Issues

#### "API key not configured" message always shows

**Cause**: localStorage not initialized properly
**Solution**:

1. Open browser DevTools (F12)
2. Check if apiKey is in localStorage:
   ```javascript
   localStorage.getItem("apiKey");
   ```
3. Set manually:
   ```javascript
   localStorage.setItem("apiKey", "your_key");
   ```
4. Clear and reload:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

#### Progress bar not updating

**Cause**: Polling not working or status not changing
**Solution**:

1. Check network requests in DevTools Network tab
2. Verify polling interval (should be every 10s)
3. Check Firestore has correct video status
4. Monitor: `tail -f logs/combined.log | grep -i progress`

#### Videos not appearing in UI

**Cause**: Check-status endpoint not returning videos
**Solution**:

1. Verify API key is set
2. Check browser console for errors (F12)
3. Test endpoint directly:
   ```bash
   curl -H "x-api-key: your_key" http://localhost:3000/api/check-status
   ```
4. Verify Firestore has videos:
   ```bash
   firebase firestore:query --collection=videos
   ```
5. Check API logs: `tail -f logs/combined.log | grep -i check-status`

### Database Issues

#### "Permission denied" writing to Firestore

**Cause**: Security rules too restrictive
**Solution**:

1. Go to Firebase Console > Firestore > Rules
2. Temporarily allow all reads/writes (development only):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
3. For production, implement proper authentication
4. Set rules back to secure after testing

#### Missing Firestore indexes

**Cause**: Composite indexes not created
**Solution**:

1. Create indexes in Firebase Console
2. Or use CLI:
   ```bash
   firebase firestore:indexes:create
   ```
3. Required indexes:
   - Collection: videos
   - Fields: createdAt (Desc), status (Asc)
   - Fields: status (Asc), createdAt (Desc)

#### "Quota exceeded" errors

**Cause**: Firestore billing quota reached
**Solution**:

1. Upgrade Firebase billing plan
2. Implement caching layer
3. Batch write operations
4. Archive old data
5. Check usage in Firebase Console

### Storage Issues

#### Videos not uploading to Cloud Storage

**Cause**: Permissions or bucket issues
**Solution**:

1. Verify bucket name in environment
2. Check bucket permissions in Firebase Console
3. Ensure file size < 10GB
4. Test upload with gsutil:
   ```bash
   gsutil cp test.mp4 gs://your-bucket/test.mp4
   ```

#### Videos not downloadable

**Cause**: Permissions or URL issues
**Solution**:

1. Verify video URL is accessible:
   ```bash
   curl -I https://storage.googleapis.com/...
   ```
2. Check file is public (makePublic() called)
3. Verify bucket CORS configuration
4. Test download in new incognito window

### Performance Issues

#### Slow video generation

**Cause**: Long processing time
**Solution**:

1. Check logs for bottlenecks:
   ```bash
   tail -f logs/combined.log
   ```
2. Monitor external API response times
3. Consider parallel processing (if safe)
4. Reduce image quality if applicable
5. Check server resources (CPU, RAM)

#### High memory usage

**Cause**: Large files in memory
**Solution**:

1. Stream large files instead of buffering
2. Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096 npm start`
3. Monitor with: `node --prof app.js`
4. Check for memory leaks: `npx clinic.js bubble app.js`

#### Slow database queries

**Cause**: Missing indexes or large data
**Solution**:

1. Create composite indexes (see above)
2. Limit result sets: `getVideos(50)` instead of all
3. Add pagination if needed
4. Monitor query performance in Firebase Console

## Debugging Strategies

### Enable Debug Logging

```javascript
// In .env.local
NODE_ENV=development

// Then view logs
tail -f logs/combined.log
```

### Check API Endpoints

```bash
# Test check-status
curl -H "x-api-key: your_key" http://localhost:3000/api/check-status

# Test generate-video
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_key" \
  -d '{"script":"test","title":"test","videoLength":60}'
```

### Inspect Browser Console

Press F12 to open DevTools:

- **Console** - JavaScript errors
- **Network** - API calls and responses
- **Application** - LocalStorage, SessionStorage
- **Performance** - Load times

### View Server Logs

```bash
# Real-time error log
tail -f logs/error.log

# All activity
tail -f logs/combined.log

# Last 100 lines of combined
tail -100 logs/combined.log

# Search for specific errors
grep "error" logs/combined.log
```

### Test External Services

```bash
# Test Groq API
curl -X POST https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY"

# Test ElevenLabs
curl -H "xi-api-key: $ELEVENLABS_API_KEY" \
  https://api.elevenlabs.io/v1/user

# Test HuggingFace
curl -H "Authorization: Bearer $HUGGINGFACE_API_KEY" \
  https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0

# Test Firebase
firebase firestore:get /videos
```

## Getting Help

1. **Check Logs** - First place to look

   ```bash
   tail -f logs/combined.log
   ```

2. **Search Documentation**

   - [README.md](./README.md) - Overview
   - [DEPLOYMENT.md](./DEPLOYMENT.md) - Setup guide
   - [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Verification

3. **Test Manually**

   - Use curl to test APIs
   - Check each service individually
   - Verify environment variables

4. **Review Recent Changes**

   - What was updated recently?
   - When did the error start?
   - Any dependency updates?

5. **Isolate the Issue**

   - Is it UI or backend?
   - Is it a specific API or all APIs?
   - Does it affect all videos or one?

6. **Report Issues**
   - Include full error message
   - Include relevant logs
   - Specify steps to reproduce
   - Note environment (dev/prod, URL, time)
