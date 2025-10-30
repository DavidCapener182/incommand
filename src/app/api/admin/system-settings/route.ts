import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const form = await req.formData()
  const maintenanceMode = form.get('maintenance_mode') === 'on'

  try {
    const { data, error } = await supabase
      .from('system_settings' as any)
      .upsert({ id: 'system', maintenance_mode: maintenanceMode }, { onConflict: 'id' })
      .select('*')
      .maybeSingle()
    if (error) throw error
  } catch {}

  return NextResponse.redirect(new URL('/admin/settings', req.url))
}


