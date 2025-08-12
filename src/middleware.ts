import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Role cache interface for middleware
interface MiddlewareRoleCache {
  role: string
  timestamp: number
  userId: string
}

// Cache TTL in milliseconds (10 minutes for middleware)
const MIDDLEWARE_ROLE_CACHE_TTL = 10 * 60 * 1000

// Cache key for session storage
const getMiddlewareRoleCacheKey = (userId: string) => `middleware_role_${userId}`

// Standardized error messages that don't expose sensitive information
const ERROR_MESSAGES = {
  AUTHENTICATION_REQUIRED: 'Please log in to access this page',
  SESSION_EXPIRED: 'Your session has expired. Please log in again',
  ACCESS_DENIED: 'You do not have permission to access this page',
  SYSTEM_ERROR: 'A system error occurred. Please try again later',
  PROFILE_NOT_FOUND: 'User profile not found. Please contact support',
} as const

// Helper functions for middleware role caching
const getCachedRoleFromRequest = (req: NextRequest, userId: string): string | null => {
  try {
    // Use cookies for middleware caching since sessionStorage is not available
    const cacheCookie = req.cookies.get(getMiddlewareRoleCacheKey(userId))?.value
    if (!cacheCookie) return null
    
    const cache: MiddlewareRoleCache = JSON.parse(decodeURIComponent(cacheCookie))
    const now = Date.now()
    
    // Check if cache is still valid
    if (now - cache.timestamp < MIDDLEWARE_ROLE_CACHE_TTL && cache.userId === userId) {
      return cache.role
    }
    
    return null
  } catch (error) {
    console.error('Error reading cached role in middleware:', error)
    return null
  }
}

const setCachedRoleInResponse = (res: NextResponse, userId: string, role: string): NextResponse => {
  try {
    const cache: MiddlewareRoleCache = {
      role,
      timestamp: Date.now(),
      userId
    }
    
    // Set cache in response cookies
    res.cookies.set(getMiddlewareRoleCacheKey(userId), encodeURIComponent(JSON.stringify(cache)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: MIDDLEWARE_ROLE_CACHE_TTL / 1000 // Convert to seconds
    })
  } catch (error) {
    console.error('Error caching role in middleware:', error)
  }
  
  return res
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Check if the route is an admin route
  if (req.nextUrl.pathname.startsWith('/admin')) {
    
    try {
      // Get the current session
      let { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Middleware - Session error:', sessionError)
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('error', ERROR_MESSAGES.SYSTEM_ERROR)
        return NextResponse.redirect(loginUrl)
      }
      
      if (!session?.user) {
        // No session, redirect to login
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('error', ERROR_MESSAGES.AUTHENTICATION_REQUIRED)
        return NextResponse.redirect(loginUrl)
      }

      // Check if session is expired and attempt refresh
      if (session.expires_at && session.expires_at * 1000 < Date.now()) {
        console.log('Middleware - Session expired, attempting refresh')
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError || !refreshedSession?.user) {
          console.error('Middleware - Session refresh failed:', refreshError)
          const loginUrl = new URL('/login', req.url)
          loginUrl.searchParams.set('error', ERROR_MESSAGES.SESSION_EXPIRED)
          return NextResponse.redirect(loginUrl)
        }
        
        // Use refreshed session
        session = refreshedSession
      }

      // Check cache first before database query
      const cachedRole = getCachedRoleFromRequest(req, session.user.id)
      if (cachedRole) {
        console.log('Middleware - Using cached role:', cachedRole)
        
        // Check if user has admin or superadmin role
        if (cachedRole !== 'admin' && cachedRole !== 'superadmin') {
          // User doesn't have admin privileges, redirect to login
          const loginUrl = new URL('/login', req.url)
          loginUrl.searchParams.set('error', ERROR_MESSAGES.ACCESS_DENIED)
          return NextResponse.redirect(loginUrl)
        }

        // User has admin privileges, allow access
        return res
      }

      // Cache miss, fetch user role from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      console.log('Middleware - User ID:', session.user.id)
      console.log('Middleware - Profile data:', profile)
      console.log('Middleware - Profile error:', profileError)

      if (profileError) {
        console.error('Middleware - Profile fetch error:', profileError)
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('error', ERROR_MESSAGES.PROFILE_NOT_FOUND)
        return NextResponse.redirect(loginUrl)
      }

      if (!profile) {
        // No profile found, redirect to login
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('error', ERROR_MESSAGES.PROFILE_NOT_FOUND)
        return NextResponse.redirect(loginUrl)
      }

      // Check if user has admin or superadmin role
      console.log('Middleware - User role:', profile.role)
      if (profile.role !== 'admin' && profile.role !== 'superadmin') {
        // User doesn't have admin privileges, redirect to login
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('error', ERROR_MESSAGES.ACCESS_DENIED)
        return NextResponse.redirect(loginUrl)
      }

      // Cache the role for future requests
      setCachedRoleInResponse(res, session.user.id, profile.role)

      // User has admin privileges, allow access
      return res
    } catch (error) {
      console.error('Middleware error:', error)
      // Error occurred, redirect to login
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('error', ERROR_MESSAGES.SYSTEM_ERROR)
      return NextResponse.redirect(loginUrl)
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 