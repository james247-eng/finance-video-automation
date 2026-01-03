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

  // Next.js 15 checks this file during build. If variables are missing, we skip init.
  if (!projectId || !clientEmail || !privateKey) {
    logger.warn('Firebase environment variables are missing. Skipping initialization during build phase.');
    return null;
  }

  try {
    /**
     * FIX: Surgical cleaning of the Private Key.
     * 1. Replaces literal '\n' with actual newlines.
     * 2. Removes accidental outer quotes added by environment managers.
     * 3. Trims whitespace that causes "Invalid Key" errors.
     */
    const cleanKey = privateKey
      .replace(/\\n/g, '\n')
      .replace(/^"(.*)"$/, '$1')
      .trim();

    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: cleanKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
    
    logger.info('Firebase Admin initialized successfully');
    return app;
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin:', error.message);
    return null;
  }
}

// Initialize the app safely
const app = initializeFirebase();

let cachedDb = null;
let cachedStorage = null;

// Helper to get DB instance safely
export function getAdminDb() {
  if (!cachedDb && app) {
    cachedDb = getFirestore(app);
  }
  return cachedDb;
}

// Helper to get Storage instance safely
export function getAdminStorage() {
  if (!cachedStorage && app) {
    cachedStorage = getStorage(app);
  }
  return cachedStorage;
}

// Direct exports for route compatibility
export const adminDb = getAdminDb();
export const adminStorage = getAdminStorage();

// --- DATABASE OPERATIONS ---

export async function getVideos(limitCount = 50) {
  try {
    const db = getAdminDb();
    if (!db) return []; // Graceful fallback if DB isn't ready

    const snapshot = await db
      .collection('videos')
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get()
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString() || null,
    }));
  } catch (error) {
    logger.error('Error getting videos:', error);
    return []; // Return empty instead of crashing
  }
}

// ... include your createVideo, updateVideo, and upload functions below