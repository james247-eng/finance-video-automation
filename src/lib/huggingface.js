import axios from 'axios'
import logger from '@/lib/logger'

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY
const HF_API_URL = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0'

// Retry with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      // If model is loading, wait longer
      if (error.response?.status === 503) {
        const delay = baseDelay * Math.pow(2, i)
        logger.warn(`Model loading... retrying in ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        throw error
      }
    }
  }
}

export async function generateStickFigureImage(prompt, sceneNumber) {
  if (!HF_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY not configured')
  }

  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt must be a non-empty string')
  }

  // Enhance prompt for stick figure style
  const enhancedPrompt = `${prompt}, stick figure drawing, minimalist black line art, simple illustration, white background, clean lines, educational diagram style, vector art`

  const negativePrompt = 'realistic, photorealistic, detailed, complex, colorful, 3d, photograph, messy, cluttered'

  try {
    logger.info(`Generating image for scene ${sceneNumber}`)

    const generateImage = async () => {
      const response = await axios.post(
        HF_API_URL,
        {
          inputs: enhancedPrompt,
          parameters: {
            negative_prompt: negativePrompt,
            num_inference_steps: 30,
            guidance_scale: 7.5,
            width: 1024,
            height: 1024,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: 60000, // 60 second timeout
        }
      )

      return Buffer.from(response.data)
    }

    const imageBuffer = await retryWithBackoff(generateImage, 3, 3000)
    
    logger.info(`Generated image for scene ${sceneNumber}: ${imageBuffer.length} bytes`)
    return imageBuffer

  } catch (error) {
    logger.error(`Error generating image for scene ${sceneNumber}:`, error.message)
    
    if (error.response?.status === 503) {
      throw new Error('Image generation model is loading. Please try again in a few minutes.')
    }
    
    throw new Error(`Image generation failed: ${error.message}`)
  }
}

// Alternative: Generate simple colored background placeholder
export function generatePlaceholderImage(sceneNumber, width = 1024, height = 1024) {
  logger.warn(`Using placeholder image for scene ${sceneNumber}`)
  // This creates a simple canvas with text - useful as fallback
  // In a real implementation, you'd use node-canvas or similar
  return Buffer.from('placeholder-image-data')
}