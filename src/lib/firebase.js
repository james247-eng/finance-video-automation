import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, addDoc, updateDoc, doc, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
let app
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

const db = getFirestore(app)
const storage = getStorage(app)

// Database operations
export const createVideo = async (videoData) => {
  try {
    const docRef = await addDoc(collection(db, 'videos'), {
      ...videoData,
      createdAt: new Date().toISOString(),
      status: 'pending',
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating video:', error)
    throw error
  }
}

export const updateVideo = async (videoId, updates) => {
  try {
    const videoRef = doc(db, 'videos', videoId)
    await updateDoc(videoRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error updating video:', error)
    throw error
  }
}

export const getVideos = async (limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'videos'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error getting videos:', error)
    throw error
  }
}

// Storage operations
export const uploadVideoToStorage = async (videoBuffer, videoId, title) => {
  try {
    const fileName = `${videoId}_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`
    const storageRef = ref(storage, `videos/${fileName}`)
    
    await uploadBytes(storageRef, videoBuffer, {
      contentType: 'video/mp4'
    })
    
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  } catch (error) {
    console.error('Error uploading video:', error)
    throw error
  }
}

export const uploadImageToStorage = async (imageBuffer, videoId, sceneNumber) => {
  try {
    const fileName = `${videoId}_scene_${sceneNumber}.png`
    const storageRef = ref(storage, `images/${fileName}`)
    
    await uploadBytes(storageRef, imageBuffer, {
      contentType: 'image/png'
    })
    
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

export { db, storage }