import Groq from 'groq-sdk'
import logger from '@/lib/logger'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export async function processScriptToScenes(script, targetLength = 60) {
  if (!script || typeof script !== 'string') {
    throw new Error('Script must be a non-empty string')
  }

  const scenesNeeded = Math.ceil(targetLength / 5) // Roughly 5 seconds per scene
  
  const prompt = `You are a video script analyzer for "Atlas Economy" - a financial education channel featuring stick figure animations.

Convert this script into ${scenesNeeded} visual scenes. Each scene should:
1. Be 4-6 seconds long
2. Have a clear stick figure action/pose
3. Include the exact voiceover text
4. Use simple, minimal backgrounds

SCRIPT:
${script}

Return ONLY a valid JSON array (no markdown, no explanation) with this exact format:
[
  {
    "sceneNumber": 1,
    "duration": 5,
    "description": "Stick figure standing confidently with arms crossed",
    "imagePrompt": "minimalist stick figure person standing with arms crossed, confident pose, simple white background, black lines, finance concept",
    "voiceoverText": "The exact text to be spoken",
    "background": "simple gradient background",
    "transition": "fade"
  }
]

Keep imagePrompts focused on: stick figure, simple poses, minimal backgrounds, financial metaphors.`

  try {
    logger.info(`Processing script into ${scenesNeeded} scenes`)

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 4000,
    })

    const response = completion.choices[0]?.message?.content || ''
    
    // Extract JSON from response (in case AI adds markdown)
    let jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      logger.error('No valid JSON found in Groq response')
      throw new Error('Invalid scene format from AI')
    }
    
    const scenes = JSON.parse(jsonMatch[0])
    
    // Validate scenes
    if (!Array.isArray(scenes) || scenes.length === 0) {
      throw new Error('Invalid scenes format from AI')
    }

    // Ensure all scenes have required fields
    const validatedScenes = scenes.map((scene, idx) => ({
      sceneNumber: scene.sceneNumber || idx + 1,
      duration: Math.max(4, Math.min(6, scene.duration || 5)),
      description: scene.description || 'Scene',
      imagePrompt: scene.imagePrompt || 'stick figure animation',
      voiceoverText: scene.voiceoverText || '',
      background: scene.background || 'simple white background',
      transition: scene.transition || 'fade'
    }))

    logger.info(`Successfully processed ${validatedScenes.length} scenes`)
    return validatedScenes

  } catch (error) {
    logger.error('Error processing script with Groq:', error)
    throw new Error(`Script processing failed: ${error.message}`)
  }
}

export async function generateStoryScript(topic, length = 60) {
  if (!topic || typeof topic !== 'string') {
    throw new Error('Topic must be a non-empty string')
  }

  const prompt = `Create a ${length}-second engaging financial education script for "Atlas Economy".

Topic: ${topic}

Requirements:
- Use storytelling with metaphors (enemies, battles, journeys)
- Reference "Atlas" as the character who learns lessons
- Keep it motivational and actionable
- Use short, punchy sentences
- Include a strong opening hook and clear conclusion

Write the complete script (no formatting, just the narration text):`

  try {
    logger.info(`Generating story script for topic: "${topic}"`)

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 1500,
    })

    const script = completion.choices[0]?.message?.content || ''
    
    if (!script || script.length < 20) {
      throw new Error('Generated script is too short')
    }

    logger.info(`Generated script with ${script.length} characters`)
    return script

  } catch (error) {
    logger.error('Error generating script with Groq:', error)
    throw new Error(`Script generation failed: ${error.message}`)
  }
}