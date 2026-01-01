import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'
import { generateStickFigureImage } from '@/lib/huggingface'
import { generateVoiceoverFromScenes } from '@/lib/elevenlabs'
import { updateVideo, uploadVideoToStorage, uploadImageToStorage } from '@/lib/firebaseAdmin'

const OUTPUT_DIR = path.join(process.cwd(), 'output')
const TEMP_DIR = path.join(process.cwd(), 'temp')

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

export async function processVideo(videoId, scenes) {
  console.log(`Starting video processing for ${videoId}`)
  
  try {
    await updateVideo(videoId, {
      status: 'processing',
      progress: 10,
      currentStep: 'Generating images...'
    })

    const imagePaths = []
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      console.log(`Generating image for scene ${i + 1}/${scenes.length}`)
      
      const imageBuffer = await generateStickFigureImage(
        scene.imagePrompt,
        scene.sceneNumber
      )
      
      const imagePath = path.join(TEMP_DIR, `${videoId}_scene_${i}.png`)
      fs.writeFileSync(imagePath, imageBuffer)
      imagePaths.push(imagePath)
      
      await uploadImageToStorage(imageBuffer, videoId, i)
      
      const progress = 10 + (i / scenes.length) * 30
      await updateVideo(videoId, {
        progress: Math.round(progress),
        currentStep: `Generated ${i + 1}/${scenes.length} images`
      })
    }

    await updateVideo(videoId, {
      progress: 40,
      currentStep: 'Generating voiceover...'
    })

    const voiceoverPath = path.join(TEMP_DIR, `${videoId}_voiceover.mp3`)
    const voiceoverBuffer = await generateVoiceoverFromScenes(scenes)
    fs.writeFileSync(voiceoverPath, voiceoverBuffer)

    await updateVideo(videoId, {
      progress: 60,
      currentStep: 'Assembling video...'
    })

    const videoPath = await createVideoFromImages(
      videoId,
      imagePaths,
      scenes,
      voiceoverPath
    )

    await updateVideo(videoId, {
      progress: 90,
      currentStep: 'Uploading video...'
    })

    const videoBuffer = fs.readFileSync(videoPath)
    const videoUrl = await uploadVideoToStorage(videoBuffer, videoId, scenes[0]?.voiceoverText || 'video')

    const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0)
    
    await updateVideo(videoId, {
      status: 'completed',
      progress: 100,
      videoUrl,
      duration: totalDuration,
      currentStep: 'Complete!'
    })

    cleanupTempFiles(videoId, imagePaths, voiceoverPath, videoPath)

    console.log(`Video ${videoId} completed successfully`)
    return videoUrl

  } catch (error) {
    console.error(`Error processing video ${videoId}:`, error)
    
    await updateVideo(videoId, {
      status: 'failed',
      errorMessage: error.message
    })

    throw error
  }
}

async function createVideoFromImages(videoId, imagePaths, scenes, audioPath) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(OUTPUT_DIR, `${videoId}.mp4`)
    
    const concatFilePath = path.join(TEMP_DIR, `${videoId}_concat.txt`)
    const concatContent = imagePaths
      .map((imgPath, i) => {
        const duration = scenes[i]?.duration || 5
        return `file '${imgPath}'\nduration ${duration}`
      })
      .join('\n')
    
    fs.writeFileSync(concatFilePath, concatContent)

    ffmpeg()
      .input(concatFilePath)
      .inputOptions(['-f concat', '-safe 0'])
      .input(audioPath)
      .outputOptions([
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-preset medium',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k',
        '-shortest',
        '-movflags +faststart'
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('FFmpeg command:', cmd)
      })
      .on('progress', (progress) => {
        console.log(`Processing: ${progress.percent}% done`)
      })
      .on('end', () => {
        console.log('Video created successfully')
        resolve(outputPath)
      })
      .on('error', (err, stdout, stderr) => {
        console.error('FFmpeg error:', err.message)
        console.error('FFmpeg stderr:', stderr)
        reject(new Error(`Video creation failed: ${err.message}`))
      })
      .run()
  })
}

function cleanupTempFiles(videoId, imagePaths, voiceoverPath, videoPath) {
  try {
    imagePaths.forEach(imgPath => {
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath)
      }
    })

    if (fs.existsSync(voiceoverPath)) {
      fs.unlinkSync(voiceoverPath)
    }

    const concatFilePath = path.join(TEMP_DIR, `${videoId}_concat.txt`)
    if (fs.existsSync(concatFilePath)) {
      fs.unlinkSync(concatFilePath)
    }

    console.log('Cleanup completed')
  } catch (error) {
    console.error('Cleanup error:', error)
  }
}