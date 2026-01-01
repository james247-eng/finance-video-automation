// SERVER-SIDE ONLY - Never imported in client components
import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })
}

const adminDb = getFirestore()
const adminStorage = getStorage()

// Database operations (SERVER-SIDE)
export async function createVideo(videoData) {
  try {
    const docRef = await adminDb.collection('videos').add({
      ...videoData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating video:', error)
    throw error
  }
}

export async function updateVideo(videoId, updates) {
  try {
    await adminDb.collection('videos').doc(videoId).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating video:', error)
    throw error
  }
}

export async function getVideos(limitCount = 50) {
  try {
    const snapshot = await adminDb
      .collection('videos')
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get()
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }))
  } catch (error) {
    console.error('Error getting videos:', error)
    throw error
  }
}

// Storage operations (SERVER-SIDE)
export async function uploadVideoToStorage(videoBuffer, videoId, title) {
  try {
    const bucket = adminStorage.bucket()
    const fileName = `videos/${videoId}_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`
    const file = bucket.file(fileName)
    
    await file.save(videoBuffer, {
      contentType: 'video/mp4',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    })
    
    await file.makePublic()
    
    return `https://storage.googleapis.com/${bucket.name}/${fileName}`
  } catch (error) {
    console.error('Error uploading video:', error)
    throw error
  }
}

export async function uploadImageToStorage(imageBuffer, videoId, sceneNumber) {
  try {
    const bucket = adminStorage.bucket()
    const fileName = `images/${videoId}_scene_${sceneNumber}.png`
    const file = bucket.file(fileName)
    
    await file.save(imageBuffer, {
      contentType: 'image/png',
    })
    
    await file.makePublic()
    
    return `https://storage.googleapis.com/${bucket.name}/${fileName}`
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

export { adminDb, adminStorage }