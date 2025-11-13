import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export async function getSession(): Promise<Session | null> {
  const client = createRouteHandlerClient<Database>({ cookies });
  const {
    data: { session },
  } = await client.auth.getSession();
  return session ?? null;
}

export async function getUser(): Promise<User | null> {
  const client = createRouteHandlerClient<Database>({ cookies });
  const {
    data: { user },
  } = await client.auth.getUser();
  return user ?? null;
}
