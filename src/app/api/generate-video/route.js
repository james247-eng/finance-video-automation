import { NextResponse } from 'next/server'
import { createVideo } from '@/lib/firebase'
import { processScriptToScenes } from '@/lib/groq'

export async function POST(request) {
  try {
    const { script, title, videoLength } = await request.json()

    // Validation
    if (!script || !title) {
      return NextResponse.json(
        { error: 'Script and title are required' },
        { status: 400 }
      )
    }

    // Step 1: Process script into scenes using AI
    console.log('Processing script into scenes...')
    const scenes = await processScriptToScenes(script, videoLength || 60)

    // Step 2: Create video record in database
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

    // Step 3: Trigger background processing (we'll build this next)
    // For now, we'll process inline for testing
    // In production, this would be a background job
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

// Background processing trigger (simplified for now)
async function triggerVideoProcessing(videoId, scenes) {
  // This will be called asynchronously
  // We'll build the full processing pipeline in the next files
  console.log(`Video ${videoId} queued for processing with ${scenes.length} scenes`)
  
  // In a production system, you would:
  // 1. Send to a queue (like Bull, BullMQ, or cloud task queue)
  // 2. Process in a separate worker
  // 3. Update status in real-time
  
  // For now, we'll simulate processing
  setTimeout(async () => {
    try {
      const { processVideo } = await import('@/utils/videoAssembler')
      await processVideo(videoId, scenes)
    } catch (error) {
      console.error(`Error processing video ${videoId}:`, error)
    }
  }, 100)
}