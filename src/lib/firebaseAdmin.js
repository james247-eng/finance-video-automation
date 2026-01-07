import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { v2 as cloudinary } from 'cloudinary';

// 1. Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Initialize Firebase (for Firestore Database only)
if (!admin.apps.length) {
  const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!base64Key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is missing');
  }
  const serviceAccount = JSON.parse(Buffer.from(base64Key, 'base64').toString('utf-8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
    // Removed storageBucket as we are using Cloudinary
  });
}

const adminDb = getFirestore();

export async function createVideo(data) {
  try {
    const docRef = await adminDb.collection('videos').add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Firebase createVideo Error:", error);
    throw error;
  }
}

export async function updateVideo(videoId, updates) {
  try {
    await adminDb.collection('videos').doc(videoId).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Updated video ${videoId} in Firestore`);
  } catch (error) {
    console.error(`Failed to update video ${videoId}:`, error);
    throw error;
  }
}

/**
 * Uploads a Buffer to Cloudinary
 */
const uploadToCloudinary = (buffer, folder, fileName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: fileName.split('.')[0], // Cloudinary uses public_id without extension
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

export async function uploadVideoToStorage(videoBuffer, videoId, title) {
  try {
    console.log(`Uploading video to Cloudinary: ${videoId}`);
    const publicUrl = await uploadToCloudinary(videoBuffer, 'videos', videoId);
    return publicUrl;
  } catch (error) {
    console.error('Cloudinary Video Upload Error:', error);
    throw error;
  }
}

export async function uploadImageToStorage(imageBuffer, videoId, sceneIndex) {
  try {
    const folder = `images/${videoId}`;
    const fileName = `scene_${sceneIndex}`;
    const publicUrl = await uploadToCloudinary(imageBuffer, folder, fileName);
    return publicUrl;
  } catch (error) {
    console.error('Cloudinary Image Upload Error:', error);
    throw error;
  }
}

export { adminDb };