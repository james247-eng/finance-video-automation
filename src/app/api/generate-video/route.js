import { createVideo } from '@/lib/firebaseAdmin';
import logger from '@/lib/logger';

export default async function handler(req, res) {
  // 1. Security Check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }

  try {
    const { script, title, videoLength } = req.body;

    // 2. Validate inputs
    if (!script || !title || !videoLength) {
      return res.status(400).json({ error: 'Missing required fields: script, title, videoLength' });
    }

    // 3. Process script into AI-generated scenes using Groq
    logger.info('Processing script into scenes with Groq AI...');
    const { processScriptToScenes } = await import('@/lib/groq');
    const scenes = await processScriptToScenes(script, videoLength);
    
    if (!scenes || scenes.length === 0) {
      throw new Error('No scenes generated from script. Check Groq API configuration.');
    }

    // 4. Create entry in Firebase with scene data
    logger.info(`Creating video record with ${scenes.length} scenes`);
    const videoId = await createVideo({
      title: title.trim(),
      script: script.trim(),
      videoLength: videoLength,
      sceneCount: scenes.length,
      scenes: scenes,
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString()
    });

    // 5. Trigger GitHub Actions worker via repository_dispatch
    logger.info(`Triggering GitHub Actions for video ${videoId}`);
    const GITHUB_REPO = "james247-eng/finance-video-automation";
    const GITHUB_TOKEN = process.env.MY_GITHUB_TOKEN;
    
    if (!GITHUB_TOKEN) {
      throw new Error('MY_GITHUB_TOKEN not configured in environment variables');
    }

    const githubResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'start-video-render',
        client_payload: {
          videoId: videoId,
          title: title,
          scenes: scenes
        }
      }),
    });

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      logger.error(`GitHub dispatch failed: ${errorText}`);
      throw new Error(`Failed to trigger GitHub Actions: ${errorText}`);
    }

    logger.info(`Successfully triggered GitHub Actions for video ${videoId}`);

    // 6. Respond to frontend with 202 Accepted (processing has started)
    return res.status(202).json({
      success: true,
      videoId,
      message: 'Video queued for rendering on GitHub Actions',
      sceneCount: scenes.length,
      estimatedTime: '2-5 minutes depending on queue'
    });

  } catch (error) {
    logger.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}