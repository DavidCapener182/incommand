import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import { getCrowdIntelligenceSummary } from '@/lib/analytics/crowdIntelligence'

async function resolveEventId(supabase: ReturnType<typeof createRouteHandlerClient<Database>>, eventId?: string) {
  if (eventId) {
    const { data } = await supabase.from('events').select('id').eq('id', eventId).maybeSingle()
    return data?.id ?? null
  }

  const { data } = await supabase.from('events').select('id').eq('is_current', true).maybeSingle()
  return data?.id ?? null
}

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession()

  if (authError || !session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const eventIdParam = request.nextUrl.searchParams.get('eventId')

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
    }

    const eventId = await resolveEventId(supabase, eventIdParam || undefined)

    if (!eventId) {
      return NextResponse.json({ error: 'No active event found' }, { status: 404 })
    }

    const summary = await getCrowdIntelligenceSummary(supabase, eventId)

    return NextResponse.json({
      data: summary,
      eventId,
      generatedAt: summary.insightsGeneratedAt,
    })
  } catch (error: any) {
    console.error('Error loading crowd intelligence summary:', error)
    return NextResponse.json({ error: 'Failed to load crowd intelligence summary' }, { status: 500 })
  }
}


