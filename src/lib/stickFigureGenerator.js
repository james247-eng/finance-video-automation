const PImage = require('pureimage');
const { PassThrough } = require('stream');

async function generateStickFigureImage(prompt, sceneNumber) {
  console.log(`🎨 Generating stick figure for scene ${sceneNumber}...`);
  
  const width = 1024;
  const height = 1024;
  const img = PImage.make(width, height);
  const ctx = img.getContext('2d');
  
  // Parse prompt
  const promptLower = prompt.toLowerCase();
  const isConfident = promptLower.includes('confident') || promptLower.includes('standing');
  const isFearful = promptLower.includes('fear') || promptLower.includes('scared');
  const isHolding = promptLower.includes('holding');
  const isWalking = promptLower.includes('walking') || promptLower.includes('step');
  const isDark = promptLower.includes('dark') || promptLower.includes('shadow');
  const isRed = promptLower.includes('red') || promptLower.includes('debt');
  const isGray = promptLower.includes('gray') || promptLower.includes('grey');
  
  // Background
  if (isDark) {
    ctx.fillStyle = '#2d3748';
  } else if (isRed) {
    ctx.fillStyle = '#fee2e2';
  } else if (isGray) {
    ctx.fillStyle = '#f3f4f6';
  } else {
    ctx.fillStyle = '#ffffff';
  }
  ctx.fillRect(0, 0, width, height);
  
  // Stick figure dimensions
  const centerX = width / 2;
  const centerY = height / 2;
  const headRadius = 80;
  const bodyLength = 200;
  const armLength = 150;
  const legLength = 180;
  
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 12;
  ctx.fillStyle = '#000000';
  
  // Head
  ctx.beginPath();
  ctx.arc(centerX, centerY - bodyLength - headRadius, headRadius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Body
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - bodyLength);
  ctx.lineTo(centerX, centerY);
  ctx.stroke();
  
  // Arms based on pose
  if (isConfident) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - bodyLength + 50);
    ctx.lineTo(centerX - armLength + 50, centerY - 50);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - bodyLength + 50);
    ctx.lineTo(centerX + armLength - 50, centerY - 50);
    ctx.stroke();
  } else if (isFearful) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - bodyLength + 50);
    ctx.lineTo(centerX - armLength + 30, centerY - bodyLength - 50);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - bodyLength + 50);
    ctx.lineTo(centerX + armLength - 30, centerY - bodyLength - 50);
    ctx.stroke();
  } else if (isHolding) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - bodyLength + 50);
    ctx.lineTo(centerX - armLength, centerY - 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - bodyLength + 50);
    ctx.lineTo(centerX + armLength - 50, centerY - 80);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX + armLength - 50, centerY - 80, 40, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - bodyLength + 50);
    ctx.lineTo(centerX - armLength, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - bodyLength + 50);
    ctx.lineTo(centerX + armLength, centerY);
    ctx.stroke();
  }
  
  // Legs
  if (isWalking) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX - 60, centerY + legLength);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + 80, centerY + legLength - 30);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX - 70, centerY + legLength);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + 70, centerY + legLength);
    ctx.stroke();
  }
  
  console.log(`✅ Scene ${sceneNumber} generated`);
  
  // FIX: Capture the PNG stream and convert it to a Buffer
  return new Promise((resolve, reject) => {
    const stream = new PassThrough();
    const chunks = [];
    
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
    
    PImage.encodePNGToStream(img, stream);
  });
}

module.exports = { generateStickFigureImage };