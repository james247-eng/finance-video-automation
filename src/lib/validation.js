export function validateVideoScript(script, title, videoLength) {
  const errors = []

  if (!script || typeof script !== 'string') {
    errors.push('Script must be a non-empty string')
  } else if (script.trim().length < 10) {
    errors.push('Script must be at least 10 characters long')
  } else if (script.trim().length > 10000) {
    errors.push('Script cannot exceed 10000 characters')
  }

  if (!title || typeof title !== 'string') {
    errors.push('Title must be a non-empty string')
  } else if (title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long')
  } else if (title.trim().length > 200) {
    errors.push('Title cannot exceed 200 characters')
  }

  if (!Number.isInteger(videoLength) || videoLength < 30 || videoLength > 900) {
    errors.push('Video length must be between 30 and 900 seconds')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateEnvironmentVariables() {
  const required = [
    'GROQ_API_KEY',
    'ELEVENLABS_API_KEY',
    'HUGGINGFACE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'API_SECRET_KEY'
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

export function validateApiKey(apiKey) {
  return apiKey === process.env.API_SECRET_KEY
}

export function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
    .substring(0, 50)
}
