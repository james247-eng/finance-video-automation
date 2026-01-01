import { NextResponse } from 'next/server'
import { getVideos } from '@/lib/firebaseAdmin'

export async function GET(request) {
  try {
    const videos = await getVideos(50)
    
    return NextResponse.json({
      success: true,
      videos,
      count: videos.length,
    })

  } catch (error) {
    console.error('Error checking video status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get videos' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic' // Disable caching for this route