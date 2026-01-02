
/*
import { NextResponse } from 'next/server'
import { createVideo } from '@/lib/firebaseAdmin'
import { processScriptToScenes } from '@/lib/groq'
import { addVideoToQueue } from '@/lib/jobQueue'
import { validateVideoScript, validateApiKey } from '@/lib/validation'
import { withErrorHandling } from '@/lib/middleware'
import logger from '@/lib/logger'

async function handler(request) {
  if (request.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  }

  // Validate API key
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey || !validateApiKey(apiKey)) {
    logger.warn('Unauthorized API request to generate-video')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { script, title, videoLength } = body

    // Validate inputs
    const validation = validateVideoScript(script, title, videoLength)
    if (!validation.isValid) {
      logger.warn('Invalid video script validation:', validation.errors)
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    logger.info(`Generating video: "${title}"`)

    // Process script into scenes
    logger.info('Processing script into scenes...')
    const scenes = await processScriptToScenes(script, videoLength)

    if (!scenes || scenes.length === 0) {
      throw new Error('No scenes generated from script')
    }

    // Create video record
    logger.info(`Creating video record with ${scenes.length} scenes`)
    const videoId = await createVideo({
      title: title.trim(),
      script: script.trim(),
      videoLength: videoLength,
      sceneCount: scenes.length,
      scenes,
      status: 'pending',
      progress: 0,
    })

    // Add to processing queue
    logger.info(`Adding video ${videoId} to processing queue`)
    await addVideoToQueue(videoId, scenes)

    return NextResponse.json({
      success: true,
      videoId,
      message: 'Video generation started',
      sceneCount: scenes.length,
    }, { status: 202 })

  } catch (error) {
    logger.error('Error in generate-video API:', error)

    if (error.message.includes('API') || error.message.includes('key')) {
      return NextResponse.json(
        { error: 'API service error. Please check your configuration.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(handler)
*/
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

    // Validate inputs
    if (!script || !title || !videoLength) {
      return res.status(400).json({ error: 'Missing required fields: script, title, videoLength' });
    }

    // Process script into AI-generated scenes using Groq
    logger.info('Processing script into scenes with Groq AI...');
    const { processScriptToScenes } = await import('@/lib/groq');
    const scenes = await processScriptToScenes(script, videoLength);
    
    if (!scenes || scenes.length === 0) {
      throw new Error('No scenes generated from script. Check Groq API configuration.');
    }

    // Create entry in Firebase with scene data
    logger.info(`Creating video record with ${scenes.length} scenes`);
    const videoId = await createVideo({
      title: title.trim(),
      script: script.trim(),
      videoLength: videoLength,
      sceneCount: scenes.length,
      scenes: scenes,
      status: 'queued',
      pTrigger GitHub Actions worker via repository_dispatch
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

    if Respond to frontend with 202 Accepted (processing has started)
    return res.status(202).json({
      success: true,
      videoId,
      message: 'Video queued for rendering on GitHub Actions',
      sceneCount: scenes.length,
      estimatedTime: '2-5 minutes depending on queue'
    logger.info(`Successfully triggered GitHub Actions for video ${videoId}`);
    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      throw new Error(`GitHub Trigger Failed: ${errorText}`);
    }

    // 5. Respond to Frontend immediately
    return res.status(202).json({
      success: true,
      videoId,
      message: "Video is being rendered on GitHub Actions.",
      sceneCount: scenes.length
    });

  } catch (error) {
    logger.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}