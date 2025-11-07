import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export async function GET() {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('companies')
    .select('id, name, subscription_plan, account_status, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ companies: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Require superadmin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if ((profile as any)?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const name = (body?.name || '').toString().trim();
  const subscription_plan = (body?.subscription_plan || 'trial').toString();
  const account_status = (body?.account_status || 'active').toString();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  // Type assertion needed: client is already typed with Database,
  // so explicit generics on .from() conflict. Cast to any to bypass.
  const { data, error } = await (supabase
    .from('companies') as any)
    .insert([
      {
        name,
        subscription_plan,
        account_status,
      } as Database['public']['Tables']['companies']['Insert'],
    ])
    .select('id, name, subscription_plan, account_status, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ company: data });
}


