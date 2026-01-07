# ARCHITECTURE ANALYSIS: CURRENT vs INTENDED

## 🔴 CURRENT (BROKEN) ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│                  VideoGenerator.js Component                    │
│  Sends: { script, title, videoLength, x-api-key: localStorage} │
└────────────────────────────┬────────────────────────────────────┘
                             │ POST /api/generate-video
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              VERCEL API (Next.js Server)                        │
│        src/app/api/generate-video/route.js                      │
│                                                                 │
│  1. Check API Key (❌ WRONG VAR: MY_APP_API_KEY)               │
│     if (apiKey !== process.env.MY_APP_API_KEY)  ← BUG!          │
│                                                                 │
│  2. Generate Mock Scenes (❌ NOT REAL!)                         │
│     const scenes = [                                            │
│       { text: "...", imageUrl: "https://example.com/..." }      │
│     ]                                                           │
│     ✓ Should call: processScriptToScenes() but DOESN'T           │
│                                                                 │
│  3. Create Firebase Record ✓                                    │
│     await createVideo({ title, script, scenes, status: 'queued' }) │
│                                                                 │
│  4. Trigger GitHub Worker (⚠️ INCOMPLETE)                       │
│     fetch(`https://api.github.com/repos/.../dispatches`, {       │
│       event_type: 'start-video-render',                         │
│       client_payload: {                                         │
│         videoId: videoId,                                       │
│         title: title,                                           │
│         scenes: scenes  ← Mock scenes!                          │
│       }                                                         │
│     })                                                          │
└────────────────────────┬──────────────────────────────────────┘
                         │ Dispatch Event
                         ▼
         ┌───────────────────────────────────────┐
         │  Firebase Firestore                   │
         │  - Creates 'videos' collection entry  │
         │  - Status: 'queued'                   │
         │  - Waits for GitHub to update         │
         └───────────────────────────────────────┘
                         │ (if it worked)
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│          GitHub Actions Workflow                                 │
│        .github/workflows/render-video.yml                        │
│                                                                  │
│  ❌ PROBLEM #1: Runs WRONG SCRIPT                                │
│  run: node scripts/test-apis.js  ← Should be: scripts/render.js  │
│                                                                  │
│  ❌ PROBLEM #2: No Environment Variables                         │
│  env:                                                            │
│    FIREBASE_KEY: ${{ secrets.FIREBASE_KEY }}  ← Undefined!      │
│    VIDEO_DATA: ${{ github.event.client_payload.data }}  ← Wrong!│
│                                                                  │
│  ❌ PROBLEM #3: Missing Secrets in Repository                   │
│    - FIREBASE_PROJECT_ID not configured                         │
│    - FIREBASE_CLIENT_EMAIL not configured                       │
│    - FIREBASE_PRIVATE_KEY not configured                        │
│    - etc.                                                       │
│                                                                  │
│  Result: Even if render.js ran, it would:                       │
│  - Not receive VIDEO_ID, VIDEO_TITLE, SCENES                    │
│  - Not authenticate with Firebase                               │
│  - Crash immediately                                            │
└──────────────────────────────────────────────────────────────────┘
                         │
                         ▼
         ┌────────────────────────────────────┐
         │ PROCESSING PIPELINE (UNUSED)       │
         │ Scripts exist but never called:    │
         │                                    │
         │ scripts/render.js                  │
         │ ├─ calls generateStickFigureImage()│
         │ ├─ calls generateVoiceoverFromScenes()│
         │ ├─ calls createVideoFromImages()   │
         │ └─ uploads to Firebase Storage     │
         │                                    │
         │ Status: DEAD CODE                  │
         └────────────────────────────────────┘
                         │
                         ▼
         ┌──────────────────────────────────┐
         │ Firebase Storage                 │
         │ (Files never uploaded)           │
         └──────────────────────────────────┘
```

---

## 🟢 INTENDED (WORKING) ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│                  VideoGenerator.js Component                    │
│  Sends: { script, title, videoLength, x-api-key }              │
│                                                                 │
│  Success Response: "Video queued! {sceneCount} scenes generated"│
└────────────────────────────┬────────────────────────────────────┘
                             │ POST /api/generate-video
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              VERCEL API (Next.js Server)                        │
│        src/app/api/generate-video/route.js                      │
│                                                                 │
│  1. ✓ Validate API Key (API_SECRET_KEY) ✓                       │
│     if (apiKey !== process.env.API_SECRET_KEY)                  │
│                                                                 │
│  2. ✓ Process Script to Scenes                                 │
│     const scenes = await processScriptToScenes(script, length)  │
│     Uses: Groq LLM to analyze script and create structured      │
│     scenes with descriptions, durations, voiceover text         │
│                                                                 │
│  3. ✓ Create Firebase Record                                   │
│     const videoId = await createVideo({                         │
│       title, script, videoLength, sceneCount,                   │
│       scenes, status: 'queued'                                  │
│     })                                                          │
│                                                                 │
│  4. ✓ Queue for Processing                                     │
│     await addVideoToQueue(videoId, scenes)                      │
│                                                                 │
│  5. ✓ Trigger GitHub Worker                                    │
│     fetch(`https://api.github.com/repos/.../dispatches`, {       │
│       event_type: 'start-video-render',                         │
│       client_payload: {                                         │
│         videoId: videoId,                                       │
│         title: title,                                           │
│         scenes: scenes  ← REAL scenes from Groq!               │
│       }                                                         │
│     })                                                          │
│                                                                 │
│  6. ✓ Return immediately (202 Accepted)                        │
│     { videoId, sceneCount, message: "Processing..." }          │
└────────┬─────────────────────┬──────────────────────┬──────────┘
         │                     │                      │
         │ Add to Redis Queue  │ Create Firestore     │ Trigger GitHub
         │                     │ Record               │ Dispatch
         │                     │
    ┌────▼──────────┐  ┌──────▼──────────┐  ┌────────▼───────────┐
    │  Redis Queue  │  │  Firestore DB   │  │ GitHub Actions     │
    │ (BullMQ)      │  │  (Status: queued)  │  │ render-video.yml   │
    │               │  │                 │  │                    │
    │ Job: {        │  │ videos/{id}:    │  │ Event: start-video-│
    │  videoId,     │  │ ├─ title        │  │ render             │
    │  scenes       │  │ ├─ script       │  │                    │
    │ }             │  │ ├─ status       │  │ Payload: {         │
    │               │  │ ├─ progress     │  │   videoId,         │
    └────┬──────────┘  │ └─ createdAt    │  │   title,           │
         │             └──────────────────┘  │   scenes           │
         │                    │              │ }                  │
         │                    │              └────────┬───────────┘
         │                    │                       │
         │             Listening for                  │
         │             status updates                 │
         │                    ▲                       │
         │                    │                       │
         ▼                    │                       ▼
    ┌────────────────┐       │        ┌──────────────────────────┐
    │ Worker Process │       │        │ GitHub Actions Worker    │
    │ (BullMQ)       │       │        │                          │
    │                │       │        │ 1. Set env vars from     │
    │ Processes:     │       │        │    github.event.client_  │
    │ ├─ Generate    │       │        │    payload               │
    │ │  images      │       │        │                          │
    │ ├─ Generate    │       │        │ 2. Install dependencies  │
    │ │  voiceover   │       │        │                          │
    │ ├─ Assemble    │       │        │ 3. Run: node render.js   │
    │ │  video       │       │        │                          │
    │ └─ Upload      │       │        │ render.js does:          │
    │    to Firebase │       │        │ ├─ Auth to Firebase      │
    │                │       │        │ ├─ Download scene data   │
    │ Status:        │       │        │ ├─ Generate images       │
    │ processing→    │       │        │ │  (HuggingFace)         │
    │ completed      │───────┼────────┤ ├─ Generate voiceover    │
    └────────────────┘       │        │ │  (ElevenLabs)          │
         OR                   │        │ ├─ Assemble with FFmpeg │
         (Runs on GitHub)     │        │ ├─ Upload video to      │
                              │        │ │  Storage              │
                              │        │ └─ Update Firestore     │
                              │        │    status: 'completed'  │
                              │        │    videoUrl: {...}      │
                              │        │                         │
                              │        └────────────┬────────────┘
                              │                     │
                              └─────────────────────┘

         ┌────────────────────────────────────────────┐
         │  EXTERNAL SERVICES                         │
         │                                            │
         │  Groq API (Script Processing)              │
         │  ├─ Analyzes script                        │
         │  └─ Returns: structured scenes             │
         │                                            │
         │  HuggingFace (Image Generation)            │
         │  ├─ Takes: scene descriptions              │
         │  └─ Returns: PNG images                    │
         │                                            │
         │  ElevenLabs (Voiceover)                    │
         │  ├─ Takes: voiceover text from scenes      │
         │  └─ Returns: MP3 audio                     │
         │                                            │
         │  FFmpeg (Video Assembly)                   │
         │  ├─ Takes: images + audio                  │
         │  └─ Returns: MP4 video file                │
         └────────────────────────────────────────────┘

         ┌────────────────────────────────────────────┐
         │  Firebase (Persistent Storage)             │
         │                                            │
         │  Firestore:                                │
         │  ├─ Video metadata                         │
         │  ├─ Processing status                      │
         │  └─ Final video URL                        │
         │                                            │
         │  Cloud Storage:                            │
         │  ├─ Video files (.mp4)                     │
         │  ├─ Scene images (.png)                    │
         │  └─ Audio files (.mp3)                     │
         └────────────────────────────────────────────┘

         ┌────────────────────────────────────────────┐
         │  FRONTEND (Polling)                        │
         │                                            │
         │  GET /api/check-status                     │
         │  └─ Returns list of videos with statuses   │
         │     - queued (not started)                 │
         │     - processing (progress: 0-100%)        │
         │     - completed (with videoUrl)            │
         │     - error (with error message)           │
         └────────────────────────────────────────────┘
```

---

## 🔗 CONNECTION MAPPING: WHAT SHOULD HAPPEN

### Frontend → API Connection

```
Input:
{
  "script": "In the world of money...",
  "title": "Financial Freedom",
  "videoLength": 60,
  "apiKey": "secret-key-from-localstorage"
}

Expected Header:
"x-api-key": "secret-key-from-localstorage"

Expected Response (202):
{
  "success": true,
  "videoId": "xyz123",
  "message": "Video generation started",
  "sceneCount": 12
}

Current Response (401):
{
  "error": "Unauthorized: Invalid API Key"
}
← Because code checks MY_APP_API_KEY instead of API_SECRET_KEY
```

---

### API → Firebase Connection

```
✓ WORKING - Creates video record correctly:

db.collection('videos').add({
  title: "Financial Freedom",
  script: "In the world of money...",
  videoLength: 60,
  sceneCount: 12,
  scenes: [...],  ← SHOULD be real from Groq
  status: 'queued',
  createdAt: timestamp
})

Returns: videoId = "xyz123"
```

---

### API → GitHub Connection

```
⚠️ PARTIALLY WORKING - Triggers workflow but payload structure wrong:

POST https://api.github.com/repos/james247-eng/finance-video-automation/dispatches
Headers:
  Authorization: token ${{ MY_GITHUB_TOKEN }}
  Accept: application/vnd.github.v3+json

Body:
{
  "event_type": "start-video-render",
  "client_payload": {
    "videoId": "xyz123",
    "title": "Financial Freedom",
    "scenes": [
      { sceneNumber: 1, duration: 5, imagePrompt: "..." },
      ...
    ]
  }
}

✓ GitHub receives the dispatch event
✓ Workflow triggers correctly
✓ ${{ github.event.client_payload.videoId }} works ✓
✓ ${{ github.event.client_payload.title }} works ✓
✓ ${{ github.event.client_payload.scenes }} works ✓

❌ BUT workflow doesn't map these to environment variables!
```

---

### GitHub Workflow → render.js Connection

```
CURRENT (BROKEN):
env:
  FIREBASE_KEY: ${{ secrets.FIREBASE_KEY }}  ← Undefined!
  VIDEO_DATA: ${{ github.event.client_payload.data }}  ← Wrong path!

run: node scripts/test-apis.js  ← Wrong script!

SHOULD BE (FIXED):
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

run: node scripts/render.js
```

---

### render.js → Firebase Connection

```
render.js expects:
- process.env.VIDEO_ID = "xyz123"
- process.env.SCENES = "[{...}, {...}]"
- process.env.VIDEO_TITLE = "Financial Freedom"
- process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "..."
- process.env.FIREBASE_CLIENT_EMAIL = "..."
- process.env.FIREBASE_PRIVATE_KEY = "..."
- process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "..."

CURRENT STATE:
❌ None of these are set (except FIREBASE ones if manually added)
❌ VIDEO_ID, SCENES, VIDEO_TITLE undefined
❌ render.js line 21: const videoId = process.env.VIDEO_ID  ← undefined!

Actions taken:
- await db.collection('videos').doc(videoId).update({ status: 'processing' })
  ← Fails because videoId is undefined
```

---

## 📍 SILENT CONNECTIONS (Code Exists But Unused)

### Chain #1: Script Processing Pipeline

```
IMPLEMENTED:
  VideoGenerator.js ─┬─X─ api/generate-video ─┬─X─ processScriptToScenes()
                    └─→ ??? (goes nowhere)      └─X─ groq.js

Where it SHOULD go:
  VideoGenerator.js → api/generate-video → processScriptToScenes()
                                         → groq.js ✓
                                         → createVideo() ✓
                                         → addVideoToQueue() ✓
                                         → triggerGitHub() ✓
```

**Evidence**:

- `processScriptToScenes()` defined in `groq.js` (lines 7-80)
- But never imported or called in `generate-video/route.js` current code
- The commented code (lines 48-50) DID call it
- Current code returns hardcoded mock scenes instead

---

### Chain #2: Video Assembly Pipeline

```
IMPLEMENTED:
  render.js ─X─ generateStickFigureImage()
           ─X─ generateVoiceoverFromScenes()
           ─X─ createVideoFromImages()
           ─X─ uploadVideoToStorage()

EXPECTED TO BE CALLED BY:
  render.js line 27: try { ??? } catch

ACTUALLY CALLS:
  Line 30-33: Updates Firebase status to 'processing'
  Line 40: PLACEHOLDER comment "YOUR FFMPEG LOGIC GOES HERE"
  Line 43: PLACEHOLDER comment for uploading video

Status: STUBS ONLY - actual processing never happens
```

**Evidence**:

- `processVideo()` in `videoAssembler.js` has full implementation
- But never imported or called anywhere
- `render.js` doesn't call it
- Job queue worker in `jobQueue.js` would call it, but queue is never used

---

### Chain #3: Job Queue System

```
IMPLEMENTED:
  jobQueue.js ─ createQueue('video-processing')
             ─ createWorker(async (job) => processVideo())
             ─ export addVideoToQueue()

EXPECTED TO BE CALLED BY:
  api/generate-video line 67: await addVideoToQueue(videoId, scenes)
  ✓ This code EXISTS in commented section

ACTUALLY CALLED BY:
  NOTHING - never imported in active code

Status: DEAD CODE - fully working but completely unused
```

**Evidence**:

- `addVideoToQueue()` defined in `jobQueue.js` (lines 74-97)
- Commented code at line 67 of `generate-video/route.js` calls it
- Current code doesn't call it
- Redis configured but no processing ever happens

---

### Chain #4: Status Checking

```
IMPLEMENTED:
  /api/check-status/route.js ✓
  ├─ Fetches videos from Firestore
  ├─ Returns list with statuses
  └─ Exports GET handler

CONNECTED TO:
  Frontend: CompletedVideos.js might use it?

STATUS: Unclear - endpoint works but integration unknown
```

---

## 📊 DEAD CODE SUMMARY

| File               | Function                      | Lines   | Status | Should Be Called By | Actually Called By                           |
| ------------------ | ----------------------------- | ------- | ------ | ------------------- | -------------------------------------------- |
| groq.js            | processScriptToScenes()       | 7-80    | Dead   | api/generate-video  | NOTHING                                      |
| groq.js            | generateStoryScript()         | 104-128 | Dead   | ???                 | NOTHING                                      |
| huggingface.js     | generateStickFigureImage()    | 27-73   | Dead   | videoAssembler.js   | NOTHING                                      |
| huggingface.js     | generatePlaceholderImage()    | 76-81   | Dead   | ???                 | NOTHING                                      |
| elevenlabs.js      | generateVoiceover()           | 17-60   | Dead   | videoAssembler.js   | NOTHING                                      |
| elevenlabs.js      | generateVoiceoverFromScenes() | 63-115  | Dead   | videoAssembler.js   | NOTHING                                      |
| videoAssembler.js  | processVideo()                | 21-120  | Dead   | jobQueue.js         | NOTHING                                      |
| videoAssembler.js  | createVideoFromImages()       | 123-185 | Dead   | processVideo()      | NOTHING                                      |
| videoAssembler.js  | cleanupTempFiles()            | 188-208 | Dead   | processVideo()      | NOTHING                                      |
| jobQueue.js        | addVideoToQueue()             | 74-97   | Dead   | api/generate-video  | NOTHING                                      |
| jobQueue.js        | worker (line 41)              | 41-58   | Dead   | ???                 | NOTHING                                      |
| api/process-script | (entire file)                 | -       | Dead   | ???                 | NOTHING                                      |
| api/check-status   | GET handler                   | 1-30    | Works  | ???                 | UNKNOWN                                      |
| render.js          | (entire script)               | 1-53    | Dead   | GitHub workflow     | NOTHING (workflow runs test-apis.js instead) |
