# AUDIT CHECKLIST & VERIFICATION GUIDE

## ✅ VERIFICATION CHECKLIST

### Step 1: Verify Current Broken State

```bash
# Test 1: Try to call API with correct API key
curl -X POST http://localhost:3000/api/generate-video \
  -H "x-api-key: your_api_secret_key" \
  -H "Content-Type: application/json" \
  -d '{
    "script": "test script",
    "title": "test",
    "videoLength": 60
  }'

Expected: 401 Unauthorized (because code checks MY_APP_API_KEY)
Actual: Likely 401 if environment variables set
```

### Step 2: Verify Environment Variables

```bash
# Check Vercel environment variables
echo $API_SECRET_KEY       # Should be set
echo $MY_APP_API_KEY       # If set, this is the bug!
echo $MY_GITHUB_TOKEN      # Should be set for API

# Check GitHub secrets (you need to manually verify in UI)
# Go to: Repository Settings → Secrets and variables → Actions
# Should see:
#   - FIREBASE_PROJECT_ID
#   - FIREBASE_CLIENT_EMAIL
#   - FIREBASE_PRIVATE_KEY
#   - FIREBASE_STORAGE_BUCKET
#   - MY_GITHUB_TOKEN
```

### Step 3: Verify Firebase Connection

```bash
# Test Firebase Admin initialization
curl -X GET http://localhost:3000/api/check-status \
  -H "Content-Type: application/json"

Expected: 200 OK with list of videos
If Error: Firebase credentials not properly configured
```

### Step 4: Check GitHub Secrets

```bash
# Cannot be checked via CLI, must use GitHub UI
# Go to: Settings → Secrets and variables → Actions
# Look for these secrets:
[ ] FIREBASE_PROJECT_ID
[ ] FIREBASE_CLIENT_EMAIL
[ ] FIREBASE_PRIVATE_KEY
[ ] FIREBASE_STORAGE_BUCKET
[ ] GROQ_API_KEY
[ ] ELEVENLABS_API_KEY
[ ] HUGGINGFACE_API_KEY
[ ] MY_GITHUB_TOKEN
```

### Step 5: Check Workflow File

```bash
# View current workflow
cat .github/workflows/render-video.yml

Look for:
❌ WRONG: run: node scripts/test-apis.js
✓  RIGHT: run: node scripts/render.js

❌ WRONG: VIDEO_DATA: ${{ github.event.client_payload.data }}
✓  RIGHT: VIDEO_ID: ${{ github.event.client_payload.videoId }}
          VIDEO_TITLE: ${{ github.event.client_payload.title }}
          SCENES: ${{ toJSON(github.event.client_payload.scenes) }}
```

---

## 🔧 FIX VERIFICATION TABLE

| Issue           | File                   | How to Verify                                             | Expected Result                               |
| --------------- | ---------------------- | --------------------------------------------------------- | --------------------------------------------- |
| API Key Var     | route.js:99            | `grep MY_APP_API_KEY src/app/api/generate-video/route.js` | Should NOT find it (change to API_SECRET_KEY) |
| Workflow Script | render-video.yml:29    | `grep "run: node" .github/workflows/render-video.yml`     | Should show `render.js` not `test-apis.js`    |
| Env Vars        | render-video.yml:30-33 | `grep VIDEO_ID .github/workflows/render-video.yml`        | Should have VIDEO_ID, VIDEO_TITLE, SCENES     |
| Mock Scenes     | route.js:82-87         | `grep "imageUrl: " src/app/api/generate-video/route.js`   | Should NOT find example.com URLs              |
| FFmpeg Path     | videoAssembler.js:1    | `grep setFfmpegPath src/utils/videoAssembler.js`          | Should find this line                         |
| Secrets Set     | GitHub UI              | Go to Settings → Secrets                                  | Should have 8+ secrets listed                 |

---

## 🧪 END-TO-END TEST SCENARIOS

### Test Scenario 1: API Key Validation

```
1. Frontend sends POST to /api/generate-video
2. Includes header: x-api-key: valid_key
3. Expected: 202 Accepted (not 401 Unauthorized)

Current Result: 401 (WRONG)
After Fix: 202 (CORRECT)
```

### Test Scenario 2: Scene Generation

```
1. API receives script: "In the world of money..."
2. Should call: processScriptToScenes(script, 60)
3. Should return: Array of 10-12 scene objects

Current Result: 2 mock scenes with "example.com" URLs
After Fix: Real scenes from Groq API
```

### Test Scenario 3: GitHub Workflow Trigger

```
1. API calls: github.com/repos/*/dispatches
2. Sends: videoId, title, scenes in client_payload
3. GitHub should receive: repository_dispatch event
4. Workflow should run: render.js (not test-apis.js)

Current Result: Workflow runs wrong script
After Fix: Workflow runs render.js with proper env vars
```

### Test Scenario 4: Video Processing

```
1. render.js receives: VIDEO_ID, VIDEO_TITLE, SCENES as env vars
2. Should call:
   - generateStickFigureImage() for each scene
   - generateVoiceoverFromScenes() for audio
   - createVideoFromImages() for assembly
   - uploadVideoToStorage() for storage

Current Result: Placeholder comments (no processing)
After Fix: Full processing pipeline executes
```

### Test Scenario 5: Firebase Status Update

```
1. Video starts with status: 'queued'
2. When processing starts: status becomes 'processing'
3. When complete: status becomes 'completed' with videoUrl

Current Result: Status never changes from 'queued'
After Fix: Status progresses: queued → processing → completed
```

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Code Changes

- [ ] Line 99 of `src/app/api/generate-video/route.js` changed from `MY_APP_API_KEY` to `API_SECRET_KEY`
- [ ] Line 29 of `.github/workflows/render-video.yml` changed from `test-apis.js` to `render.js`
- [ ] Lines 30-33 of `.github/workflows/render-video.yml` updated with correct env variables
- [ ] FFmpeg path added to `src/utils/videoAssembler.js` (if using this file)
- [ ] Mock scenes replaced with real `processScriptToScenes()` call
- [ ] All changes committed and pushed

### Environment Configuration

- [ ] Vercel: `API_SECRET_KEY` set correctly
- [ ] Vercel: `MY_GITHUB_TOKEN` set (GitHub personal access token)
- [ ] Vercel: All Firebase vars set
- [ ] Vercel: All AI service keys set (Groq, ElevenLabs, HuggingFace)
- [ ] GitHub: All required secrets created
  - [ ] `FIREBASE_PROJECT_ID`
  - [ ] `FIREBASE_CLIENT_EMAIL`
  - [ ] `FIREBASE_PRIVATE_KEY`
  - [ ] `FIREBASE_STORAGE_BUCKET`
  - [ ] `GROQ_API_KEY` (if render.js needs it)
  - [ ] `ELEVENLABS_API_KEY`
  - [ ] `HUGGINGFACE_API_KEY`
  - [ ] `MY_GITHUB_TOKEN`

### Testing

- [ ] API returns 202 (not 401) when called with correct key
- [ ] Firebase Firestore can be read/written
- [ ] GitHub Actions workflow appears in Actions tab
- [ ] Manual workflow trigger test (push code change)
- [ ] Frontend VideoGenerator component works without errors
- [ ] Video appears in Firestore with status 'queued'

### Final Checks

- [ ] No hardcoded credentials in code
- [ ] No sensitive data in logs
- [ ] Error messages don't expose internal details
- [ ] All environment variables documented
- [ ] README updated with setup instructions

---

## 🚨 CRITICAL SUCCESS CRITERIA

### Minimum Working State

```
✓ Frontend form submits without errors
✓ API returns 202 (not 401)
✓ Video record created in Firestore
✓ GitHub Actions workflow triggers
✓ render.js receives VIDEO_ID environment variable
✓ Firebase status updates from 'queued' to 'processing'
```

### Full Working State

```
✓ Groq processes script into scenes
✓ HuggingFace generates scene images
✓ ElevenLabs generates voiceover
✓ FFmpeg assembles video
✓ Video uploaded to Firebase Storage
✓ Status updates to 'completed' with videoUrl
✓ Frontend displays completed video
```

---

## 🐛 DEBUGGING GUIDE

### If API returns 401

```
Check:
1. Is x-api-key header being sent? (frontend)
2. Does its value match process.env.API_SECRET_KEY? (backend)
3. Is API_SECRET_KEY set in Vercel? (project settings)
4. Is code checking MY_APP_API_KEY instead? (bug #1)
```

### If GitHub workflow doesn't trigger

```
Check:
1. Is MY_GITHUB_TOKEN valid? (generate new if needed)
2. Is repository_dispatch endpoint correct? (james247-eng/finance-video-automation)
3. Can you see dispatch event in GitHub API logs?
4. Is workflow set to trigger on 'start-video-render'?
```

### If render.js doesn't receive data

```
Check:
1. Is workflow passing env vars correctly?
2. Can you see VIDEO_ID in workflow logs?
3. Is render.js reading from correct variable names?
4. Are GitHub secrets set and accessible?
```

### If Firebase connection fails in render.js

```
Check:
1. Are all FIREBASE_* secrets set in GitHub?
2. Is FIREBASE_PRIVATE_KEY properly formatted with \\n?
3. Can you manually test Firebase connection?
4. Are credentials for same Firebase project?
```

### If FFmpeg fails

```
Check:
1. Is ffmpeg-static in node_modules?
2. Is setFfmpegPath called before using ffmpeg?
3. Are input files accessible (images, audio)?
4. Is temp directory writable?
```

---

## 📊 STATUS TRACKING TEMPLATE

Use this to track your progress through fixes:

```
DATE: ____________________
COMPLETED BY: ____________________

CRITICAL FIXES:
[ ] Bug #1 - API Key Variable (1 min)
    - File: src/app/api/generate-video/route.js:99
    - Change: MY_APP_API_KEY → API_SECRET_KEY
    - Verified: _____ (date/time)

[ ] Bug #2 - GitHub Workflow Script (1 min)
    - File: .github/workflows/render-video.yml:29
    - Change: test-apis.js → render.js
    - Verified: _____ (date/time)

[ ] Bug #3 - GitHub Env Variables (5 min)
    - File: .github/workflows/render-video.yml:30-33
    - Change: Add VIDEO_ID, VIDEO_TITLE, SCENES mapping
    - Verified: _____ (date/time)

[ ] Bug #4 - GitHub Secrets (10 min)
    - Location: Repository Settings → Secrets
    - Added 8 secrets
    - Verified: _____ (date/time)

[ ] Bug #5 - Mock Scenes (5 min)
    - File: src/app/api/generate-video/route.js:82-87
    - Change: Remove mock, add processScriptToScenes() call
    - Verified: _____ (date/time)

[ ] Bug #6 - FFmpeg Path (2 min)
    - File: src/utils/videoAssembler.js
    - Add: ffmpeg.setFfmpegPath(ffmpegStatic)
    - Verified: _____ (date/time)

TESTS COMPLETED:
[ ] Test 1 - API Key Validation (returns 202 not 401)
    - Result: _____ (PASS/FAIL)
    - Date: _____

[ ] Test 2 - Firebase Connection (check-status returns videos)
    - Result: _____ (PASS/FAIL)
    - Date: _____

[ ] Test 3 - GitHub Workflow Trigger (dispatch accepted)
    - Result: _____ (PASS/FAIL)
    - Date: _____

[ ] Test 4 - Workflow Execution (render.js runs)
    - Result: _____ (PASS/FAIL)
    - Date: _____

[ ] Test 5 - End-to-End (video generated)
    - Result: _____ (PASS/FAIL)
    - Date: _____

DEPLOYED TO: ___________________
DEPLOYMENT DATE: _______________
DEPLOYMENT TIME: _______________
```

---

## 📞 SUPPORT CONTACTS

**When Debugging**:

1. Check `logs/` directory for application logs
2. Check GitHub Actions logs: Repository → Actions → render-video
3. Check Vercel logs: Project → Deployments → View logs
4. Check Firebase logs: Firebase Console → Firestore/Storage activity

**Common Log Locations**:

- Vercel Function Logs: Last deployment output
- GitHub Actions: Each workflow run shows detailed logs
- Firebase: Activity tab shows operation history
- Application: `logs/error.log` and `logs/combined.log`
