import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse } from '../responses/json';

export async function parseJson<T extends z.ZodTypeAny>(request: NextRequest, schema: T) {
  const body = await request.json().catch(() => {
    throw jsonResponse({ message: 'Invalid JSON payload' }, { status: 400 });
  });

  const result = schema.safeParse(body);
  if (!result.success) {
    throw jsonResponse({
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    }, { status: 422 });
  }

  return result.data;
}

export function parseSearchParams<T extends z.ZodRawShape>(request: NextRequest, shape: T) {
  const schema = z.object(shape).partial();
  const entries: Record<string, string> = {};
  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    entries[key] = value;
  }

  const result = schema.safeParse(entries);
  if (!result.success) {
    throw jsonResponse({
      message: 'Invalid query parameters',
      errors: result.error.flatten().fieldErrors,
    }, { status: 422 });
  }

  return result.data as z.infer<typeof schema>;
}
