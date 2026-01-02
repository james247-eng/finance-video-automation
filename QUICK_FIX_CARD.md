# QUICK FIX REFERENCE CARD

## 🔴 5 CRITICAL BUGS - 30 MINUTE FIX

### BUG #1: API Key Validation

```
FILE: src/app/api/generate-video/route.js
LINE: 99
CHANGE:
  FROM: if (apiKey !== process.env.MY_APP_API_KEY) {
  TO:   if (apiKey !== process.env.API_SECRET_KEY) {
TIME: 1 minute
TEST: curl -H "x-api-key: $(echo $API_SECRET_KEY)" ... should return 202
```

### BUG #2: Wrong Script in Workflow

```
FILE: .github/workflows/render-video.yml
LINE: 29
CHANGE:
  FROM: run: node scripts/test-apis.js
  TO:   run: node scripts/render.js
TIME: 1 minute
TEST: Push code, check GitHub Actions tab
```

### BUG #3: Missing Environment Variables

```
FILE: .github/workflows/render-video.yml
LINES: 30-33
REPLACE ENTIRE ENV BLOCK WITH:
---
env:
  VIDEO_ID: ${{ github.event.client_payload.videoId }}
  VIDEO_TITLE: ${{ github.event.client_payload.title }}
  SCENES: ${{ toJSON(github.event.client_payload.scenes) }}
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
  FIREBASE_CLIENT_EMAIL: ${{ secrets.FIREBASE_CLIENT_EMAIL }}
  FIREBASE_PRIVATE_KEY: ${{ secrets.FIREBASE_PRIVATE_KEY }}
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
  GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
  ELEVENLABS_API_KEY: ${{ secrets.ELEVENLABS_API_KEY }}
  HUGGINGFACE_API_KEY: ${{ secrets.HUGGINGFACE_API_KEY }}
---
TIME: 5 minutes
TEST: Workflow execution in GitHub Actions logs
```

### BUG #4: Missing GitHub Secrets

```
LOCATION: GitHub Repository → Settings → Secrets and variables → Actions
ADD THESE 8 SECRETS:
  1. FIREBASE_PROJECT_ID = [your_project_id]
  2. FIREBASE_CLIENT_EMAIL = [your_email]
  3. FIREBASE_PRIVATE_KEY = [your_private_key]
  4. FIREBASE_STORAGE_BUCKET = [your_bucket]
  5. GROQ_API_KEY = [your_groq_key]
  6. ELEVENLABS_API_KEY = [your_elevenlabs_key]
  7. HUGGINGFACE_API_KEY = [your_hf_key]
  8. MY_GITHUB_TOKEN = [your_github_token]
TIME: 10 minutes
TEST: Can view all secrets in Settings
```

### BUG #5: Remove Mock Scenes

```
FILE: src/app/api/generate-video/route.js
LINES: 75-156 (entire current implementation)
ACTION: DELETE - replace with uncommented code from lines 1-75
OR MANUALLY:
CHANGE:
  const scenes = [
    { text: "Introduction to " + title, duration: 5, imageUrl: "https://example.com/img1.png" },
    { text: script.substring(0, 50), duration: 10, imageUrl: "https://example.com/img2.png" }
  ];

TO:
  const scenes = await processScriptToScenes(script, videoLength);
  if (!scenes || scenes.length === 0) {
    throw new Error('No scenes generated from script');
  }
TIME: 5 minutes
TEST: API returns real scene count, not always 2
```

### BUG #6: Add FFmpeg Path

```
FILE: src/utils/videoAssembler.js
LINE: 1 (add after imports)
ADD THIS LINE:
  import ffmpegStatic from 'ffmpeg-static'
  ffmpeg.setFfmpegPath(ffmpegStatic)
TIME: 2 minutes
TEST: FFmpeg operations don't fail with "not found"
```

---

## ✅ VERIFICATION AFTER FIXES

```bash
# Test 1: API Key Works
curl -X POST http://localhost:3000/api/generate-video \
  -H "x-api-key: $API_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"script":"test","title":"test","videoLength":60}'
Expected: 202 Accepted ✓

# Test 2: Firebase Works
curl -X GET http://localhost:3000/api/check-status
Expected: 200 with video list ✓

# Test 3: GitHub Workflow
Push any code change → Check Actions tab → Should run ✓
```

---

## 🚨 IF YOU FIX ONLY THESE 6 THINGS

**You will have**:
✓ API key validation working
✓ GitHub workflow executing correctly
✓ Workflow receiving proper data
✓ Script processing enabled
✓ FFmpeg configured
✓ Secrets accessible

**But still missing**:
❌ Actual scene generation (needs uncommented code)
❌ Image generation implementation
❌ Voiceover generation implementation
❌ Video assembly implementation
❌ Storage upload completion

**Time to "works but incomplete"**: 30 minutes
**Time to "fully working"**: 2-3 hours

---

## 📋 ENVIRONMENT VARIABLES CHECKLIST

### Must Set in Vercel:

```
API_SECRET_KEY=your_secret_key
MY_GITHUB_TOKEN=your_github_token
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=... (with escaped newlines)
GROQ_API_KEY=...
ELEVENLABS_API_KEY=...
HUGGINGFACE_API_KEY=...
REDIS_URL=... (optional, for queue)
```

### Must Set in GitHub Secrets:

```
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
FIREBASE_STORAGE_BUCKET
GROQ_API_KEY
ELEVENLABS_API_KEY
HUGGINGFACE_API_KEY
MY_GITHUB_TOKEN
```

### Variables NOT Used Elsewhere (Remove From Codebase):

```
MY_APP_API_KEY ← DELETE (use API_SECRET_KEY instead)
FIREBASE_KEY ← DELETE (not standard naming)
```

---

## 🔍 WHICH FILE CONTAINS WHAT

| Component       | File                                  | Status        |
| --------------- | ------------------------------------- | ------------- |
| Frontend form   | `src/components/VideoGenerator.js`    | ✓ Works       |
| API endpoint    | `src/app/api/generate-video/route.js` | ❌ Broken     |
| Scene processor | `src/lib/groq.js`                     | ❌ Dead code  |
| Image generator | `src/lib/huggingface.js`              | ❌ Dead code  |
| Voiceover gen   | `src/lib/elevenlabs.js`               | ❌ Dead code  |
| Video assembler | `src/utils/videoAssembler.js`         | ❌ Dead code  |
| GitHub workflow | `.github/workflows/render-video.yml`  | ❌ Broken     |
| GitHub worker   | `scripts/render.js`                   | ❌ Not called |
| Job queue       | `src/lib/jobQueue.js`                 | ❌ Dead code  |
| Status checker  | `src/app/api/check-status/route.js`   | ✓ Works       |

---

## 💡 DECISION NEEDED

**Your queue system: Pick ONE**

**Option A: GitHub Actions Worker** (Recommended)

- Use: GitHub dispatch to trigger render.js
- Remove: Redis/BullMQ from active code
- Keep: For local testing only
- Simpler: No persistent state needed
- Cost: Free GitHub Actions (up to limits)

**Option B: Redis Queue**

- Use: Local Redis for job processing
- Remove: GitHub dispatch
- Implement: Separate worker process
- Scales: Better for many videos
- Cost: Redis hosting needed

**Current Problem**: Both enabled, neither fully working

---

## 📊 DEAD CODE TO DELETE (Optional)

After system works, consider removing unused code:

```
- src/lib/jobQueue.js (if using GitHub approach)
- src/utils/videoAssembler.js (if using GitHub approach)
- src/app/api/process-script/route.js (empty file)
- Commented code blocks in generate-video/route.js
```

Or keep for future use with queue system.

---

## 🎯 DONE WHEN...

You'll know all 6 fixes are working when:

```javascript
// This works:
const response = await fetch("/api/generate-video", {
  method: "POST",
  headers: {
    "x-api-key": "your_api_secret",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    script: "test script",
    title: "test",
    videoLength: 60,
  }),
});

// Returns:
// Status: 202
// Body: { videoId: "xyz123", sceneCount: 12, ... }

// Video appears in Firestore:
// /videos/xyz123 with status "queued"

// GitHub Actions runs:
// .github/workflows/render-video.yml executes

// render.js receives env vars:
// console.log(process.env.VIDEO_ID) = "xyz123"
// console.log(process.env.VIDEO_TITLE) = "test"
// console.log(process.env.SCENES) = "[{...}]"
```

Once this all works → Continue with actual processing implementation

---

## 📞 STILL STUCK?

If after these 6 fixes you still see errors:

1. **API returns 401**: Check env var matches exactly
2. **Workflow doesn't run**: Check GitHub token validity
3. **Workflow runs but fails**: Check GitHub secrets exist and are correct
4. **render.js is undefined**: Check workflow passes env vars
5. **Firebase connection fails**: Check secrets are complete and valid
6. **FFmpeg errors**: Check import is added and path configured

See LINE_BY_LINE_AUDIT.md for detailed debugging guide.
