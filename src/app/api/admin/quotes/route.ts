import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if user is superadmin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profileRecord = profile as { role?: string } | null
  if (profileRecord?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('quotes' as any)
    .select(`
      *,
      companies (
        id,
        name,
        subscription_plan
      ),
      profiles:assigned_to (
        id,
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ quotes: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if user is superadmin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profileRecord = profile as { role?: string } | null
  if (profileRecord?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const {
      company_id,
      company_name,
      contact_name,
      contact_email,
      contact_phone,
      base_plan,
      recommended_plan,
      events_per_month,
      avg_attendees_per_event,
      staff_users,
      admin_users,
      feature_add_ons,
      monthly_estimate,
      annual_estimate,
      breakdown,
      notes,
      follow_up_date,
      assigned_to,
      expires_at,
    } = body

    const { data, error } = await (supabase as any)
      .from('quotes')
      .insert({
        company_id: company_id || null,
        company_name,
        contact_name: contact_name || null,
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        base_plan,
        recommended_plan,
        events_per_month,
        avg_attendees_per_event,
        staff_users,
        admin_users,
        feature_add_ons: feature_add_ons || [],
        monthly_estimate,
        annual_estimate,
        breakdown: breakdown || {},
        notes: notes || null,
        follow_up_date: follow_up_date || null,
        assigned_to: assigned_to || null,
        expires_at: expires_at || null,
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating quote:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ quote: data })
  } catch (error) {
    console.error('Error in POST /api/admin/quotes:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if user is superadmin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profileRecord = profile as { role?: string } | null
  if (profileRecord?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 })
    }

    const { data, error } = await (supabase as any)
      .from('quotes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating quote:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ quote: data })
  } catch (error) {
    console.error('Error in PATCH /api/admin/quotes:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if user is superadmin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profileRecord = profile as { role?: string } | null
  if (profileRecord?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('quotes' as any)
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting quote:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/quotes:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

