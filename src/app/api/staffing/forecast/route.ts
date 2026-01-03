import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { generateStaffingForecast } from '@/lib/analytics/staffingForecast'

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const eventId = request.nextUrl.searchParams.get('eventId')
  if (!eventId) {
    return NextResponse.json({ error: 'Missing eventId query parameter' }, { status: 400 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.company_id) {
    return NextResponse.json({ error: 'Unable to resolve user company' }, { status: 403 })
  }

  try {
    const forecast = await generateStaffingForecast({
      eventId,
      companyId: profile.company_id,
    })

    return NextResponse.json({ data: forecast })
  } catch (error: any) {
    console.error('Failed to generate staffing forecast', error)
    return NextResponse.json({ error: 'Unable to generate staffing forecast' }, { status: 500 })
  }
}

