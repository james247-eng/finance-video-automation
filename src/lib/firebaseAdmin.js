import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import logger from '@/lib/logger'

const initializeFirebase = () => {
  if (admin.apps.length > 0) return admin.apps[0];

  // We only need this ONE variable now!
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountRaw) {
    logger.warn('FIREBASE_SERVICE_ACCOUNT missing from environment.');
    return null;
  }

  try {
    // 1. Parse the string into a real JSON object
    const serviceAccount = JSON.parse(serviceAccountRaw);

    // 2. Surgical fix for the private key specifically (standard protocol)
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    logger.error('Firebase JSON Parse Error:', error.message);
    return null;
  }
}

const app = initializeFirebase();

// --- EXPORTED FUNCTIONS ---
// These names match exactly what your routes expect, so nothing breaks.

export function getAdminDb() { return app ? getFirestore(app) : null; }

export async function createVideo(data) {
  const db = getAdminDb();
  if (!db) throw new Error("Firebase not ready. Check your JSON in Vercel.");
  
  const docRef = await db.collection('videos').add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return docRef.id;
}

export async function getVideos(limitCount = 50) {
  const db = getAdminDb();
  if (!db) return [];
  const snapshot = await db.collection('videos').orderBy('createdAt', 'desc').limit(limitCount).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}