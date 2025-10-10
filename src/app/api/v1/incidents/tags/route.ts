import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/v1/incidents/tags?incident_id=123
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const searchParams = request.nextUrl.searchParams
    const incidentId = searchParams.get('incident_id')

    if (!incidentId) {
      return NextResponse.json(
        { error: 'incident_id is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('incident_tags')
      .select('id, tag, created_at, created_by')
      .eq('incident_id', parseInt(incidentId))
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ tags: data || [] })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

// POST /api/v1/incidents/tags
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { incident_id, tag } = body

    if (!incident_id || !tag) {
      return NextResponse.json(
        { error: 'incident_id and tag are required' },
        { status: 400 }
      )
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const normalizedTag = tag.trim().toLowerCase().replace(/\s+/g, '-')

    const { data, error } = await supabase
      .from('incident_tags')
      .insert([{
        incident_id: parseInt(incident_id),
        tag: normalizedTag,
        created_by: user.id
      }])
      .select('id, tag, created_at')
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Tag already exists on this incident' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ success: true, tag: data })
  } catch (error) {
    console.error('Error adding tag:', error)
    return NextResponse.json(
      { error: 'Failed to add tag' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/incidents/tags?id=123
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const searchParams = request.nextUrl.searchParams
    const tagId = searchParams.get('id')

    if (!tagId) {
      return NextResponse.json(
        { error: 'Tag id is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('incident_tags')
      .delete()
      .eq('id', parseInt(tagId))

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    )
  }
}

