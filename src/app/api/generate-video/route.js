/*
import { NextRequest, NextResponse } from 'next/server';
import { createVideo } from '@/lib/firebaseAdmin';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  // 1. Security Check - validate API key
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.API_SECRET_KEY) {
    logger.warn('Unauthorized API key attempt');
    return NextResponse.json(
      { error: 'Unauthorized: Invalid API Key' },
      { status: 401 }
    );
  }

  try {
    // Parse request body
    const { script, title, videoLength } = await request.json();

    // 2. Validate inputs
    if (!script || !title || !videoLength) {
      return NextResponse.json(
        { error: 'Missing required fields: script, title, videoLength' },
        { status: 400 }
      );
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

    return NextResponse.json(
      {
        success: true,
        videoId,
        message: 'Video queued for rendering on GitHub Actions',
        sceneCount: scenes.length,
        estimatedTime: '2-5 minutes depending on queue'
      },
      { status: 202 }
    );

  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

*/
/*
import { NextRequest, NextResponse } from 'next/server';
import { createVideo } from '@/lib/firebaseAdmin'; // Matches the export above
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  // 1. Security Check
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.API_SECRET_KEY) {
    logger.warn('Unauthorized API key attempt');
    return NextResponse.json(
      { error: 'Unauthorized: Invalid API Key' },
      { status: 401 }
    );
  }

  try {
    const { script, title, videoLength } = await request.json();

    // 2. Validate inputs
    if (!script || !title || !videoLength) {
      return NextResponse.json(
        { error: 'Missing required fields: script, title, videoLength' },
        { status: 400 }
      );
    }

    // 3. Process script into AI-generated scenes using Groq
    logger.info('Processing script into scenes with Groq AI...');
    // We import this dynamically to ensure it only runs on the server
    const { processScriptToScenes } = await import('@/lib/groq');
    const scenes = await processScriptToScenes(script, videoLength);
    
    if (!scenes || scenes.length === 0) {
      throw new Error('No scenes generated from script. Check Groq API configuration.');
    }

    // 4. Create entry in Firebase
    logger.info(`Creating video record with ${scenes.length} scenes`);
    const videoId = await createVideo({
      title: title.trim(),
      script: script.trim(),
      videoLength: videoLength,
      sceneCount: scenes.length,
      scenes: scenes,
      status: 'queued',
      progress: 0,
    });

    // 5. Trigger GitHub Actions
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
      throw new Error(`GitHub dispatch failed: ${errorText}`);
    }

    return NextResponse.json({
        success: true,
        videoId,
        message: 'Video successfully queued for rendering',
        sceneCount: scenes.length
    }, { status: 202 });

  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


*/





import { NextRequest, NextResponse } from 'next/server';
import { createVideo } from '@/lib/firebaseAdmin';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  // 1. Security Check
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.API_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { script, title, videoLength } = await request.json();

    if (!script || !title || !videoLength) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // 2. Process script into Scenes (TEXT ONLY)
    logger.info('Processing script with Groq...');
    const { processScriptToScenes } = await import('@/lib/groq');
    const scenes = await processScriptToScenes(script, videoLength);
    
    if (!scenes || scenes.length === 0) {
      throw new Error('Groq failed to generate scenes.');
    }

    // 3. Create entry in Firebase
    const videoId = await createVideo({
      title: title.trim(),
      script: script.trim(),
      videoLength,
      scenes, // These contain the text 'imagePrompt'
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString()
    });

    // 4. Trigger GitHub (Sending only the ID and the text prompts)
    const GITHUB_REPO = "james247-eng/finance-video-automation";
    const GITHUB_TOKEN = process.env.MY_GITHUB_TOKEN;

    const githubResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'start-video-render',
        client_payload: { videoId, scenes }
      }),
    });

    if (!githubResponse.ok) throw new Error('GitHub Dispatch Failed');

    return NextResponse.json({ success: true, videoId }, { status: 202 });

  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}