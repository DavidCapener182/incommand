import { NextRequest, NextResponse } from 'next/server'
import { createRlsServerClient } from './supabaseServer'
import { logger } from './logger'

/**
 * Secure API route handler that enforces authentication and RLS
 */
export async function secureApiHandler(
  request: NextRequest,
  handler: (supabase: any, user: any, request: NextRequest) => Promise<NextResponse>
) {
  try {
    // Create RLS-enabled Supabase client
    const supabase = createRlsServerClient(request.headers)
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      logger.error('Session error in API route', sessionError)
      return NextResponse.json(
        { error: 'Authentication failed' }, 
        { status: 401 }
      )
    }
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' }, 
        { status: 401 }
      )
    }
    
    // Verify user still exists and is active
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, status')
      .eq('id', session.user.id)
      .single()
    
    if (profileError || !profile) {
      logger.error('Profile not found for user', { userId: session.user.id, error: profileError })
      return NextResponse.json(
        { error: 'User profile not found' }, 
        { status: 401 }
      )
    }
    
    if (profile && 'status' in profile && profile.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is not active' }, 
        { status: 403 }
      )
    }
    
    // Execute the handler with authenticated context
    return await handler(supabase, { ...session.user, profile }, request)
    
  } catch (error) {
    logger.error('API security error', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

/**
 * Admin-only API route handler
 */
export async function adminApiHandler(
  request: NextRequest,
  handler: (supabase: any, user: any, request: NextRequest) => Promise<NextResponse>
) {
  return secureApiHandler(request, async (supabase, user, request) => {
    // Check if user has admin privileges
    if (!['admin', 'superadmin'].includes(user.profile.role)) {
      return NextResponse.json(
        { error: 'Admin access required' }, 
        { status: 403 }
      )
    }
    
    return await handler(supabase, user, request)
  })
}

/**
 * Sanitize data for logging to prevent sensitive information exposure
 */
export function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }
  
  const sensitiveKeys = [
    'password', 'token', 'key', 'secret', 'auth', 'session',
    'supabase_key', 'service_role_key', 'anon_key', 'jwt',
    'access_token', 'refresh_token', 'authorization'
  ]
  
  const sanitized = { ...data }
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key])
    }
  }
  
  return sanitized
}

/**
 * Validate request body and sanitize input
 */
export function validateRequestBody<T>(body: any, schema?: any): T {
  if (!body) {
    throw new Error('Request body is required')
  }
  
  // Basic XSS protection - remove script tags and dangerous content
  const sanitized = JSON.parse(JSON.stringify(body).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''))
  
  if (schema) {
    const result = schema.safeParse(sanitized)
    if (!result.success) {
      throw new Error(`Invalid request data: ${result.error.errors.map((e: any) => e.message).join(', ')}`)
    }
    return result.data
  }
  
  return sanitized
}
