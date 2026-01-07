import sharp from 'sharp';

export async function generateTextFrame(scene, sceneNumber) {
  console.log(`🎨 Generating text frame for scene ${sceneNumber}...`);
  
  const width = 1920;
  const height = 1080;
  
  // Detect emotion for gradient
  const emotion = detectEmotion(scene.imagePrompt);
  const gradient = getGradient(emotion);
  
  // Extract main text (first sentence, max 60 chars)
  const mainText = scene.voiceoverText.split('.')[0].substring(0, 60);
  const subText = scene.voiceoverText.split('.')[1]?.trim().substring(0, 100) || '';
  
  // Create SVG with text
  const svg = `
    <svg width="${width}" height="${height}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#grad)"/>
      
      <!-- Main Text -->
      <text x="50%" y="45%" 
            font-family="Arial, sans-serif" 
            font-size="100" 
            font-weight="900" 
            fill="white" 
            text-anchor="middle"
            style="text-shadow: 0 4px 20px rgba(0,0,0,0.5);">
        ${escapeXml(mainText)}
      </text>
      
      <!-- Sub Text -->
      ${subText ? `
      <text x="50%" y="58%" 
            font-family="Arial, sans-serif" 
            font-size="50" 
            font-weight="300" 
            fill="rgba(255,255,255,0.85)" 
            text-anchor="middle"
            style="text-shadow: 0 2px 10px rgba(0,0,0,0.5);">
        ${escapeXml(subText)}
      </text>
      ` : ''}
      
      <!-- Scene Number -->
      <circle cx="${width - 80}" cy="${height - 80}" r="40" fill="rgba(255,255,255,0.1)"/>
      <text x="${width - 80}" y="${height - 70}" 
            font-family="Arial, sans-serif" 
            font-size="40" 
            font-weight="700" 
            fill="white" 
            text-anchor="middle">
        ${sceneNumber}
      </text>
    </svg>
  `;
  
  const buffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();
  
  console.log(`✅ Text frame ${sceneNumber} generated`);
  return buffer;
}

function detectEmotion(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('fear') || p.includes('worry')) return 'fear';
  if (p.includes('success') || p.includes('win')) return 'success';
  if (p.includes('debt') || p.includes('problem')) return 'warning';
  if (p.includes('confident') || p.includes('hero')) return 'confident';
  return 'neutral';
}

function getGradient(emotion) {
  const gradients = {
    fear: { start: '#1a1a2e', end: '#0f3460' },
    success: { start: '#134e4a', end: '#064e3b' },
    warning: { start: '#7c2d12', end: '#c2410c' },
    confident: { start: '#1e3a8a', end: '#3730a3' },
    neutral: { start: '#1e293b', end: '#475569' }
  };
  return gradients[emotion];
}

function escapeXml(text) {
  return text.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
    }
  });
}