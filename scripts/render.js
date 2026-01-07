// ============================================
// FILE 1: scripts/render.js (REPLACE ENTIRE FILE)
// ============================================
const { processVideo } = require('../src/utils/videoAssembler');

async function run() {
  try {
    const videoId = process.env.VIDEO_ID;
    const scenes = JSON.parse(process.env.SCENES || "[]");

    if (!videoId) {
      throw new Error('VIDEO_ID environment variable is required');
    }

    if (!Array.isArray(scenes) || scenes.length === 0) {
      throw new Error('SCENES must be a non-empty array');
    }

    console.log(`🚀 Starting video processing for ${videoId}`);
    console.log(`📊 Total scenes: ${scenes.length}`);

    await processVideo(videoId, scenes);

    console.log('✅ Video processing completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('❌ Video processing failed:', error);
    process.exit(1);
  }
}

run();
