import { NextResponse } from 'next/server'
import { getVideos, adminDb } from '@/lib/firebaseAdmin'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    logger.info('Fetching video status');

    // CRITICAL: Check if Firebase initialized correctly
    if (!adminDb) {
      logger.error('Firebase Admin not initialized. Returning empty state.');
      return NextResponse.json({ 
        success: true, 
        videos: [], 
        count: 0,
        status: 'initializing' 
      });
    }

    const videos = await getVideos(50);

    return NextResponse.json({
      success: true,
      videos: videos || [],
      count: videos ? videos.length : 0,
    });

  } catch (error) {
    logger.error('Error checking video status:', error);
    // Force a JSON response so the frontend doesn't see a '<' SyntaxError
    return NextResponse.json(
      { success: false, error: error.message, videos: [] },
      { status: 500 }
    );
  }
}


