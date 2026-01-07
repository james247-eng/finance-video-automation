import { NextResponse } from 'next/server'
import logger from '@/lib/logger'

// Simple rate limiting using in-memory store (for development)
// For production, use Redis
const requestCounts = new Map()

function getClientId(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'
}

export function rateLimit(limit = 10, windowMs = 3600000) {
  return (handler) => {
    return async (request) => {
      const clientId = getClientId(request)
      const now = Date.now()
      const windowStart = now - windowMs

      if (!requestCounts.has(clientId)) {
        requestCounts.set(clientId, [])
      }

      const timestamps = requestCounts.get(clientId)
      const recentRequests = timestamps.filter(ts => ts > windowStart)

      if (recentRequests.length >= limit) {
        logger.warn(`Rate limit exceeded for client ${clientId}`)
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        )
      }

      recentRequests.push(now)
      requestCounts.set(clientId, recentRequests)

      return handler(request)
    }
  }
}

export function requireApiKey(handler) {
  return async (request) => {
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
      logger.warn('Invalid API key attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return handler(request)
  }
}

export function withErrorHandling(handler) {
  return async (request) => {
    try {
      return await handler(request)
    } catch (error) {
      logger.error('API error:', error)

      // Don't expose internal errors to client
      const status = error.statusCode || 500
      const message = process.env.NODE_ENV === 'development'
        ? error.message
        : 'An error occurred processing your request'

      return NextResponse.json(
        { error: message },
        { status }
      )
    }
  }
}

// Combine all middleware
export function withMiddleware(handler, options = {}) {
  const {
    requireAuth = true,
    rateLimit: rateLimitOpts = { limit: 10, windowMs: 3600000 },
    errorHandling = true
  } = options

  let wrapped = handler

  if (errorHandling) {
    wrapped = withErrorHandling(wrapped)
  }

  if (requireAuth) {
    wrapped = requireApiKey(wrapped)
  }

  if (rateLimitOpts) {
    wrapped = rateLimit(rateLimitOpts.limit, rateLimitOpts.windowMs)(wrapped)
  }

  return wrapped
}
