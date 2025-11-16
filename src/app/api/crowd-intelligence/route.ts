import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import { getCrowdIntelligenceSummary } from '@/lib/analytics/crowdIntelligence'

interface EventRow {
  id: string
}

interface ProfileRow {
  company_id: string
}

async function resolveEventId(supabase: ReturnType<typeof createRouteHandlerClient<Database>>, eventId?: string) {
  if (eventId) {
    const result = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .maybeSingle<EventRow>()
    
    return result.data?.id ?? null
  }

  const result = await supabase
    .from('events')
    .select('id')
    .eq('is_current', true)
    .maybeSingle<EventRow>()
  
  return result.data?.id ?? null
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
    const result = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session.user.id)
      .single<ProfileRow>()

    if (result.error || !result.data?.company_id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
    }

    const profile = result.data

    const eventId = await resolveEventId(supabase, eventIdParam || undefined)

    if (!eventId) {
      return NextResponse.json({ error: 'No active event found' }, { status: 404 })
    }

    const summary = await getCrowdIntelligenceSummary(supabase as any, eventId)

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


