import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Create a response object
  const res = NextResponse.next()

  // Always allow access to the login page
  if (req.nextUrl.pathname === '/login') {
    return res
  }

  // Bypass authentication for all other routes
  return res
}

// Configure which paths to run middleware on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 