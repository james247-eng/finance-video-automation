import { Queue, Worker } from 'bullmq'
import redis from 'redis'
import { processVideo } from '@/utils/videoAssembler'
import { updateVideo } from '@/lib/firebaseAdmin'
import logger from '@/lib/logger'

let redisConnection = null

function getRedisConnection() {
  if (!redisConnection) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    try {
      redisConnection = redis.createClient({
        url: redisUrl,
        legacyMode: false
      })

      redisConnection.on('error', (err) => {
        logger.error('Redis connection error:', err)
      })

      redisConnection.on('connect', () => {
        logger.info('Redis connected')
      })

      redisConnection.connect()
    } catch (error) {
      logger.error('Failed to create Redis connection:', error)
      throw error
    }
  }
  return redisConnection
}

export const videoQueue = new Queue('video-processing', {
  connection: getRedisConnection()
})

// Worker to process videos
if (typeof window === 'undefined') {
  try {
    const worker = new Worker('video-processing', async (job) => {
      const { videoId, scenes } = job.data

      try {
        logger.info(`Processing video ${videoId}`)
        await processVideo(videoId, scenes)
        logger.info(`Video ${videoId} completed successfully`)
        return { success: true, videoId }
      } catch (error) {
        logger.error(`Error processing video ${videoId}:`, error)
        await updateVideo(videoId, {
          status: 'failed',
          errorMessage: error.message
        }).catch(err => {
          logger.error(`Failed to update video status: ${err.message}`)
        })
        throw error
      }
    }, {
      connection: getRedisConnection(),
      concurrency: 1, // Process one video at a time
    })

    worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed`)
    })

    worker.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed:`, err)
    })
  } catch (error) {
    logger.warn('Worker initialization skipped (expected in build phase)', error.message)
  }
}

export async function addVideoToQueue(videoId, scenes) {
  try {
    if (!videoId || !Array.isArray(scenes)) {
      throw new Error('Invalid videoId or scenes')
    }

    const job = await videoQueue.add(
      'process',
      { videoId, scenes },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    )

    logger.info(`Added video ${videoId} to queue with job ID ${job.id}`)
    return job.id
  } catch (error) {
    logger.error(`Failed to add video to queue:`, error)
    throw error
  }
}

export async function closeRedis() {
  if (redisConnection) {
    try {
      await redisConnection.disconnect()
      logger.info('Redis connection closed')
    } catch (error) {
      logger.error('Error closing Redis connection:', error)
    }
  }
}
