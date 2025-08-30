import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

// Initialize Redis client with fallback for development
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'http://localhost:6379',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'dev-token',
})

// Create different rate limiters for different endpoints
const rateLimiters = {
  // General API rate limiter
  general: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
    prefix: 'ratelimit:general',
  }),
  
  // Authentication endpoints
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '5 m'), // 5 requests per 5 minutes
    analytics: true,
    prefix: 'ratelimit:auth',
  }),
  
  // AI/ML endpoints (more expensive)
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 requests per minute
    analytics: true,
    prefix: 'ratelimit:ai',
  }),
  
  // Social media endpoints
  social: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute
    analytics: true,
    prefix: 'ratelimit:social',
  }),
  
  // File upload endpoints
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    analytics: true,
    prefix: 'ratelimit:upload',
  }),
}

// Get client identifier (IP address or user ID)
function getClientIdentifier(req: NextRequest): string {
  // Try to get user ID from auth header or session
  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    // Extract user ID from JWT or other auth token
    try {
      // This is a simplified example - you should properly decode your JWT
      const token = authHeader.replace('Bearer ', '')
      // For now, use a hash of the token as identifier
      return `user:${Buffer.from(token).toString('base64').slice(0, 16)}`
    } catch (error) {
      logger.warn('Failed to extract user ID from auth header', { component: 'RateLimit', action: 'getClientIdentifier' })
    }
  }
  
  // Fallback to IP address
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown'
  return `ip:${ip}`
}

// Rate limiting middleware
export async function rateLimit(
  req: NextRequest,
  type: keyof typeof rateLimiters = 'general'
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  try {
    // Check if Redis is properly configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      logger.warn('Redis not configured, skipping rate limiting', {
        component: 'RateLimit',
        action: 'rateLimit',
        type
      })
      // Return success to allow requests when Redis is not configured
      return {
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000
      }
    }

    const identifier = getClientIdentifier(req)
    const limiter = rateLimiters[type]
    
    const result = await limiter.limit(identifier)
    
    logger.debug('Rate limit check', {
      component: 'RateLimit',
      action: 'rateLimit',
      type,
      identifier: identifier.slice(0, 10) + '...', // Log partial identifier for privacy
      success: result.success,
      remaining: result.remaining,
      limit: result.limit,
      reset: result.reset
    })
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset
    }
  } catch (error) {
    logger.error('Rate limiting error', error, { component: 'RateLimit', action: 'rateLimit', type })
    // On error, allow the request but log it
    return {
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000
    }
  }
}

// Helper function to create rate-limited API handler
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  type: keyof typeof rateLimiters = 'general'
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rateLimitResult = await rateLimit(req, type)
    
    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded', {
        component: 'RateLimit',
        action: 'withRateLimit',
        type,
        identifier: getClientIdentifier(req).slice(0, 10) + '...'
      })
      
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
          }
        }
      )
    }
    
    // Add rate limit headers to successful responses
    const response = await handler(req)
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())
    
    return response
  }
}

// Export rate limiters for direct use
export { rateLimiters }
