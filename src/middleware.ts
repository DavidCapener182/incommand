import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Standardized error messages that don't expose sensitive information
const ERROR_MESSAGES = {
  AUTHENTICATION_REQUIRED: 'Please log in to access this page',
  SESSION_EXPIRED: 'Your session has expired. Please log in again',
  ACCESS_DENIED: 'You do not have permission to access this page',
  SYSTEM_ERROR: 'A system error occurred. Please try again later',
  PROFILE_NOT_FOUND: 'User profile not found. Please contact support',
} as const

/**
 * Apply comprehensive security headers to all responses
 */
function applySecurityHeaders(res: NextResponse) {
  // Core security headers
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.supabase.co https://vercel.live",
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.anthropic.com wss://*.supabase.co",
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
  res.headers.set('Content-Security-Policy', csp)
  
  // Additional security headers
  res.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Apply security headers to all responses
  applySecurityHeaders(res)
  
  const supabase = createMiddlewareClient({ req, res })

  const { pathname } = req.nextUrl

  // Define public routes (anyone can access)
  const publicRoutes = [
    "/", 
    "/features", 
    "/pricing", 
    "/about", 
    "/updates",
    "/help",
    "/privacy",
    "/terms",
    "/login",
    "/signup",
    "/invite",
    "/induction"
  ]

  // Define auth callback routes that need special handling
  const authCallbackRoutes = [
    "/auth/magic-link"
  ]

  // Define callback routes that should be allowed even without full authentication
  const callbackRoutes = [
    "/api/auth/invite-callback"
  ]

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  
  // Check if the route is a callback route
  const isCallbackRoute = callbackRoutes.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  
  // Check if the route is an auth callback route
  const isAuthCallbackRoute = authCallbackRoutes.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // Check if this is a magic link authentication (has access_token in URL)
  const hasAccessToken = req.nextUrl.hash.includes('access_token=') || req.nextUrl.searchParams.has('access_token')

  if (isPublicRoute || isCallbackRoute || isAuthCallbackRoute) {
    // Special handling for callback routes - allow them to proceed without authentication checks
    if (isCallbackRoute || isAuthCallbackRoute) {
      return res
    }
    
    // Special handling for magic link authentication
    if (hasAccessToken) {
      // Allow magic link authentication to proceed without middleware interference
      return res
    }
    
    // Get session for redirect logic
    const { data: { session } } = await supabase.auth.getSession()
    
    // If user is logged in and visiting login or signup, redirect to incidents
    // But allow them to stay on the landing page and other marketing pages
    if (session && ["/login", "/signup"].includes(pathname)) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/incidents"
      return NextResponse.redirect(redirectUrl)
    }
    
    return res
  }

  // For protected pages, require authentication
  let { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    // Check if this is a magic link authentication attempt
    if (hasAccessToken) {
      // Allow magic link authentication to proceed
      return res
    }
    
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("redirectedFrom", pathname)
    redirectUrl.searchParams.set("message", "Please sign in to continue")
    return NextResponse.redirect(redirectUrl)
  }

  // Check if the route is an admin route
  if (pathname.startsWith('/admin')) {
    const maxRetries = 3
    let retryCount = 0
    
    while (retryCount < maxRetries) {
      try {
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

        // Fetch user role from profiles table (no caching)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        // Log minimal information for debugging without exposing sensitive data
        console.log('Middleware - User authentication check completed')
        if (profileError) {
          console.log('Middleware - Profile fetch error occurred')
        }

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
        console.log('Middleware - Role verification completed')
        if (profile.role !== 'admin' && profile.role !== 'superadmin') {
          // User doesn't have admin privileges, redirect to login
          const loginUrl = new URL('/login', req.url)
          loginUrl.searchParams.set('error', ERROR_MESSAGES.ACCESS_DENIED)
          return NextResponse.redirect(loginUrl)
        }

        // User has admin privileges, allow access
        return res
        
      } catch (error) {
        console.error(`Middleware authentication error (attempt ${retryCount + 1}):`, error instanceof Error ? error.message : 'Unknown error')
        retryCount++
        
        if (retryCount >= maxRetries) {
          // Final attempt failed, redirect to login
          const loginUrl = new URL('/login', req.url)
          loginUrl.searchParams.set('error', ERROR_MESSAGES.SYSTEM_ERROR)
          return NextResponse.redirect(loginUrl)
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000)
        console.log(`Middleware retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    // Fallback return statement after while loop to prevent infinite loops
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('error', ERROR_MESSAGES.SYSTEM_ERROR)
    return NextResponse.redirect(loginUrl)
  }

  return res
}

export const config = {
  matcher: [
    // Protected application routes
    "/incidents/:path*",
    "/reports/:path*",
    "/staff/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/analytics/:path*",
    "/profile/:path*"
  ],
}
