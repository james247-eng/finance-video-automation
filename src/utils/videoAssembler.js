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
import axios from 'axios'

import { generateVoiceoverFromScenes } from '../lib/elevenlabs.js'
import { updateVideo, uploadVideoToStorage } from '../lib/firebaseAdmin.js'
import logger from '../lib/logger.js'

ffmpeg.setFfmpegPath(ffmpegStatic)

const OUTPUT_DIR = path.join(process.cwd(), 'output')
const TEMP_DIR = path.join(process.cwd(), 'temp')

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })

/**
 * Fetches background from Pixabay
 */
async function getPixabayBackground(query) {
  try {
    const apiKey = process.env.PIXABAY_API_KEY;
    const url = `https://pixabay.com/api/videos/?key=${apiKey}&q=${encodeURIComponent(query)}&video_type=film&per_page=3`;
    const res = await axios.get(url);
    // Return the high-quality link of the first relevant result
    return res.data.hits[0]?.videos?.medium?.url;
  } catch (err) {
    logger.warn('Pixabay fail, using fallback gradient');
    return "https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_25fps.mp4";
  }
}

/**
 * Creates the .ass subtitle file for word-level sync
 */
function createSubtitleFile(alignment, outputPath) {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;
  
  let words = [];
  let currentWord = "";
  let wordStart = character_start_times_seconds[0];

  characters.forEach((char, i) => {
    currentWord += char;
    if (char === " " || i === characters.length - 1) {
      words.push({
        text: currentWord.trim(),
        start: wordStart,
        end: character_end_times_seconds[i]
      });
      currentWord = "";
      wordStart = character_start_times_seconds[i + 1];
    }
  });

  const header = `[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Impact,80,&H00FFFFFF,&H0000D7FF,&H80000000,&H00000000,-1,0,0,0,100,100,2,0,1,4,0,2,10,10,120,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;

  const events = words.map(w => {
    const start = new Date(w.start * 1000).toISOString().substr(11, 11).replace('T', '');
    const end = new Date(w.end * 1000).toISOString().substr(11, 11).replace('T', '');
    return `Dialogue: 0,${start},${end},Default,,0,0,0,,${w.text}`;
  }).join('\n');

  fs.writeFileSync(outputPath, header + events);
}

export async function processVideo(videoId, scenes) {
  logger.info(`🚀 Starting Pixabay-Synced Render for ${videoId}`)
  
  try {
    // 1. Audio + Timestamps
    const { audioBuffer, alignment } = await generateVoiceoverFromScenes(scenes)
    const voPath = path.join(TEMP_DIR, `${videoId}_vo.mp3`)
    fs.writeFileSync(voPath, audioBuffer)

    // 2. Subtitles
    const subPath = path.join(TEMP_DIR, `${videoId}.ass`)
    createSubtitleFile(alignment, subPath)

    // 3. Pixabay Background (Using first scene prompt)
    const bgUrl = await getPixabayBackground(scenes[0].description || "abstract dark finance")

    // 4. Final Render
    const outputPath = path.join(OUTPUT_DIR, `${videoId}.mp4`)
    
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(bgUrl).inputOptions(['-stream_loop', '-1'])
        .input(voPath)
        .complexFilter([
          `subtitles=${subPath.replace(/\\/g, '/')}:force_style='Alignment=2',vignette=angle=0.3`
        ])
        .outputOptions(['-c:v libx264', '-pix_fmt yuv420p', '-shortest', '-map 0:v', '-map 1:a'])
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath)
    })

    const videoUrl = await uploadVideoToStorage(fs.readFileSync(outputPath), videoId, videoId)
    await updateVideo(videoId, { status: 'completed', videoUrl, progress: 100 })
    return videoUrl

  } catch (error) {
    logger.error('Render process failed:', error)
    await updateVideo(videoId, { status: 'failed', errorMessage: error.message })
    throw error
  }
}