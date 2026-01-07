import axios from 'axios'
import fs from 'fs'
import path from 'path'
import logger from './logger.js'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
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
  if (!ELEVENLABS_API_KEY) {
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
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        responseType: 'arraybuffer',
        timeout: 60000
      }
    )

    const audioBuffer = Buffer.from(response.data)
    logger.info(`Generated audio buffer: ${audioBuffer.length} bytes`)

    // Save to file if path provided
    if (outputPath) {
      const outputDir = path.dirname(outputPath)
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
      fs.writeFileSync(outputPath, audioBuffer)
      logger.info(`Audio saved to ${outputPath}`)
    }

    return audioBuffer

  } catch (error) {
    logger.error('Error generating voiceover:', error.response?.data || error.message)
    
    if (error.response?.status === 401) {
      throw new Error('Invalid ElevenLabs API key')
    }
    
    if (error.response?.status === 429) {
      throw new Error('ElevenLabs quota exceeded. Upgrade plan or wait for reset.')
    }

    throw new Error(`Voiceover generation failed: ${error.message}`)
  }
}

export async function generateVoiceoverFromScenes(scenes, voiceId = DEFAULT_VOICE) {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not configured')
  }

  if (!Array.isArray(scenes) || scenes.length === 0) {
    throw new Error('Scenes must be a non-empty array')
  }

  try {
    // Combine all voiceover texts with pauses
    const fullScript = scenes
      .map(scene => scene.voiceoverText)
      .join(' ... ') // Natural pause

    logger.info(`Generating voiceover for ${scenes.length} scenes, total ${fullScript.length} characters`)

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
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not configured')
  }

  try {
    const response = await axios.get(
      `${ELEVENLABS_API_URL}/user`,
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY
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

export function estimateAudioDuration(text, charactersPerSecond = 15) {
  // ElevenLabs typically processes ~15 characters per second of audio
  return Math.ceil(text.length / charactersPerSecond)
}