import axios from 'axios'
import fs from 'fs'
import path from 'path'
import logger from './logger.js' // Ensure path is correct for your setup

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

// Voice IDs - Professional male voices for financial content
const VOICES = {
  // Adam - Deep, authoritative (default for Atlas Economy)
  ADAM: 'pNInz6obpgDQGcFmaJgB',
  // Antoni - Well-rounded, friendly
  ANTONI: 'ErXwobaYiN019PkySvjV',
  // Arnold - Crisp, motivational
  ARNOLD: 'VR6AewLTigWG4xSOukaG',
}

const DEFAULT_VOICE = VOICES.ADAM

export async function generateVoiceover(text, outputPath = null, voiceId = DEFAULT_VOICE) {
  // FIX: Fetch key inside the function to ensure it is loaded from environment
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    // This log will help us debug in GitHub Actions
    console.error("DEBUG: ELEVENLABS_API_KEY is missing from process.env");
    throw new Error('ELEVENLABS_API_KEY not configured')
  }

  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string')
  }

  try {
    logger.info(`Generating voiceover for ${text.length} characters`)

    const response = await axios.post(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      },
      {
        headers: {
          'xi-api-key': apiKey, // Use the fresh apiKey variable
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    )

    const audioBuffer = Buffer.from(response.data)

    if (outputPath) {
      fs.writeFileSync(outputPath, audioBuffer)
      logger.info(`Voiceover saved to ${outputPath}`)
    }

    return audioBuffer

  } catch (error) {
    if (error.response && error.response.status === 401) {
      logger.error('ElevenLabs Authentication Failed: Check if API Key is valid and has enough quota')
    }
    logger.error('Error generating voiceover:', error.message)
    throw error
  }
}

export async function generateVoiceoverFromScenes(scenes, voiceId = DEFAULT_VOICE) {
  try {
    const fullScript = scenes.map(scene => scene.voiceoverText).join(' ')
    logger.info('Generating combined voiceover for all scenes')
    
    const audioBuffer = await generateVoiceover(fullScript, null, voiceId)
    
    logger.info('Generated combined voiceover successfully')
    return audioBuffer

  } catch (error) {
    logger.error('Error generating combined voiceover:', error)
    throw error
  }
}

// Check remaining quota
export async function checkQuota() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured')
  }

  try {
    const response = await axios.get(
      `${ELEVENLABS_API_URL}/user`,
      {
        headers: {
          'xi-api-key': apiKey
        }
      }
    )

    const subscription = response.data.subscription
    const quota = {
      characterCount: subscription.character_count,
      characterLimit: subscription.character_limit,
      remaining: subscription.character_limit - subscription.character_count,
      canSynthesizeFreelyCharacterLimit: subscription.can_synthesize_freely_character_limit || 0
    }

    logger.info(`ElevenLabs quota: ${quota.remaining}/${quota.characterLimit}`)
    return quota
  } catch (error) {
    logger.error('Error checking quota:', error)
    return null
  }
}

// Estimate if you have enough quota
export function estimateCharactersNeeded(script) {
  return script.length
}