import { NextResponse } from 'next/server'
import { getVideos, adminDb } from '@/lib/firebaseAdmin'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    logger.info('API: Fetching video status from Firestore');

    // 1. Safety check for Firebase Initialization
    if (!adminDb) {
      logger.warn('Firebase Admin not initialized during check-status call');
      return NextResponse.json({ 
        success: true, 
        videos: [], 
        message: 'System initializing...' 
      });
    }

    // 2. Fetch videos using your existing library function
    const videos = await getVideos(50);

    // 3. Return clean JSON
    return NextResponse.json({
      success: true,
      videos: videos || [],
      count: videos ? videos.length : 0,
    });

  } catch (error) {
    logger.error('Error in check-status API route:', error);
    
    // Return JSON even on error so the frontend doesn't crash
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal Server Error',
        videos: [] 
      },
      { status: 500 }
    );
  }
}