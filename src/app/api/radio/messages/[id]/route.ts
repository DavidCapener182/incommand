import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { RadioMessageInsert } from '@/types/radio'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'No company found' }, { status: 403 })
    }

    const companyIds = [profile.company_id]

    const { data, error } = await supabase
      .from('radio_messages')
      .select('*')
      .eq('id', params.id)
      .in('company_id', companyIds)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Radio message not found' }, { status: 404 })
      }
      console.error('Error fetching radio message:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error in GET /api/radio/messages/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'No company found' }, { status: 403 })
    }

    const companyIds = [profile.company_id]

    // Verify message exists and user has access
    const { data: existingMessage } = await supabase
      .from('radio_messages')
      .select('company_id')
      .eq('id', params.id)
      .in('company_id', companyIds)
      .single()

    if (!existingMessage) {
      return NextResponse.json({ error: 'Radio message not found' }, { status: 404 })
    }

    const body = await request.json()
    const updateData: Partial<RadioMessageInsert> = {}

    // Only update provided fields
    if (body.channel !== undefined) updateData.channel = body.channel
    if (body.from_callsign !== undefined) updateData.from_callsign = body.from_callsign
    if (body.to_callsign !== undefined) updateData.to_callsign = body.to_callsign
    if (body.message !== undefined) updateData.message = body.message
    if (body.transcription !== undefined) updateData.transcription = body.transcription
    if (body.audio_url !== undefined) updateData.audio_url = body.audio_url
    if (body.category !== undefined) updateData.category = body.category
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.incident_id !== undefined) updateData.incident_id = body.incident_id
    if (body.task_id !== undefined) updateData.task_id = body.task_id
    if (body.metadata !== undefined) updateData.metadata = body.metadata

    const { data, error } = await supabase
      .from('radio_messages')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating radio message:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error in PATCH /api/radio/messages/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'No company found' }, { status: 403 })
    }

    const companyIds = [profile.company_id]

    // Verify message exists and user has access
    const { data: existingMessage } = await supabase
      .from('radio_messages')
      .select('company_id')
      .eq('id', params.id)
      .in('company_id', companyIds)
      .single()

    if (!existingMessage) {
      return NextResponse.json({ error: 'Radio message not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('radio_messages')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting radio message:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/radio/messages/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

