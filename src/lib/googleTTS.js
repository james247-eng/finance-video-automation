import textToSpeech from '@google-cloud/text-to-speech'
import fs from 'fs'
import path from 'path'

// Initialize the Google Cloud TTS client
let ttsClient

function getClient() {
  if (!ttsClient) {
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS
    
    if (!credentials) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS not configured')
    }

    ttsClient = new textToSpeech.TextToSpeechClient({
      keyFilename: credentials
    })
  }
  
  return ttsClient
}

export async function generateVoiceover(text, outputPath = null) {
  try {
    const client = getClient()

    // Configure the TTS request
    const request = {
      input: { text },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Neural2-D', // Deep, authoritative male voice
        // Alternative voices:
        // 'en-US-Neural2-F' - Professional female voice
        // 'en-US-Neural2-J' - Warm, friendly male voice
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0, // Normal speed
        pitch: 0.0, // Normal pitch
        volumeGainDb: 0.0,
        effectsProfileId: ['small-bluetooth-speaker-class-device'], // Optimized for digital playback
      },
    }

    // Perform the text-to-speech request
    const [response] = await client.synthesizeSpeech(request)

    // If outputPath is provided, save to file
    if (outputPath) {
      const outputDir = path.dirname(outputPath)
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
      fs.writeFileSync(outputPath, response.audioContent, 'binary')
      console.log(`Audio saved to ${outputPath}`)
    }

    // Return the audio buffer
    return response.audioContent

  } catch (error) {
    console.error('Error generating voiceover:', error)
    throw new Error(`Voiceover generation failed: ${error.message}`)
  }
}

export async function generateVoiceoverFromScenes(scenes) {
  try {
    // Combine all voiceover texts with appropriate pauses
    const fullScript = scenes
      .map(scene => scene.voiceoverText)
      .join(' ... ') // SSML pause
    
    // Add SSML for better control
    const ssmlText = `
      <speak>
        <prosody rate="medium" pitch="medium">
          ${fullScript}
        </prosody>
      </speak>
    `

    const client = getClient()

    const request = {
      input: { ssml: ssmlText },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Neural2-D',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
      },
    }

    const [response] = await client.synthesizeSpeech(request)
    
    console.log('Generated combined voiceover for all scenes')
    return response.audioContent

  } catch (error) {
    console.error('Error generating combined voiceover:', error)
    throw new Error(`Combined voiceover generation failed: ${error.message}`)
  }
}

// Helper to estimate audio duration
export function estimateAudioDuration(text, wordsPerMinute = 150) {
  const words = text.split(/\s+/).length
  const minutes = words / wordsPerMinute
  return Math.ceil(minutes * 60) // Return seconds
}