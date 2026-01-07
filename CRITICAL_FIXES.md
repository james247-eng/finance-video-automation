# QUICK REFERENCE: BROKEN CONNECTIONS & MISCONFIGURATIONS

## 🔴 CRITICAL BUGS - FIX IMMEDIATELY

### Bug #1: API Key Validation Will Always Fail

**File**: `src/app/api/generate-video/route.js` - Line 99

```javascript
// WRONG - checking wrong environment variable
if (apiKey !== process.env.MY_APP_API_KEY) {
  return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
}
```

**Fix**:

```javascript
// CORRECT
if (apiKey !== process.env.API_SECRET_KEY) {
  return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
}
```

**Impact**: Every API request from frontend will be rejected with 401 Unauthorized

---

### Bug #2: GitHub Workflow Runs Wrong Script

**File**: `.github/workflows/render-video.yml` - Line 29

```yaml
# WRONG - This is a test script, not the render script!
run: node scripts/test-apis.js
```

**Fix**:

```yaml
# CORRECT
run: node scripts/render.js
```

**Impact**: Even if workflow triggers, it won't do any video processing

---

### Bug #3: Workflow Missing GitHub Payload Variables

**File**: `.github/workflows/render-video.yml` - Lines 30-33

```yaml
# WRONG - Variable names don't match what API sends
env:
  FIREBASE_KEY: ${{ secrets.FIREBASE_KEY }} # ← WRONG
  VIDEO_DATA: ${{ github.event.client_payload.data }} # ← This structure doesn't exist
```

**Fix**:

```yaml
# CORRECT
env:
  VIDEO_ID: ${{ github.event.client_payload.videoId }}
  VIDEO_TITLE: ${{ github.event.client_payload.title }}
  SCENES: ${{ toJSON(github.event.client_payload.scenes) }}
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
  FIREBASE_CLIENT_EMAIL: ${{ secrets.FIREBASE_CLIENT_EMAIL }}
  FIREBASE_PRIVATE_KEY: ${{ secrets.FIREBASE_PRIVATE_KEY }}
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
```

**Impact**: render.js won't receive required VIDEO_ID, VIDEO_TITLE, SCENES variables; Firebase secrets won't be available

---

### Bug #4: Missing GitHub Secrets in Repository

**File**: Repository Settings → Secrets

**Missing Secrets**:

```
FIREBASE_PROJECT_ID          ← Add this
FIREBASE_CLIENT_EMAIL        ← Add this
FIREBASE_PRIVATE_KEY         ← Add this
FIREBASE_STORAGE_BUCKET      ← Add this
MY_GITHUB_TOKEN              ← Needed by API to trigger workflow
GROQ_API_KEY                 ← Needed by render.js if processing script
ELEVENLABS_API_KEY           ← Needed by render.js
HUGGINGFACE_API_KEY          ← Needed by render.js
```

**Impact**: GitHub Actions worker cannot authenticate with Firebase or call AI services

---

### Bug #5: Mock Scene Generation Instead of Real Processing

**File**: `src/app/api/generate-video/route.js` - Lines 82-87

```javascript
// WRONG - Returns hardcoded dummy scenes
const scenes = [
  {
    text: "Introduction to " + title,
    duration: 5,
    imageUrl: "https://example.com/img1.png",
  },
  {
    text: script.substring(0, 50),
    duration: 10,
    imageUrl: "https://example.com/img2.png",
  },
];
```

**The Real Code Is Commented Out** (Lines 1-75):

```javascript
// This is disabled but should be used:
const scenes = await processScriptToScenes(script, videoLength);
```

**Fix**: Replace entire current implementation (Lines 75-156) with uncommented version

**Impact**: Videos are queued with completely wrong content; Groq AI script processing never happens

---

## 🟠 HIGH PRIORITY ISSUES

### Issue #6: FFmpeg Binary Path Missing in videoAssembler.js

**File**: `src/utils/videoAssembler.js` - Missing from imports

```javascript
// Current (WRONG - assumes ffmpeg in PATH)
import ffmpeg from "fluent-ffmpeg";

// Should be (CORRECT)
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

// Then set the path:
ffmpeg.setFfmpegPath(ffmpegStatic);
```

**Impact**: If this code runs, FFmpeg operations will fail with "ffmpeg not found" error

---

### Issue #7: GitHub Token Not Passed to Workflow

**File**: `.github/workflows/render-video.yml` - Missing

```yaml
# Add this to env:
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Impact**: Workflow cannot make authenticated GitHub API calls if needed

---

## 🟡 ARCHITECTURAL ISSUES

### Issue #8: Unused Queue System

**Files**:

- `src/lib/jobQueue.js` - BullMQ configured
- `src/utils/videoAssembler.js` - Processing pipeline defined
- `src/app/api/generate-video/route.js` - Never calls `addVideoToQueue()`

**The Problem**:

```javascript
// jobQueue.js is fully implemented but:
export async function addVideoToQueue(videoId, scenes) { ... }

// The commented API code HAD this:
await addVideoToQueue(videoId, scenes)

// But current API does NOT call it!
```

**Decision Needed**:

- **Option A**: Use GitHub Actions dispatch only → Remove Redis/BullMQ setup
- **Option B**: Use Redis locally → Keep queue system, don't use GitHub Actions
- **Current**: Broken hybrid that does neither properly

---

### Issue #9: Dead Code Paths

These functions are implemented but NEVER CALLED from the active code:

1. **processScriptToScenes()** - `src/lib/groq.js`

   - Converts script to scene objects
   - Commented API code called this; current code returns mock scenes

2. **generateStickFigureImage()** - `src/lib/huggingface.js`

   - Generates images for scenes
   - Only called from unused videoAssembler

3. **generateVoiceoverFromScenes()** - `src/lib/elevenlabs.js`

   - Generates audio from scenes
   - Only called from unused videoAssembler

4. **processVideo()** - `src/utils/videoAssembler.js`

   - Full video assembly pipeline
   - Never called anywhere

5. **addVideoToQueue()** - `src/lib/jobQueue.js`
   - Queues jobs for processing
   - Not called from API

---

## 📊 SIGNAL FLOW VERIFICATION

### What VideoGenerator.js Sends:

```json
{
  "script": "...",
  "title": "...",
  "videoLength": 60,
  "apiKey": "from localStorage"
}
```

### What /api/generate-video Receives:

```javascript
const apiKey = req.headers["x-api-key"]; // ✓ Correct
const { script, title, videoLength } = req.body; // ✓ Correct
```

### What /api/generate-video Validates:

```javascript
if (apiKey !== process.env.MY_APP_API_KEY)     // ❌ WRONG - checks MY_APP_API_KEY
                                               //    Should check API_SECRET_KEY
```

### What /api/generate-video Sends to GitHub:

```javascript
{
  event_type: 'start-video-render',
  client_payload: {
    videoId: videoId,
    title: title,
    scenes: scenes                              // ❌ Mock scenes, not real!
  }
}
```

### What GitHub Workflow Expects:

```javascript
// In render.js:
const videoId = process.env.VIDEO_ID; // ❌ Never set in workflow!
const scenes = JSON.parse(process.env.SCENES); // ❌ Never set in workflow!
const title = process.env.VIDEO_TITLE; // ❌ Never set in workflow!
```

---

## 🔧 ENVIRONMENT VARIABLE CHECKLIST

### Vercel Environment Variables (must have):

```
✓ NEXT_PUBLIC_FIREBASE_PROJECT_ID
✓ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
✓ NEXT_PUBLIC_FIREBASE_API_KEY
✓ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
✓ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
✓ NEXT_PUBLIC_FIREBASE_APP_ID
✓ FIREBASE_CLIENT_EMAIL
✓ FIREBASE_PRIVATE_KEY
✓ GROQ_API_KEY
✓ ELEVENLABS_API_KEY
✓ HUGGINGFACE_API_KEY
✗ API_SECRET_KEY (named MY_APP_API_KEY in code - MISMATCH!)
✗ MY_GITHUB_TOKEN (not in .env.example)
✗ REDIS_URL (won't work on Vercel with ephemeral storage)
```

### GitHub Secrets (must have):

```
✗ FIREBASE_PROJECT_ID (missing)
✗ FIREBASE_CLIENT_EMAIL (missing)
✗ FIREBASE_PRIVATE_KEY (missing)
✗ FIREBASE_STORAGE_BUCKET (missing)
✗ MY_GITHUB_TOKEN (missing - needed for API)
✗ GROQ_API_KEY (missing - for render.js)
✗ ELEVENLABS_API_KEY (missing - for render.js)
✗ HUGGINGFACE_API_KEY (missing - for render.js)
```

---

## 🎯 MINIMAL FIX TO GET WORKING (30 minutes)

### Step 1: Fix API Key Validation (2 min)

**File**: `src/app/api/generate-video/route.js:99`
Change: `process.env.MY_APP_API_KEY` → `process.env.API_SECRET_KEY`

### Step 2: Fix Workflow Script (1 min)

**File**: `.github/workflows/render-video.yml:29`
Change: `node scripts/test-apis.js` → `node scripts/render.js`

### Step 3: Fix Workflow Environment (5 min)

**File**: `.github/workflows/render-video.yml:30-33`
Replace entire env block with correct variables and secrets

### Step 4: Add GitHub Secrets (10 min)

1. Go to repository Settings → Secrets and variables → Actions
2. Add 8 secrets listed above

### Step 5: Set Vercel Environment Variables (5 min)

1. Go to Vercel Project Settings → Environment Variables
2. Add `API_SECRET_KEY` (ensure it matches what frontend uses)
3. Add `MY_GITHUB_TOKEN` (GitHub personal access token)

### Step 6: Uncomment Real Implementation (5 min)

**File**: `src/app/api/generate-video/route.js`

- Delete lines 75-156 (mock implementation)
- Uncomment lines 1-75 (real implementation)
- Adjust if needed based on function signatures

---

## ✅ VERIFICATION CHECKLIST

After fixes, verify:

- [ ] `curl -X POST http://localhost:3000/api/generate-video -H "x-api-key: $(echo $API_SECRET_KEY)" -H "Content-Type: application/json" -d '{"script":"test","title":"test","videoLength":60}'` returns 202 (not 401)
- [ ] Check GitHub Actions workflow triggers when API is called
- [ ] Check render.js receives VIDEO_ID, VIDEO_TITLE, SCENES environment variables
- [ ] Check render.js can authenticate with Firebase
- [ ] Check video record created in Firestore with correct status
