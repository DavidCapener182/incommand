import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assigned_to')

    if (!eventId) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('tasks')
      .select('id, event_id, title, description, assigned_to, assigned_by, status, priority, due_date, completed_at, created_at, updated_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (assignedTo) query = query.eq('assigned_to', assignedTo)

    const { data: tasks, error } = await query

    if (error) {
      if (error.message?.includes('does not exist')) {
        return NextResponse.json({ tasks: [] })
      }
      console.error('Tasks fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    return NextResponse.json({ tasks: tasks ?? [] })
  } catch (err) {
    console.error('Tasks API error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { event_id, title, description, assigned_to, priority, due_date } = body

    if (!event_id || !title) {
      return NextResponse.json({ error: 'event_id and title are required' }, { status: 400 })
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        event_id,
        title,
        description: description ?? null,
        assigned_to: assigned_to ?? null,
        assigned_by: user.id,
        status: 'pending',
        priority: priority ?? 'medium',
        due_date: due_date ?? null,
      })
      .select()
      .single()

    if (error) {
      if (error.message?.includes('does not exist')) {
        return NextResponse.json({ error: 'Tasks table not available. Run the tasks_dispatch_migration.' }, { status: 503 })
      }
      console.error('Task create error:', error)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    return NextResponse.json({ task })
  } catch (err) {
    console.error('Task create API error:', err)
    return NextResponse.json(
      { error: 'Failed to create task', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
