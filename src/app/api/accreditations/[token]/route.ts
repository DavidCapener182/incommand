import { NextResponse } from 'next/server'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'

interface RouteContext {
  params: { token: string }
}

export async function GET(_request: Request, context: RouteContext) {
  const token = context.params.token

  if (!token) {
    return NextResponse.json({ error: 'Missing induction token' }, { status: 400 })
  }

  try {
    const supabase = getServiceSupabaseClient()
    const { data, error } = await supabase
      .from('vendor_accreditations')
      .select('id, status, induction_completed, vendors:vendor_id ( business_name, contact_name, service_type )')
      .eq('induction_token', token)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Accreditation not found' }, { status: 404 })
    }

    return NextResponse.json({ accreditation: data })
  } catch (error) {
    console.error('Error retrieving induction details', error)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}

export async function PATCH(_request: Request, context: RouteContext) {
  const token = context.params.token

  if (!token) {
    return NextResponse.json({ error: 'Missing induction token' }, { status: 400 })
  }

  try {
    const supabase = getServiceSupabaseClient()

    const { data: accreditation, error: fetchError } = await supabase
      .from('vendor_accreditations')
      .select('id, status')
      .eq('induction_token', token)
      .single()

    if (fetchError || !accreditation) {
      return NextResponse.json({ error: 'Accreditation not found' }, { status: 404 })
    }

    if (accreditation.status !== 'new') {
      return NextResponse.json({ error: 'Induction already completed' }, { status: 409 })
    }

    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('vendor_accreditations')
      .update({
        status: 'pending_review',
        induction_completed: true,
        induction_completed_at: now
      })
      .eq('id', accreditation.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating induction status', error)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
