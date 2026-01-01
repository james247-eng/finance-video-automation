import { NextResponse } from 'next/server'
import { createVideo } from '@/lib/firebaseAdmin'
import { processScriptToScenes } from '@/lib/groq'

export async function POST(request) {
  try {
    const { script, title, videoLength } = await request.json()

    if (!script || !title) {
      return NextResponse.json(
        { error: 'Script and title are required' },
        { status: 400 }
      )
    }

    console.log('Processing script into scenes...')
    const scenes = await processScriptToScenes(script, videoLength || 60)

    console.log('Creating video record...')
    const videoId = await createVideo({
      title,
      script,
      videoLength: videoLength || 60,
      sceneCount: scenes.length,
      scenes,
      status: 'pending',
      progress: 0,
    })

    triggerVideoProcessing(videoId, scenes)

    return NextResponse.json({
      success: true,
      videoId,
      message: 'Video generation started',
      sceneCount: scenes.length,
    })

  } catch (error) {
    console.error('Error in generate-video API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: 500 }
    )
  }
}

async function triggerVideoProcessing(videoId, scenes) {
  console.log(`Video ${videoId} queued for processing with ${scenes.length} scenes`)
  
  setTimeout(async () => {
    try {
      const { processVideo } = await import('@/utils/videoAssembler')
      await processVideo(videoId, scenes)
    } catch (error) {
      console.error(`Error processing video ${videoId}:`, error)
    }
  }, 100)
}