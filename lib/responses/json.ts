import { NextResponse } from 'next/server';

type JsonBody = Record<string, unknown> | Array<unknown> | null;

interface JsonResponseInit extends ResponseInit {
  headers?: HeadersInit;
}

export function jsonResponse(body: JsonBody, init: JsonResponseInit = {}): NextResponse {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return new NextResponse(body ? JSON.stringify(body) : null, {
    ...init,
    headers,
  });
}
