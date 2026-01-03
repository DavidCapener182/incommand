import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabaseServer'

interface RouteContext {
  params: { token: string }
}

export async function GET(request: Request, context: RouteContext) {
  const token = context.params.token

  if (!token) {
    return NextResponse.json({ error: 'Missing induction token' }, { status: 400 })
  }

  try {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('vendor_accreditations')
      .select('id, status, induction_completed, vendors:vendor_id ( business_name, contact_name, service_type )')
      .eq('induction_token', token)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Accreditation not found' }, { status: 404 })
    }

    const forwardedFor = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const ipAddress = forwardedFor?.split(',')[0]?.trim()
    const userAgent = request.headers.get('user-agent') || undefined

    await (supabase as any)
      .from('vendor_induction_events')
      .insert({
        accreditation_id: (data as any).id,
        event_type: 'link_opened',
        ip_address: ipAddress || null,
        user_agent: userAgent || null
      })

    return NextResponse.json({ accreditation: data })
  } catch (error) {
    console.error('Error retrieving induction details', error)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const token = context.params.token

  if (!token) {
    return NextResponse.json({ error: 'Missing induction token' }, { status: 400 })
  }

  try {
    const supabase = getServiceClient()

    const { data: accreditation, error: fetchError } = await supabase
      .from('vendor_accreditations')
      .select('id, status')
      .eq('induction_token', token)
      .single()

    if (fetchError || !accreditation) {
      return NextResponse.json({ error: 'Accreditation not found' }, { status: 404 })
    }

    if ((accreditation as any).status !== 'new') {
      return NextResponse.json({ error: 'Induction already completed' }, { status: 409 })
    }

    const now = new Date().toISOString()

    const { error: updateError } = await ((supabase as any)
      .from('vendor_accreditations')
      .update({
        status: 'pending_review',
        induction_completed: true,
        induction_completed_at: now
      })
      .eq('id', (accreditation as any).id) as any)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const forwardedFor = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const ipAddress = forwardedFor?.split(',')[0]?.trim()
    const userAgent = request.headers.get('user-agent') || undefined

    await (supabase as any)
      .from('vendor_induction_events')
      .insert({
        accreditation_id: (accreditation as any).id,
        event_type: 'completed',
        ip_address: ipAddress || null,
        user_agent: userAgent || null
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating induction status', error)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
