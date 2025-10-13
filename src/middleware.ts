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

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // TEMP: bypass auth checks for green guide tools while we stabilize the route
  if (req.nextUrl.pathname.startsWith('/admin/green-guide')) {
    return res
  }

  // Check if the route is an admin route
  if (req.nextUrl.pathname.startsWith('/admin')) {
    
    const maxRetries = 3
    let retryCount = 0
    
    while (retryCount < maxRetries) {
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