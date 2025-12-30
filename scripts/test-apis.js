// Test script to verify all APIs are configured correctly
// Run with: npm run test-apis

require('dotenv').config({ path: '.env.local' })

async function testGroq() {
  console.log('\n=== Testing Groq API ===')
  try {
    const { default: Groq } = await import('groq-sdk')
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say "Groq is working!"' }],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 50,
    })
    
    console.log('✅ Groq API: WORKING')
    console.log('Response:', completion.choices[0]?.message?.content)
  } catch (error) {
    console.error('❌ Groq API: FAILED')
    console.error('Error:', error.message)
  }
}

async function testHuggingFace() {
  console.log('\n=== Testing Hugging Face API ===')
  try {
    const axios = (await import('axios')).default
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        inputs: 'a simple stick figure',
        parameters: { num_inference_steps: 1 }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        },
        responseType: 'arraybuffer',
        timeout: 30000,
      }
    )
    
    console.log('✅ Hugging Face API: WORKING')
    console.log('Image size:', response.data.length, 'bytes')
  } catch (error) {
    if (error.response?.status === 503) {
      console.log('⚠️  Hugging Face API: Model is loading (this is normal)')
      console.log('Try again in 1-2 minutes')
    } else {
      console.error('❌ Hugging Face API: FAILED')
      console.error('Error:', error.message)
    }
  }
}

async function testGoogleTTS() {
  console.log('\n=== Testing Google Cloud TTS ===')
  try {
    const textToSpeech = (await import('@google-cloud/text-to-speech')).default
    const client = new textToSpeech.TextToSpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    })
    
    const [response] = await client.synthesizeSpeech({
      input: { text: 'Testing Google TTS' },
      voice: { languageCode: 'en-US', name: 'en-US-Neural2-D' },
      audioConfig: { audioEncoding: 'MP3' },
    })
    
    console.log('✅ Google Cloud TTS: WORKING')
    console.log('Audio size:', response.audioContent.length, 'bytes')
  } catch (error) {
    console.error('❌ Google Cloud TTS: FAILED')
    console.error('Error:', error.message)
  }
}

async function testFirebase() {
  console.log('\n=== Testing Firebase ===')
  try {
    const { initializeApp } = await import('firebase/app')
    const { getFirestore, collection, getDocs } = await import('firebase/firestore')
    
    const app = initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
    
    const db = getFirestore(app)
    await getDocs(collection(db, 'videos'))
    
    console.log('✅ Firebase: WORKING')
  } catch (error) {
    console.error('❌ Firebase: FAILED')
    console.error('Error:', error.message)
  }
}

async function runAllTests() {
  console.log('🚀 Starting API tests...\n')
  console.log('Environment variables loaded from .env.local')
  
  await testGroq()
  await testHuggingFace()
  await testGoogleTTS()
  await testFirebase()
  
  console.log('\n✨ Tests completed!')
  console.log('\nNote: If Hugging Face shows "model loading", this is normal.')
  console.log('The model will be ready in 1-2 minutes.\n')
}

runAllTests().catch(console.error)