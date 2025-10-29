import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse } from '@/lib/responses/json';
import { getServerClient } from '@/lib/supabase/server';
import { ensureAdmin } from '@/lib/auth/onlyAdmin';
import { checkRateLimit } from '@/lib/security/rateLimit';

export interface HandlerContext {
  request: NextRequest;
  supabase: ReturnType<typeof getServerClient>;
  adminEmail: string;
}

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export function getPagination(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const result = paginationSchema.safeParse(params);
  if (!result.success) {
    return { page: 1, pageSize: 20 };
  }
  const { page, pageSize } = result.data;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { page, pageSize, from, to };
}

export async function createHandlerContext(request: NextRequest): Promise<HandlerContext> {
  const rateLimitResult = checkRateLimit(request, { limit: 120, interval: 60_000 });
  if (!rateLimitResult.ok) {
    throw rateLimitResult.response;
  }

  const adminEmail = await ensureAdmin(request);
  const supabase = getServerClient();
  return { request, supabase, adminEmail };
}

export function handleError(error: unknown) {
  if (error instanceof Response) {
    return error;
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  return jsonResponse({ message }, { status: 500 });
}
