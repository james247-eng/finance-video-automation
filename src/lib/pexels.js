// Add to a new lib/pexels.js
import { createClient } from 'pexels';
const client = createClient(process.env.PEXELS_API_KEY);

export async function getBackgroundVideo(query) {
  try {
    // Search for short vertical/horizontal abstract videos
    const result = await client.videos.search({ query, per_page: 1, orientation: 'landscape' });
    return result.videos[0]?.video_files.find(f => f.quality === 'hd')?.link;
  } catch (err) {
    return "https://example.com/default_dark_gradient.mp4"; // Fallback
  }
}