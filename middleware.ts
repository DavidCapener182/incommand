import { NextRequest, NextResponse } from 'next/server';
import { enforceAdmin } from './lib/auth/onlyAdmin';
import { checkRateLimit } from './lib/security/rateLimit';

const ADMIN_PATH_PREFIX = '/api/admin';

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith(ADMIN_PATH_PREFIX)) {
    return NextResponse.next();
  }

  const rateLimitResult = checkRateLimit(request, { limit: 120, interval: 60_000 });
  if (!rateLimitResult.ok) {
    return rateLimitResult.response;
  }

  const authResult = await enforceAdmin(request);
  if (!authResult.ok && authResult.response) {
    return authResult.response;
  }

  const response = NextResponse.next();
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const origin = request.headers.get('origin');
  if (!origin || origin === request.nextUrl.origin || allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin ?? request.nextUrl.origin);
  }
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: ['/api/admin/:path*'],
};
