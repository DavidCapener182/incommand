// @ts-nocheck
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

// Standardized error messages that don't expose sensitive information
const ERROR_MESSAGES = {
  AUTHENTICATION_REQUIRED: 'Please log in to access this page',
  SESSION_EXPIRED: 'Your session has expired. Please log in again',
  ACCESS_DENIED: 'You do not have permission to access this page',
  SYSTEM_ERROR: 'A system error occurred. Please try again later',
  PROFILE_NOT_FOUND: 'User profile not found. Please contact support',
} as const

/**
 * Apply comprehensive security and performance headers to all responses
 */
function applySecurityHeaders(res: NextResponse) {
  // Core security headers
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Performance headers - compression hints
  // Note: Actual compression is handled by the server/CDN, but we set Accept-Encoding hints
  res.headers.set('Accept-Encoding', 'gzip, deflate, br')
  
  // Content Security Policy - relaxed for Next.js development
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com https://vercel.live https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
    "img-src 'self' data: blob: https://*.supabase.co https://vercel.live",
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.anthropic.com wss://*.supabase.co ws://localhost:* https://va.vercel-scripts.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "worker-src 'self' blob:",
    "child-src 'self' blob:"
  ].join('; ')
  res.headers.set('Content-Security-Policy', csp)
  
  // Additional security headers - relaxed for development compatibility
  // Only apply COEP in production to avoid blocking Next.js scripts
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  }
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
}

export async function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl
    
    // Redirect /next/ paths to /_next/ paths (fix for incorrect HTML generation)
    if (pathname.startsWith('/next/')) {
      const newUrl = req.nextUrl.clone()
      newUrl.pathname = pathname.replace('/next/', '/_next/')
      return NextResponse.rewrite(newUrl)
    }
    
    // Skip middleware for static assets and Next.js internal files - MUST be first check
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/next/') ||
      pathname.startsWith('/_vercel/') ||
      pathname.startsWith('/vercel/') ||
      pathname.startsWith('/static/') ||
      pathname.startsWith('/api/') ||
      pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot|css|js|json|map)$/)
    ) {
      // Return immediately without any processing
      return NextResponse.next()
    }
    
    const res = NextResponse.next()
    
    // Apply security headers to all responses
    applySecurityHeaders(res)
    
    const supabase = createMiddlewareClient<Database>({ req, res })

  // Define public routes (anyone can access)
  const publicRoutes = [
    "/", 
    "/features", 
    "/pricing", 
    "/about", 
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
    
    // For public routes, only check session if we need to redirect logged-in users
    // Skip session check for most public routes to avoid errors and rate limits
    // Only check session for login/signup if we have cookies (indicates potential session)
    if (["/login", "/signup"].includes(pathname)) {
      // Only check session if cookies are present to avoid unnecessary auth API calls
      // Check for Supabase auth cookies (format: sb-<project-ref>-auth-token)
      const cookieHeader = req.headers.get('cookie') || ''
      const hasAuthCookies = cookieHeader.includes('sb-') && (cookieHeader.includes('access-token') || cookieHeader.includes('auth-token'))
      
      if (hasAuthCookies) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          
          // If session check fails due to rate limit, allow route to proceed
          if (error && (error.message?.toLowerCase().includes('rate limit') || error.message?.toLowerCase().includes('too many requests'))) {
            console.warn('Middleware - Rate limit hit on session check, allowing route to proceed')
            return res
          }
          
          // If user is logged in and visiting login or signup, redirect based on role
          if (session) {
            const redirectUrl = req.nextUrl.clone()
            
            // Check if this is david@incommand.uk (superadmin) - redirect to admin
            if (session.user.email === 'david@incommand.uk') {
              redirectUrl.pathname = "/admin"
            } else {
              redirectUrl.pathname = "/incidents"
            }
            
            return NextResponse.redirect(redirectUrl)
          }
        } catch (error) {
          // If session check fails, just allow the route to proceed
          console.error('Middleware - Session check failed for public route:', error)
        }
      }
    }
    
    return res
  }

  // For protected pages, require authentication
  // Only check session if cookies are present to avoid unnecessary auth API calls
  // Check for Supabase auth cookies (format: sb-<project-ref>-auth-token)
  const cookieHeader = req.headers.get('cookie') || ''
  const hasAuthCookies = cookieHeader.includes('sb-') && (cookieHeader.includes('access-token') || cookieHeader.includes('auth-token'))
  
  let session = null
  if (hasAuthCookies) {
    try {
      const { data: { session: sessionData }, error } = await supabase.auth.getSession()
      
      // If rate limited, allow access but log warning (better than blocking users)
      if (error && (error.message?.toLowerCase().includes('rate limit') || error.message?.toLowerCase().includes('too many requests'))) {
        console.warn('Middleware - Rate limit hit on session check for protected route, allowing access')
        // Try to get session from JWT in cookie directly as fallback
        // For now, we'll allow the request through - the page will handle auth
        return res
      }
      
      session = sessionData
    } catch (error) {
      // If session check fails, check if it's a rate limit error
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('too many requests')) {
        console.warn('Middleware - Rate limit error, allowing request to proceed')
        // Allow request to proceed - the page component will handle auth
        return res
      }
      console.error('Middleware - Session check error:', error)
    }
  }
  
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

  // Special handling for david@incommand.uk - redirect to admin pages
  if (session.user.email === 'david@incommand.uk' && (pathname === '/' || pathname === '/dashboard' || pathname.startsWith('/dashboard/'))) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/admin"
    return NextResponse.redirect(redirectUrl)
  }

  // Check if the route is a back office admin route (restricted to david@incommand.uk)
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
          .from<Database['public']['Tables']['profiles']['Row'], Database['public']['Tables']['profiles']['Update']>('profiles')
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

        // Restrict back office access to specific email only (company admins use /settings)
        const allowedBackOfficeEmail = 'david@incommand.uk'
        if (session.user.email !== allowedBackOfficeEmail) {
          console.log('Middleware - Back office access denied - unauthorized email:', session.user.email)
          const loginUrl = new URL('/login', req.url)
          loginUrl.searchParams.set('error', 'Access denied. Back office access is restricted to system administrators.')
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
  } catch (error) {
    // If middleware fails, log error but don't block the request
    console.error('Middleware error:', error instanceof Error ? error.message : 'Unknown error')
    // Return a basic response to prevent 500 errors
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - API routes (CRITICAL: must be excluded to prevent auth spam)
     * - Static files with extensions
     * - Favicon
     * - Next.js internal paths
     * Note: We need to match /next/ paths to rewrite them to /_next/
     */
    '/((?!api|_next|_vercel|vercel|static|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|map|json)).*)',
    // Explicitly include /next/ paths so we can rewrite them
    '/next/:path*',
  ],
}
