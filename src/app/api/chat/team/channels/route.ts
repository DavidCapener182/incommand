import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'

const supabase = getServiceSupabaseClient()

/**
 * Get available channels for Event+Company
 * GET /api/chat/team/channels?eventId=&companyId=
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const companyId = searchParams.get('companyId')

    if (!eventId || !companyId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get custom channels
    const { data: channels, error } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('event_id', eventId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching channels:', error)
      return NextResponse.json(
        { error: 'Failed to fetch channels' },
        { status: 500 }
      )
    }

    // Add default channels
    const defaultChannels = [
      { id: 'general', name: 'General', description: 'General discussion', is_private: false },
      { id: 'smt', name: 'SMT', description: 'Senior Management Team', is_private: false },
      { id: 'supervisors', name: 'Supervisors', description: 'Supervisor communications', is_private: false },
      { id: 'issues', name: 'Issues', description: 'Report issues and incidents', is_private: false }
    ]

    const allChannels = [...defaultChannels, ...(channels || [])]

    return NextResponse.json({ channels: allChannels })
  } catch (error) {
    console.error('Channels error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Create new channel
 * POST /api/chat/team/channels
 */
export async function POST(request: NextRequest) {
  try {
    const { eventId, companyId, name, description, createdBy, isPrivate = false } = await request.json()

    if (!eventId || !companyId || !name || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user has access
    const { data: userAccess, error: accessError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', createdBy)
      .single()

    if (accessError || !userAccess || userAccess.company_id !== companyId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Create channel
    const { data, error } = await supabase
      .from('chat_channels')
      .insert({
        name,
        event_id: eventId,
        company_id: companyId,
        created_by: createdBy,
        is_private: isPrivate,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating channel:', error)
      return NextResponse.json(
        { error: 'Failed to create channel' },
        { status: 500 }
      )
    }

    return NextResponse.json({ channel: data })
  } catch (error) {
    console.error('Create channel error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
