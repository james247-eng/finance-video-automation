import { NextResponse } from 'next/server'
import { getVideos, adminDb } from '@/lib/firebaseAdmin'
import logger from '@/lib/logger'

// Force Next.js to treat this as a live API, not a static page
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    logger.info('API: Fetching video status');

    // FIX: If the DB isn't ready, return a valid JSON object instead of crashing
    if (!adminDb) {
      return new Response(JSON.stringify({ 
        success: true, 
        videos: [], 
        message: 'Database initializing...' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' } // Forces JSON mode
      });
    }

    const videos = await getVideos(50);

    return NextResponse.json({
      success: true,
      videos: videos || [],
      count: videos ? videos.length : 0,
    });

  } catch (error) {
    logger.error('Error in check-status:', error);
    // CRITICAL: Always return JSON so the frontend doesn't see '<'
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal Server Error',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}