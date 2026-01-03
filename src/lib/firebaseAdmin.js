// src/lib/firebaseAdmin.js
import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import logger from '@/lib/logger'

/**
 * FINAL INITIALIZATION LOGIC
 * Designed to prevent "16 UNAUTHENTICATED" errors by strictly 
 * formatting the Private Key for Google OAuth2.
 */
const initializeFirebase = () => {
  if (admin.apps.length > 0) return admin.apps[0];

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    logger.warn('Firebase environment variables are missing.');
    return null;
  }

  try {
    // Aggressive cleaning to fix OAuth2 credential issues
    const cleanKey = privateKey
      .replace(/\\n/g, '\n')           // Fixes escaped newlines
      .replace(/^"(.*)"$/, '$1')      // Removes outer quotes
      .replace(/"""/g, '"')           // Fixes triple quotes
      .trim();

    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: cleanKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    logger.error('Firebase Admin Initialization Failed:', error.message);
    return null;
  }
}

const app = initializeFirebase();

// --- EXPORTED DATABASE FUNCTIONS ---

export function getAdminDb() {
  return app ? getFirestore(app) : null;
}

export async function createVideo(data) {
  try {
    const db = getAdminDb();
    if (!db) throw new Error("Database not initialized - Check Private Key format");

    const docRef = await db.collection('videos').add({
      ...data,
      status: data.status || 'queued',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`Successfully created video in Firebase: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    logger.error('Firestore createVideo failed:', error.message);
    throw error; // Let the route handle the error message
  }
}

// Keeping these for dashboard compatibility
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
    return [];
  }
}

// Named exports to ensure no "not a function" conflicts
export const adminDb = getAdminDb();