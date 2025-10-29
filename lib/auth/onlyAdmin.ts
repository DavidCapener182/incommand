import { NextRequest, NextResponse } from 'next/server';
import { getUser } from './session';
import { jsonResponse } from '../responses/json';

export interface AdminGuardResult {
  ok: boolean;
  response?: NextResponse;
  email?: string;
}

function getAllowedAdminEmail(): string {
  return (process.env.ALLOWED_ADMIN_EMAIL || 'david@incommand.uk').toLowerCase();
}

export async function enforceAdmin(request: NextRequest): Promise<AdminGuardResult> {
  const user = await getUser();

  if (!user) {
    return {
      ok: false,
      response: jsonResponse({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  const email = user.email?.toLowerCase();
  if (!email || email !== getAllowedAdminEmail()) {
    return {
      ok: false,
      response: jsonResponse({ message: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true, email };
}

export async function ensureAdmin(request: NextRequest): Promise<string> {
  const result = await enforceAdmin(request);
  if (!result.ok) {
    throw result.response ?? jsonResponse({ message: 'Forbidden' }, { status: 403 });
  }
  return result.email!;
}
