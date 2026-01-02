// SERVER-SIDE ONLY - Never imported in client components
import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import logger from '@/lib/logger'

// 1. Lazy Initialization Helper
const initializeFirebase = () => {
  // Check if already initialized
  if (admin.apps.length > 0) return admin.apps[0];

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Next.js 15 checks this file during build. If variables are missing, 
  // we skip init to prevent the "project_id" crash.
  if (!projectId || !clientEmail || !privateKey) {
    logger.warn('Firebase environment variables are missing. Skipping initialization during build phase.');
    return null;
  }

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        // The replace() is critical for Vercel to handle newlines correctly
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
    logger.info('Firebase Admin initialized successfully');
    return app;
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin:', error);
    return null;
  }
}

// Initialize the app
const app = initializeFirebase();

/**
 * 2. CRITICAL FIX: We use a Getter function or a check for the DB.
 * If we just do 'export const adminDb = getFirestore()', it will crash 
 * during the build because the 'app' doesn't exist yet.
 */
let cachedDb = null;
let cachedStorage = null;

export function getAdminDb() {
  if (!cachedDb && app) {
    cachedDb = getFirestore(app);
  }
  return cachedDb;
}

export function getAdminStorage() {
  if (!cachedStorage && app) {
    cachedStorage = getStorage(app);
  }
  return cachedStorage;
}

// For backward compatibility with direct imports
export const adminDb = getAdminDb();
export const adminStorage = getAdminStorage();

// --- DATABASE OPERATIONS ---

export async function createVideo(videoData) {
  try {
    const db = getAdminDb();
    if (!db) throw new Error('Firebase Admin DB not initialized - Check environment variables');
    if (!videoData || typeof videoData !== 'object') {
      throw new Error('Video data must be a valid object')
    }

    logger.info(`Creating video: "${videoData.title}"`)

    const docRef = await db.collection('videos').add({
      ...videoData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: videoData.status || 'pending',
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
    const db = getAdminDb();
    if (!db) throw new Error('Firebase Admin DB not initialized');
    
    await db.collection('videos').doc(videoId).update({
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
    const db = getAdminDb();
    if (!db) return []; // Return empty array if DB isn't ready (like during build)

    const snapshot = await db
      .collection('videos')
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get()
    
    const videos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString() || null,
    }))

    return videos
  } catch (error) {
    logger.error('Error getting videos:', error)
    throw error
  }
}

export async function getVideoById(videoId) {
  trconst db = getAdminDb();
    if (!db) throw new Error('Firebase Admin DB not initialized');
    const doc = await dError('Firebase Admin DB not initialized');
    const doc = await adminDb.collection('videos').doc(videoId).get()
    
    if (!doc.exists) throw new Error(`Video ${videoId} not found`);

    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString() || null,
    }
  } catch (error) {
    logger.error(`Error getting video ${videoId}:`, error)
    throw error
  }
}

// --- STORAGE OPERATIONS ---

export async function uploadVideoToStorage(videoBuffer, videoId, title) {
  trconst storage = getAdminStorage();
    if (!storage) throw new Error('Firebase Admin Storage not initialized');
    
    const bucket = s
    const bucket = adminStorage.bucket()
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50)
    const fileName = `videos/${videoId}_${sanitizedTitle}.mp4`
    const file = bucket.file(fileName)
    
    await file.save(videoBuffer, {
      contentType: 'video/mp4',
      metadata: { cacheControl: 'public, max-age=31536000' },
    })
    
    await file.makePublic()
    return `https://storage.googleapis.com/${bucket.name}/${fileName}`
  } catch (error) {
    logger.error('Error uploading video:', error)
    throw error
  }
}

expoconst storage = getAdminStorage();
    if (!storage) throw new Error('Firebase Admin Storage not initialized');
    const bucket = s
    if (!adminStorage) throw new Error('Firebase Admin Storage not initialized');
    const bucket = adminStorage.bucket()
    const fileName = `images/${videoId}_scene_${sceneNumber}.png`
    const file = bucket.file(fileName)
    
    await file.save(imageBuffer, { contentType: 'image/png' })
    await file.makePublic()
    
    return `https://storage.googleapis.com/${bucket.name}/${fileName}`
  } catch (error) {
    logger.error('Error uploading image:', error)
    throw error
  }
}