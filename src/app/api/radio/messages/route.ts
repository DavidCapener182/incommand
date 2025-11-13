import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { RadioMessage, RadioMessageInsert, RadioAnalysisFilters } from '@/types/radio'
import { processRadioMessage } from '@/lib/radio/incidentCreator'
import { updateChannelHealth } from '@/lib/radio/channelHealth'
import { processRadioMessageForTask } from '@/lib/radio/taskCreator'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const filters: RadioAnalysisFilters = {
      event_id: searchParams.get('event_id') || undefined,
      channel: searchParams.get('channel') || undefined,
      category: searchParams.get('category') as any || undefined,
      priority: searchParams.get('priority') as any || undefined,
      from_callsign: searchParams.get('from_callsign') || undefined,
      to_callsign: searchParams.get('to_callsign') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('radio_messages')
      .select('*')
      .in('company_id', companyIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    const incidentId = searchParams.get('incident_id')
    if (incidentId) {
      query = query.eq('incident_id', incidentId)
    }
    if (filters.event_id) {
      query = query.eq('event_id', filters.event_id)
    }
    if (filters.channel) {
      query = query.eq('channel', filters.channel)
    }
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority)
    }
    if (filters.from_callsign) {
      query = query.eq('from_callsign', filters.from_callsign)
    }
    if (filters.to_callsign) {
      query = query.eq('to_callsign', filters.to_callsign)
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to)
    }
    if (filters.search) {
      query = query.or(`message.ilike.%${filters.search}%,transcription.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching radio messages:', error)
      // If table doesn't exist, return empty array instead of error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Radio messages table does not exist yet - returning empty array')
        return NextResponse.json({ data: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error: any) {
    console.error('Error in GET /api/radio/messages:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const messageData: RadioMessageInsert = {
      company_id: body.company_id || profile.company_id,
      event_id: body.event_id || null,
      channel: body.channel,
      from_callsign: body.from_callsign || null,
      to_callsign: body.to_callsign || null,
      message: body.message,
      transcription: body.transcription || null,
      audio_url: body.audio_url || null,
      category: body.category || null,
      priority: body.priority || null,
      incident_id: body.incident_id || null,
      task_id: body.task_id || null,
      metadata: body.metadata || {},
    }

    // Validate required fields
    if (!messageData.channel || !messageData.message) {
      return NextResponse.json(
        { error: 'Channel and message are required' },
        { status: 400 }
      )
    }

    // Verify company access
    if (messageData.company_id !== profile.company_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data: createdMessage, error } = await supabase
      .from('radio_messages')
      .insert(messageData)
      .select()
      .single()

    if (error) {
      console.error('Error creating radio message:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Auto-analyze and create incident if enabled (default: true)
    const autoCreateIncident = body.auto_create_incident !== false // Default to true unless explicitly false
    const autoCreateTask = body.auto_create_task !== false // Default to true unless explicitly false
    
    let incidentCreated = false
    let incidentId: string | number | undefined
    let taskCreated = false
    let taskId: string | undefined
    let messageRecord = createdMessage
    
    if (messageRecord && messageData.event_id) {
      // Process incident creation
      if (autoCreateIncident) {
        try {
          const processed = await processRadioMessage(
            messageRecord as RadioMessage,
            messageData.event_id,
            user.id,
            supabase,
            autoCreateIncident
          )

          if (processed.incidentCreated && processed.incidentId) {
            incidentCreated = true
            incidentId = processed.incidentId
          }
        } catch (processError: any) {
          // Log error but don't fail the request - message was created successfully
          console.error('Error processing radio message for auto-incident creation:', processError)
        }
      }

      // Process task creation (only if not already an incident)
      if (autoCreateTask && !incidentCreated) {
        try {
          const taskProcessed = await processRadioMessageForTask(
            messageRecord as RadioMessage,
            messageData.event_id,
            user.id,
            supabase,
            autoCreateTask
          )

          if (taskProcessed.taskCreated && taskProcessed.taskId) {
            taskCreated = true
            taskId = taskProcessed.taskId

            // Refresh message data to include task_id
            const { data: updatedMessage } = await supabase
              .from('radio_messages')
              .select()
              .eq('id', messageRecord.id)
              .single()

            if (updatedMessage) {
              messageRecord = updatedMessage
            }
          }
        } catch (taskError: any) {
          // Log error but don't fail the request - message was created successfully
          console.error('Error processing radio message for auto-task creation:', taskError)
        }
      }

      // Refresh message data if incident was created
      if (incidentCreated && incidentId) {
        const { data: updatedMessage } = await supabase
          .from('radio_messages')
          .select()
          .eq('id', messageRecord.id)
          .single()

        if (updatedMessage) {
          messageRecord = updatedMessage
        }
      }
    }

    // Update channel health asynchronously (don't wait for it)
    if (messageData.event_id && messageData.channel) {
      updateChannelHealth(
        supabase,
        messageData.channel,
        messageData.event_id,
        profile.company_id
      ).catch(err => console.error('Error updating channel health:', err))
    }

    // Return response with creation status
    const response: any = { data: messageRecord }
    if (incidentCreated) {
      response.incidentCreated = true
      response.incidentId = incidentId
    }
    if (taskCreated) {
      response.taskCreated = true
      response.taskId = taskId
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/radio/messages:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

