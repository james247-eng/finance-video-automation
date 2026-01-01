// SERVER-SIDE ONLY - Never imported in client components
import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import logger from '@/lib/logger'

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
    logger.info('Firebase Admin initialized successfully')
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin:', error)
    throw error
  }
}

const adminDb = getFirestore()
const adminStorage = getStorage()

// Database operations (SERVER-SIDE)
export async function createVideo(videoData) {
  try {
    if (!videoData || typeof videoData !== 'object') {
      throw new Error('Video data must be a valid object')
    }

    logger.info(`Creating video: "${videoData.title}"`)

    const docRef = await adminDb.collection('videos').add({
      ...videoData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
    })

    logger.info(`Video created with ID: ${docRef.id}`)
    return docRef.id
  } catch (error) {
    logger.error('Error creating video:', error)
    throw error
  }
}

export async function updateVideo(videoId, updates) {
  try {
    if (!videoId || typeof videoId !== 'string') {
      throw new Error('Video ID must be a valid string')
    }

    if (!updates || typeof updates !== 'object') {
      throw new Error('Updates must be a valid object')
    }

    logger.debug(`Updating video ${videoId}:`, updates)

    await adminDb.collection('videos').doc(videoId).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    logger.info(`Video ${videoId} updated`)
  } catch (error) {
    logger.error(`Error updating video ${videoId}:`, error)
    throw error
  }
}

export async function getVideos(limitCount = 50) {
  try {
    if (!Number.isInteger(limitCount) || limitCount < 1) {
      throw new Error('Limit must be a positive integer')
    }

    logger.info(`Fetching ${limitCount} videos`)

    const snapshot = await adminDb
      .collection('videos')
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get()
    
    const videos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }))

    logger.info(`Fetched ${videos.length} videos`)
    return videos
  } catch (error) {
    logger.error('Error getting videos:', error)
    throw error
  }
}

export async function getVideoById(videoId) {
  try {
    if (!videoId || typeof videoId !== 'string') {
      throw new Error('Video ID must be a valid string')
    }

    const doc = await adminDb.collection('videos').doc(videoId).get()
    
    if (!doc.exists) {
      throw new Error(`Video ${videoId} not found`)
    }

    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }
  } catch (error) {
    logger.error(`Error getting video ${videoId}:`, error)
    throw error
  }
}

// Storage operations (SERVER-SIDE)
export async function uploadVideoToStorage(videoBuffer, videoId, title) {
  try {
    if (!Buffer.isBuffer(videoBuffer)) {
      throw new Error('Video must be a valid buffer')
    }

    if (!videoId || typeof videoId !== 'string') {
      throw new Error('Video ID must be a valid string')
    }

    if (!title || typeof title !== 'string') {
      throw new Error('Title must be a valid string')
    }

    const bucket = adminStorage.bucket()
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50)
    const fileName = `videos/${videoId}_${sanitizedTitle}.mp4`
    const file = bucket.file(fileName)
    
    logger.info(`Uploading video ${videoId} to storage (${videoBuffer.length} bytes)`)

    await file.save(videoBuffer, {
      contentType: 'video/mp4',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    })
    
    await file.makePublic()
    
    const videoUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`
    logger.info(`Video uploaded: ${videoUrl}`)
    
    return videoUrl
  } catch (error) {
    logger.error('Error uploading video:', error)
    throw error
  }
}

export async function uploadImageToStorage(imageBuffer, videoId, sceneNumber) {
  try {
    if (!Buffer.isBuffer(imageBuffer)) {
      throw new Error('Image must be a valid buffer')
    }

    if (!videoId || typeof videoId !== 'string') {
      throw new Error('Video ID must be a valid string')
    }

    const bucket = adminStorage.bucket()
    const fileName = `images/${videoId}_scene_${sceneNumber}.png`
    const file = bucket.file(fileName)
    
    logger.debug(`Uploading image ${fileName} (${imageBuffer.length} bytes)`)

    await file.save(imageBuffer, {
      contentType: 'image/png',
    })
    
    await file.makePublic()
    
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`
    logger.debug(`Image uploaded: ${imageUrl}`)
    
    return imageUrl
  } catch (error) {
    logger.error('Error uploading image:', error)
    throw error
  }
}

export { adminDb, adminStorage }