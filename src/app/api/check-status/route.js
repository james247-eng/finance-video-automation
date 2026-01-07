/*

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

*/



import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
  }

  try {
    const doc = await adminDb.collection('videos').doc(videoId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json(doc.data());
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}