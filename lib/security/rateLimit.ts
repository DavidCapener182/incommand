import { NextRequest } from 'next/server';
import { jsonResponse } from '../responses/json';

interface RateLimitOptions {
  limit?: number;
  interval?: number; // milliseconds
}

interface RateLimitState {
  count: number;
  expiresAt: number;
}

const DEFAULT_LIMIT = 60;
const DEFAULT_INTERVAL = 60_000;
const store = new Map<string, RateLimitState>();

function getKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? forwarded;
  }
  const ip = (request as unknown as { ip?: string }).ip;
  return ip ?? request.headers.get('cf-connecting-ip') ?? 'unknown';
}

export function checkRateLimit(request: NextRequest, options: RateLimitOptions = {}) {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const interval = options.interval ?? DEFAULT_INTERVAL;
  const key = getKey(request);
  const now = Date.now();

  const state = store.get(key);
  if (!state || state.expiresAt < now) {
    store.set(key, { count: 1, expiresAt: now + interval });
    return { ok: true } as const;
  }

  if (state.count >= limit) {
    return {
      ok: false,
      response: jsonResponse({ message: 'Too Many Requests' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((state.expiresAt - now) / 1000)) },
      }),
    } as const;
  }

  state.count += 1;
  return { ok: true } as const;
}
