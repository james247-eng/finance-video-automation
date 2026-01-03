// src/lib/firebaseAdmin.js
import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import logger from '@/lib/logger'

// 1. INITIALIZATION LOGIC
const initializeFirebase = () => {
  if (admin.apps.length > 0) return admin.apps[0];

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    logger.warn('Firebase variables missing. Skipping init.');
    return null;
  }

  try {
    const cleanKey = privateKey.replace(/\\n/g, '\n').replace(/^"(.*)"$/, '$1').trim();
    return admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey: cleanKey }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    logger.error('Firebase Init Error:', error.message);
    return null;
  }
}

const app = initializeFirebase();

// 2. EXPORTED HELPER FUNCTIONS
// These are the "Exports" your other files use!
export function getAdminDb() { return app ? getFirestore(app) : null; }
export function getAdminStorage() { return app ? getStorage(app).bucket() : null; }

/**
 * Adds a new video to the 'videos' collection
 */
export async function createVideo(data) {
  try {
    const db = getAdminDb();
    if (!db) throw new Error("Database not initialized");

    const docRef = await db.collection('videos').add({
      ...data,
      status: data.status || 'queued',
      progress: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`Video record created: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    logger.error('createVideo Error:', error);
    throw error;
  }
}

/**
 * Updates status or video links (Used by GitHub Actions later)
 */
export async function updateVideo(videoId, data) {
  try {
    const db = getAdminDb();
    if (!db) return false;
    await db.collection('videos').doc(videoId).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    logger.error('updateVideo Error:', error);
    return false;
  }
}

/**
 * Fetches the list of videos for your dashboard
 */
export async function getVideos(limitCount = 50) {
  try {
    const db = getAdminDb();
    if (!db) return [];
    const snapshot = await db.collection('videos').orderBy('createdAt', 'desc').limit(limitCount).get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || null,
    }));
  } catch (error) {
    logger.error('getVideos Error:', error);
    return [];
  }
}

// Compatibility constants
export const adminDb = getAdminDb();
export const adminStorage = getAdminStorage();