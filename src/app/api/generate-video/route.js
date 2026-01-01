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
