/*

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

*/


import sharp from 'sharp';

export async function generateTextFrame(scene, sceneNumber) {
  console.log(`🎨 Generating PREMIUM text frame for scene ${sceneNumber}...`);
  
  const width = 1920;
  const height = 1080;
  
  // Detect emotion for gradient
  const emotion = detectEmotion(scene.imagePrompt);
  const gradient = getGradient(emotion);
  
  // Clean text and force Uppercase for the main hook
  const mainText = (scene.voiceoverText.split('.')[0] || '').substring(0, 60).toUpperCase();
  const subText = scene.voiceoverText.split('.')[1]?.trim().substring(0, 100) || '';
  
  // Create SVG with Cinematic filters
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <rect width="${width}" height="${height}" fill="url(#grad)"/>
      
      <rect x="50" y="50" width="${width - 100}" height="${height - 100}" 
            fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
      
      <text x="50%" y="48%" 
            font-family="Impact, Arial, sans-serif" 
            font-size="110" 
            font-weight="900" 
            fill="#FFD700" 
            text-anchor="middle"
            filter="url(#textGlow)"
            style="letter-spacing: 4px;">
        ${escapeXml(mainText)}
      </text>
      
      ${subText ? `
      <text x="50%" y="62%" 
            font-family="Verdana, sans-serif" 
            font-size="42" 
            fill="white" 
            text-anchor="middle"
            style="opacity: 0.9; font-style: italic;">
        ${escapeXml(subText)}
      </text>
      ` : ''}
      
      <text x="100" y="${height - 100}" 
            font-family="Arial" font-size="24" fill="rgba(255,255,255,0.3)" font-weight="bold">
        ATLAS ECONOMY // ACADEMY
      </text>

      <rect x="0" y="${height - 10}" width="${(sceneNumber / 10) * 1920}" height="10" fill="#FFD700" opacity="0.6" />
    </svg>
  `;
  
  const buffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();
  
  console.log(`✅ Premium frame ${sceneNumber} generated`);
  return buffer;
}

function detectEmotion(prompt) {
  const p = prompt ? prompt.toLowerCase() : '';
  if (p.includes('fear') || p.includes('worry') || p.includes('danger')) return 'fear';
  if (p.includes('success') || p.includes('win') || p.includes('rich')) return 'success';
  if (p.includes('debt') || p.includes('problem')) return 'warning';
  if (p.includes('confident') || p.includes('hero')) return 'confident';
  return 'neutral';
}

function getGradient(emotion) {
  const gradients = {
    fear: { start: '#000000', end: '#434343' },       // Cinematic Black
    success: { start: '#134e4a', end: '#065f46' },    // Deep Emerald
    warning: { start: '#450a0a', end: '#991b1b' },    // Blood Red
    confident: { start: '#1e3a8a', end: '#1e40af' },  // Royal Blue
    neutral: { start: '#0f172a', end: '#1e293b' }     // Slate Midnight
  };
  return gradients[emotion] || gradients.neutral;
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