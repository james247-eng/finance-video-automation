# LINE-BY-LINE ISSUE TRACKING

## 🔴 CRITICAL BUGS WITH EXACT LOCATIONS

### BUG #1: API Key Validation Uses Wrong Environment Variable

**File**: `src/app/api/generate-video/route.js`
**Line**: 99
**Current Code**:

```javascript
if (apiKey !== process.env.MY_APP_API_KEY) {
```

**Problem**:

- Environment variable name doesn't match definition
- `.env.example` defines: `API_SECRET_KEY=...`
- `middleware.js` expects: `process.env.API_SECRET_KEY`
- `validation.js` expects: `process.env.API_SECRET_KEY`
- Only `generate-video/route.js` uses `MY_APP_API_KEY`

**Impact**: Every API request returns 401 Unauthorized

**Fix**:

```javascript
if (apiKey !== process.env.API_SECRET_KEY) {
```

**Severity**: 🔴 CRITICAL - Blocks all API usage

---

### BUG #2: GitHub Workflow Runs Wrong Script

**File**: `.github/workflows/render-video.yml`
**Line**: 29
**Current Code**:

```yaml
- name: Run Video Script
  run: node scripts/test-apis.js
```

**Problem**:

- `test-apis.js` is for testing API endpoints, not rendering videos
- Should call `scripts/render.js` instead
- `render.js` exists and has the video processing logic

**Impact**: Even if workflow triggers, no video processing happens

**Fix**:

```yaml
- name: Run Video Script
  run: node scripts/render.js
```

**Severity**: 🔴 CRITICAL - Workflow does nothing

---

### BUG #3: GitHub Workflow Missing Environment Variable Mapping

**File**: `.github/workflows/render-video.yml`
**Lines**: 30-33
**Current Code**:

```yaml
env:
  FIREBASE_KEY: ${{ secrets.FIREBASE_KEY }}
  VIDEO_DATA: ${{ github.event.client_payload.data }}
```

**Problems**:

1. `secrets.FIREBASE_KEY` doesn't exist (should be split into individual secrets)
2. `github.event.client_payload.data` structure doesn't exist
3. API sends `videoId`, `title`, `scenes` directly in `client_payload`
4. render.js expects:
   - `process.env.VIDEO_ID`
   - `process.env.VIDEO_TITLE`
   - `process.env.SCENES`

**Impact**: render.js cannot access video data

**Fix**:

```yaml
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
```

**Severity**: 🔴 CRITICAL - Workflow lacks required environment variables

---

### BUG #4: Missing GitHub Secrets Configuration

**File**: GitHub Repository Settings → Secrets and variables → Actions
**Status**: NOT CONFIGURED

**Missing Secrets**:

```
FIREBASE_PROJECT_ID           [NOT SET]
FIREBASE_CLIENT_EMAIL         [NOT SET]
FIREBASE_PRIVATE_KEY          [NOT SET]
FIREBASE_STORAGE_BUCKET       [NOT SET]
GROQ_API_KEY                  [NOT SET]
ELEVENLABS_API_KEY            [NOT SET]
HUGGINGFACE_API_KEY           [NOT SET]
MY_GITHUB_TOKEN               [NOT SET]
```

**Impact**:

- GitHub Actions cannot authenticate with Firebase
- Cannot call external AI APIs
- API cannot trigger GitHub Actions

**How to Fix**: Add secrets in GitHub repository settings

**Severity**: 🔴 CRITICAL - Blocks all integrations

---

### BUG #5: Mock Scene Generation Instead of Real Processing

**File**: `src/app/api/generate-video/route.js`
**Lines**: 82-87 (current), 48-50 (commented - the real code)
**Current Code** (WRONG):

```javascript
// MOCKING - NOT CALLING GROQ
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

**Correct Code** (commented out, lines 48-50):

```javascript
// This is disabled but should be used:
const scenes = await processScriptToScenes(script, videoLength);
```

**Problems**:

1. Returns hardcoded placeholder scenes
2. Doesn't actually analyze the script
3. Groq API never gets called
4. Scene count wrong, image URLs invalid
5. Comment block shows this was intentionally disabled

**Impact**:

- Videos get queued with wrong content
- AI script processing never happens
- Scene images will fail to generate

**Fix**:

1. Replace lines 75-156 (entire mock implementation)
2. With uncommented lines 1-75 (real implementation)
3. Or manually restore:

```javascript
const scenes = await processScriptToScenes(script, videoLength);
if (!scenes || scenes.length === 0) {
  throw new Error("No scenes generated from script");
}
```

**Severity**: 🔴 CRITICAL - Breaks video generation

---

### BUG #6: Missing FFmpeg Binary Path Configuration

**File**: `src/utils/videoAssembler.js`
**Line**: Missing! (should be after line 1)
**Current**:

```javascript
import ffmpeg from "fluent-ffmpeg";
// NO PATH CONFIGURATION
```

**Missing**:

```javascript
import ffmpegStatic from "ffmpeg-static";
ffmpeg.setFfmpegPath(ffmpegStatic);
```

**Impact**:

- If this code runs (currently doesn't), FFmpeg will fail
- Error: "ffmpeg command not found"
- Vercel's ephemeral environment won't have ffmpeg in PATH

**Correct Example** (from `scripts/render.js` line 6):

```javascript
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
ffmpeg.setFfmpegPath(ffmpegPath); // ← This line is critical
```

**Fix**: Add after line 1 in videoAssembler.js:

```javascript
import ffmpegStatic from "ffmpeg-static";
ffmpeg.setFfmpegPath(ffmpegStatic);
```

**Severity**: 🟡 HIGH - Blocks video assembly

---

## 🟠 HIGH PRIORITY ISSUES

### ISSUE #7: Unused Job Queue System

**Files Involved**:

- `src/lib/jobQueue.js` - Queue defined
- `src/utils/videoAssembler.js` - Processor defined
- `src/app/api/generate-video/route.js` - Never calls addVideoToQueue()

**Evidence**:

**jobQueue.js** (Line 74-97):

```javascript
export async function addVideoToQueue(videoId, scenes) {
  try {
    if (!videoId || !Array.isArray(scenes)) {
      throw new Error("Invalid videoId or scenes");
    }

    const job = await videoQueue.add(
      "process",
      { videoId, scenes },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    logger.info(`Added video ${videoId} to queue with job ID ${job.id}`);
    return job.id;
  } catch (error) {
    logger.error(`Failed to add video to queue:`, error);
  }
}
```

**This function is called by:**

```
NOTHING IN ACTIVE CODE
(commented code at generate-video/route.js:67 did call it)
```

**Commented Code** (lines 1-75 in generate-video/route.js):

```javascript
// Line 67 (commented):
await addVideoToQueue(videoId, scenes);
```

**Current Code** (lines 75-156):

- Never imports `addVideoToQueue`
- Never calls `addVideoToQueue`
- Directly triggers GitHub instead

**Problem**: Redis queue is configured and implemented but completely unused

**Decision Needed**:

- Option A: Keep GitHub dispatch, remove Redis/BullMQ setup
- Option B: Use Redis for local processing, remove GitHub dispatch
- Current: Broken hybrid with both enabled

**Severity**: 🟠 HIGH - Wasted implementation

---

### ISSUE #8: Dead Code - processScriptToScenes Function

**File**: `src/lib/groq.js`
**Lines**: 7-80
**Imports**: `import Groq from 'groq-sdk'`
**Exports**: `export async function processScriptToScenes(script, targetLength)`

**Full Implementation Exists**:

- Prompt engineering for scene generation
- Groq API integration
- Error handling
- Validation

**Called By**: NOTHING IN ACTIVE CODE
**Should Be Called By**: `src/app/api/generate-video/route.js` (but doesn't)

**Evidence of It Being Disabled**:

- Current API (line 75) just returns mock scenes
- Commented API (line 48) calls: `const scenes = await processScriptToScenes(script, videoLength)`

**What It Does**:

```javascript
const completion = await groq.chat.completions.create({
  messages: [{ role: "user", content: prompt }],
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  max_tokens: 4000,
});
// Returns validated scenes array with:
// - sceneNumber, duration, description, imagePrompt, voiceoverText, background, transition
```

**Severity**: 🟠 HIGH - Breaks video content generation

---

### ISSUE #9: Placeholder Comments in render.js

**File**: `scripts/render.js`
**Lines**: 25-40
**Current Code**:

```javascript
// --- YOUR FFMPEG LOGIC GOES HERE ---
// For now, this is a placeholder that simulates a long task
// In a real script, you would loop through 'scenes', download images, and use ffmpeg.

console.log("Building video with FFmpeg...");
// Example: ffmpeg().input(...).save('/tmp/output.mp4')

// --- UPLOAD FINAL VIDEO ---
const fileName = `videos/${videoId}_final.mp4`;
const file = bucket.file(fileName);

// After ffmpeg saves to '/tmp/output.mp4', upload it:
// await bucket.upload('/tmp/output.mp4', { destination: fileName });
```

**Problem**:

- Entire video assembly logic is commented/missing
- Should call processing pipeline from `videoAssembler.js`
- Currently just logs a message and continues

**Expected Code** (from videoAssembler.js):

```javascript
// Should import and call:
const { processVideo } = require("@/utils/videoAssembler");
await processVideo(videoId, scenes);
```

**Severity**: 🟠 HIGH - Actual rendering never happens

---

### ISSUE #10: process-script API Route is Empty

**File**: `src/app/api/process-script/route.js`
**Content**: Empty file
**Purpose**: Unknown
**Used By**: Nobody

**Severity**: 🟡 MEDIUM - Dead file, could be removed

---

## 🟢 CONSISTENCY CHECKS - WHAT'S CORRECT

### ✓ Firebase Credentials Consistent

**Vercel** (`firebaseAdmin.js` lines 10-19):

```javascript
projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
clientEmail: process.env.FIREBASE_CLIENT_EMAIL;
privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
```

**GitHub** (`scripts/render.js` lines 8-15):

```javascript
projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
clientEmail: process.env.FIREBASE_CLIENT_EMAIL;
privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
```

**Status**: ✓ Variable names match perfectly

---

### ✓ FFmpeg Configuration Correct in render.js

**File**: `scripts/render.js` (lines 5-6)

```javascript
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
ffmpeg.setFfmpegPath(ffmpegPath);
```

**Status**: ✓ Correct implementation

---

### ✓ Package Dependencies Installed

**ffmpeg-static**: v5.3.0 ✓
**fluent-ffmpeg**: v2.1.3 ✓
**firebase-admin**: 13.2.0 ✓
**groq-sdk**: 0.8.0 ✓

**Status**: ✓ All packages present

---

### ✓ API Key Middleware Consistent

**Where Used**:

- `middleware.js` line 43: `process.env.API_SECRET_KEY` ✓
- `validation.js` line 46: `process.env.API_SECRET_KEY` ✓
- `.env.example`: `API_SECRET_KEY=...` ✓

**Exception**:

- `generate-video/route.js` line 99: `process.env.MY_APP_API_KEY` ✗ WRONG

**Status**: 1 mismatch, rest consistent

---

## 📋 SUMMARY TABLE: ALL ISSUES

| #   | Bug                   | File                    | Line  | Severity    | Impact                 | Fix Time |
| --- | --------------------- | ----------------------- | ----- | ----------- | ---------------------- | -------- |
| 1   | API Key Var Name      | generate-video/route.js | 99    | 🔴 CRITICAL | API always returns 401 | 1 min    |
| 2   | Wrong Script          | render-video.yml        | 29    | 🔴 CRITICAL | Workflow does nothing  | 1 min    |
| 3   | Missing Env Vars      | render-video.yml        | 30-33 | 🔴 CRITICAL | render.js has no data  | 5 min    |
| 4   | Missing Secrets       | GitHub Settings         | -     | 🔴 CRITICAL | No auth/APIs available | 10 min   |
| 5   | Mock Scenes           | generate-video/route.js | 82-87 | 🔴 CRITICAL | Wrong video content    | 5 min    |
| 6   | Missing FFmpeg Path   | videoAssembler.js       | 1     | 🟡 HIGH     | Video assembly fails   | 2 min    |
| 7   | Unused Queue          | jobQueue.js             | 74-97 | 🟠 MEDIUM   | Dead code              | 30 min   |
| 8   | Dead Script Processor | groq.js                 | 7-80  | 🔴 CRITICAL | No AI processing       | -        |
| 9   | Placeholder Code      | render.js               | 25-40 | 🟠 MEDIUM   | No rendering           | 30 min   |
| 10  | Empty Route           | process-script/route.js | -     | 🟡 LOW      | Unused file            | 1 min    |

---

## 🔧 IMPLEMENTATION ORDER

### Phase 1: Critical Fixes (30 minutes)

1. Fix API Key variable (1 min)
2. Fix GitHub workflow script (1 min)
3. Fix GitHub env variables (5 min)
4. Add GitHub secrets (10 min)
5. Fix mock scenes code (5 min)
6. Fix FFmpeg path (2 min)
7. Test API functionality (5 min)

### Phase 2: Architecture Decision (15 minutes)

- Decide: Keep GitHub dispatch OR use Redis queue OR both?
- Current: Broken hybrid
- Recommend: GitHub dispatch (simpler, no Redis on Vercel)

### Phase 3: Complete Implementation (1-2 hours)

- Uncomment real API code or rewrite
- Integrate scene processing
- Test end-to-end flow
- Debug failures

### Phase 4: Integration Testing (30 minutes)

- Test frontend form submission
- Verify API key validation works
- Check GitHub dispatch triggers
- Verify render.js executes
- Check Firebase updates
- Verify video upload
