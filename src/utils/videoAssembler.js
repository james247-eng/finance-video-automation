/*

import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import fs from 'fs'
import path from 'path'

//import { generateStickFigureImage } from '../lib/stickFigureGenerator.js'

import { generateTextFrame } from '../lib/textFrameGenerator.js' // Adjusted import path  FROM STICK FIGURE GENERATOR TO TEXT FRAME GENERATOR
import { generateVoiceoverFromScenes } from '../lib/elevenlabs.js'
import { updateVideo, uploadVideoToStorage, uploadImageToStorage } from '../lib/firebaseAdmin.js'
import logger from '../lib/logger.js'

// Configure FFmpeg binary path for GitHub Actions and local environments
ffmpeg.setFfmpegPath(ffmpegStatic)

const OUTPUT_DIR = path.join(process.cwd(), 'output')
const TEMP_DIR = path.join(process.cwd(), 'temp')

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

export async function processVideo(videoId, scenes) {
  logger.info(`Starting video processing for ${videoId} with ${scenes.length} scenes`)
  
  try {
    if (!videoId || !Array.isArray(scenes) || scenes.length === 0) {
      throw new Error('Invalid videoId or scenes')
    }

    await updateVideo(videoId, {
      status: 'processing',
      progress: 10,
      currentStep: 'Generating images...'
    })

    const imagePaths = []
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      logger.info(`Generating image for scene ${i + 1}/${scenes.length}`)
      
      try {
        const imageBuffer = await generateTextFrame(scene, scene.sceneNumber)
        
        const imagePath = path.join(TEMP_DIR, `${videoId}_scene_${i}.png`)
        fs.writeFileSync(imagePath, imageBuffer)
        imagePaths.push(imagePath)
        
        await uploadImageToStorage(imageBuffer, videoId, i)
        
        const progress = 10 + (i / scenes.length) * 30
        await updateVideo(videoId, {
          progress: Math.round(progress),
          currentStep: `Generated ${i + 1}/${scenes.length} images`
        })
      } catch (sceneError) {
        logger.error(`Error processing scene ${i}:`, sceneError)
        throw new Error(`Failed to process scene ${i}: ${sceneError.message}`)
      }
    }

    await updateVideo(videoId, {
      progress: 40,
      currentStep: 'Generating voiceover...'
    })

    logger.info('Generating voiceover from scenes')
    const voiceoverPath = path.join(TEMP_DIR, `${videoId}_voiceover.mp3`)
    const voiceoverBuffer = await generateVoiceoverFromScenes(scenes)
    fs.writeFileSync(voiceoverPath, voiceoverBuffer)

    await updateVideo(videoId, {
      progress: 60,
      currentStep: 'Assembling video...'
    })

    logger.info('Assembling video from images and audio')
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

    logger.info('Uploading video to storage')
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

    logger.info(`Video ${videoId} completed successfully`)
    cleanupTempFiles(videoId, imagePaths, voiceoverPath, videoPath)
    
    return videoUrl

  } catch (error) {
    logger.error(`Error processing video ${videoId}:`, error)
    
    try {
      await updateVideo(videoId, {
        status: 'failed',
        errorMessage: error.message,
        progress: 0
      })
    } catch (updateError) {
      logger.error(`Failed to update video status: ${updateError.message}`)
    }

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
    
    try {
      fs.writeFileSync(concatFilePath, concatContent)
    } catch (writeError) {
      logger.error('Error writing concat file:', writeError)
      return reject(new Error(`Failed to write concat file: ${writeError.message}`))
    }

    logger.info(`Creating video with ${imagePaths.length} images`)

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
        logger.debug('FFmpeg command started')
      })
      .on('progress', (progress) => {
        logger.debug(`FFmpeg progress: ${progress.percent}%`)
      })
      .on('end', () => {
        logger.info(`Video created successfully: ${outputPath}`)
        resolve(outputPath)
      })
      .on('error', (err, stdout, stderr) => {
        logger.error('FFmpeg error:', err.message)
        logger.error('FFmpeg stderr:', stderr)
        reject(new Error(`Video creation failed: ${err.message}`))
      })
      .run()
  })
}

function cleanupTempFiles(videoId, imagePaths, voiceoverPath, videoPath) {
  try {
    logger.info('Cleaning up temporary files')

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

    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath)
    }

    logger.info('Cleanup completed')
  } catch (error) {
    logger.warn('Non-critical cleanup error:', error.message)
  }
}

*/
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import fs from 'fs'
import path from 'path'
import { generateTextFrame } from '../lib/textFrameGenerator.js'
import { generateVoiceoverFromScenes } from '../lib/elevenlabs.js'
import { updateVideo, uploadVideoToStorage } from '../lib/firebaseAdmin.js'
import logger from '../lib/logger.js'

ffmpeg.setFfmpegPath(ffmpegStatic)

const OUTPUT_DIR = path.join(process.cwd(), 'output')
const TEMP_DIR = path.join(process.cwd(), 'temp')
const ASSETS_DIR = path.join(process.cwd(), 'assets')

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })

export async function processVideo(videoId, scenes) {
  try {
    const imagePaths = []
    
    // Step 1: Create Assets
    for (let i = 0; i < scenes.length; i++) {
      const buffer = await generateTextFrame(scenes[i], i + 1)
      const imgPath = path.join(TEMP_DIR, `${videoId}_${i}.png`)
      fs.writeFileSync(imgPath, buffer)
      imagePaths.push(imgPath)
    }

    const voiceoverBuffer = await generateVoiceoverFromScenes(scenes)
    const voPath = path.join(TEMP_DIR, `${videoId}_vo.mp3`)
    fs.writeFileSync(voPath, voiceoverBuffer)

    // Step 2: Assemble
    const outputPath = path.join(OUTPUT_DIR, `${videoId}.mp4`)
    await assemblePremiumVideo(videoId, scenes, imagePaths, voPath, outputPath)

    // Step 3: Finalize
    const videoBuffer = fs.readFileSync(outputPath)
    const videoUrl = await uploadVideoToStorage(videoBuffer, videoId, `Video ${videoId}`)

    await updateVideo(videoId, { status: 'completed', videoUrl, progress: 100 })
    return videoUrl
  } catch (error) {
    logger.error('Render process failed:', error)
    throw error
  }
}

function assemblePremiumVideo(videoId, scenes, imagePaths, voPath, outputPath) {
  return new Promise((resolve, reject) => {
    const concatPath = path.join(TEMP_DIR, `${videoId}_list.txt`)
    // Correcting the concat format: file path, then duration, then repeat last file
    const content = imagePaths.map((p, i) => `file '${path.resolve(p)}'\nduration ${scenes[i].duration}`).join('\n') + `\nfile '${path.resolve(imagePaths[imagePaths.length - 1])}'`
    fs.writeFileSync(concatPath, content)

    const musicPath = path.join(ASSETS_DIR, 'bg_music.mp3')
    const useMusic = fs.existsSync(musicPath)

    let cmd = ffmpeg()
      .input(concatPath).inputOptions(['-f', 'concat', '-safe', '0'])
      .input(voPath)

    if (useMusic) cmd.input(musicPath).inputOptions(['-stream_loop', '-1'])

    // The Filter Stack: Motion + Pacing + Branding
    cmd.complexFilter([
      // Apply Ken Burns Zoom that respects the scene duration
      // zoom+0.002 = speed of zoom
      // s=1920x1080 = output size
      {
        filter: 'zoompan',
        options: {
          z: 'zoom+0.0012',
          x: 'iw/2-(iw/zoom/2)',
          y: 'ih/2-(ih/zoom/2)',
          d: '25*10', // Calculate frames for up to 10s per scene
          s: '1920x1080',
          fps: 25
        },
        inputs: '0:v', outputs: 'v1'
      },
      // Audio mix: Background music at 12% volume, VO at 100%
      useMusic 
        ? '[1:a]volume=1.0[vo]; [2:a]volume=0.12[bg]; [vo][bg]amix=inputs=2:duration=first[aout]'
        : '[1:a]volume=1.0[aout]'
    ])
    .outputOptions([
      '-map [v1]',
      '-map [aout]',
      '-c:v libx264',
      '-pix_fmt yuv420p',
      '-preset fast',
      '-crf 18',
      '-shortest'
    ])
    .on('end', () => resolve(outputPath))
    .on('error', (e) => reject(e))
    .save(outputPath)
  })
}