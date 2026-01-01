import { NextResponse } from 'next/server'
import { getVideos } from '@/lib/firebaseAdmin'
import { withErrorHandling } from '@/lib/middleware'
import logger from '@/lib/logger'

async function handler(request) {
  if (request.method !== 'GET') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  }

  try {
    logger.info('Fetching video status')
    const videos = await getVideos(50)

    return NextResponse.json({
      success: true,
      videos,
      count: videos.length,
    })

  } catch (error) {
    logger.error('Error checking video status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get videos' },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(handler)
export const dynamic = 'force-dynamic'
