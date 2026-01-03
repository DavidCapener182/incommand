// Auto-Incident Creation from Radio Messages (Feature 10)

import { RadioMessage } from '@/types/radio'
import { analyzeRadioMessage, shouldCreateIncident, extractIncidentDetails } from '@/lib/ai/radioAnalysis'
import { createImmutableLog } from '@/lib/auditableLogging'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export interface RadioIncidentCreationResult {
  incidentCreated: boolean
  incidentId?: string | number
  reason?: string
  error?: string
}

/**
 * Check for duplicate incidents within a time window (5 minutes) with similar content
 */
async function checkForDuplicateIncident(
  supabase: SupabaseClient<Database>,
  eventId: string,
  messageText: string,
  timeWindowMinutes: number = 5
): Promise<{ isDuplicate: boolean; existingIncidentId?: number }> {
  try {
    const supabaseClient = supabase as SupabaseClient<any>
    const timeWindow = new Date()
    timeWindow.setMinutes(timeWindow.getMinutes() - timeWindowMinutes)

    // Search for recent incidents with similar text
    const { data: recentIncidents, error } = await supabaseClient
      .from('incident_logs')
      .select('id, occurrence, created_at')
      .eq('event_id', eventId)
      .gte('created_at', timeWindow.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error checking for duplicates:', error)
      return { isDuplicate: false }
    }

    if (!recentIncidents || recentIncidents.length === 0) {
      return { isDuplicate: false }
    }

    // Check for similar content (simple keyword matching)
    const messageKeywords = messageText.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)
    
    for (const incident of recentIncidents) {
      const incidentKeywords =
        incident.occurrence?.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3) || []
      
      // If 50% or more keywords match, consider it a duplicate
      const matchingKeywords = messageKeywords.filter((kw: string) => 
        incidentKeywords.some((ikw: string) => ikw.includes(kw) || kw.includes(ikw))
      )
      
      if (matchingKeywords.length >= Math.ceil(messageKeywords.length * 0.5)) {
        return {
          isDuplicate: true,
          existingIncidentId: incident.id,
        }
      }
    }

    return { isDuplicate: false }
  } catch (error) {
    console.error('Error in duplicate check:', error)
    return { isDuplicate: false }
  }
}

/**
 * Create an incident from a radio message if it meets criteria (server-side)
 */
export async function createIncidentFromRadioMessage(
  message: RadioMessage,
  eventId: string,
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<RadioIncidentCreationResult> {
  try {
    const supabaseClient = supabase as SupabaseClient<any>
    // Check if incident should be created
    if (!shouldCreateIncident(message)) {
      return {
        incidentCreated: false,
        reason: 'Message does not meet incident creation criteria',
      }
    }

    // Check if incident already exists for this message
    if (message.incident_id) {
      return {
        incidentCreated: false,
        reason: 'Incident already linked to this message',
        incidentId: Number(message.incident_id),
      }
    }

    // Check for duplicate incidents
    const duplicateCheck = await checkForDuplicateIncident(
      supabase,
      eventId,
      message.message || message.transcription || ''
    )

    if (duplicateCheck.isDuplicate && duplicateCheck.existingIncidentId) {
      // Link the radio message to the existing incident
        await supabaseClient
        .from('radio_messages')
        .update({ incident_id: duplicateCheck.existingIncidentId })
        .eq('id', message.id)

      return {
        incidentCreated: false,
        reason: 'Duplicate incident detected - linked to existing incident',
        incidentId: duplicateCheck.existingIncidentId,
      }
    }

    // Extract incident details
    const incidentDetails = extractIncidentDetails(message)

    // Get event data for log number generation
      const { data: eventData } = await supabaseClient
      .from('events')
      .select('event_name, name, event_date, date')
      .eq('id', eventId)
      .single()

    const eventNameValue = eventData?.event_name ?? eventData?.name ?? 'Event'
    const eventPrefix = eventNameValue.substring(0, 3).toUpperCase()
    const resolvedDate = eventData?.event_date ?? eventData?.date
    const eventDate = resolvedDate 
      ? new Date(resolvedDate).toISOString().split('T')[0].replace(/-/g, '') 
      : new Date().toISOString().split('T')[0].replace(/-/g, '')

    // Get count for log number
      const { count } = await supabaseClient
      .from('incident_logs')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)

    const logNumber = `${eventPrefix}-${eventDate}-${String((count || 0) + 1).padStart(4, '0')}`

    // Get user callsign from profile or assignment
      const { data: profile } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single()

      const { data: assignment } = await supabaseClient
      .from('callsign_assignments')
      .select('callsign_positions(callsign, short_code)')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single()

    const userCallsign = (assignment as any)?.callsign_positions?.callsign || 
                        (assignment as any)?.callsign_positions?.short_code ||
                        `${profile?.first_name?.[0]}${profile?.last_name?.[0]}`.toUpperCase() ||
                        'RADIO'

    // Prepare log data
    const logData = {
      log_number: logNumber,
      occurrence: incidentDetails.description,
      action_taken: `Auto-created from radio message on channel ${message.channel}`,
      incident_type: incidentDetails.type,
      callsign_from: message.from_callsign || 'RADIO',
      callsign_to: message.to_callsign || 'CONTROL',
      time_of_occurrence: message.created_at,
      time_logged: new Date().toISOString(),
      timestamp: message.created_at,
      entry_type: 'contemporaneous' as const,
      logged_by_callsign: userCallsign,
      priority: incidentDetails.priority || 'medium',
      event_id: eventId,
      status: 'open' as const,
      is_closed: false,
      location: incidentDetails.location || '',
    }

    // Create immutable log
    const result = await createImmutableLog(logData, userId)

    if (!result.success) {
      return {
        incidentCreated: false,
        error: result.error || 'Failed to create incident',
      }
    }

    if (!result.log) {
      return {
        incidentCreated: false,
        error: 'Incident creation returned no log data',
      }
    }

    // Update radio message to link incident
      const { error: updateError } = await supabaseClient
      .from('radio_messages')
      .update({
        incident_id: result.log.id,
        category: incidentDetails.type === 'Medical' || incidentDetails.type === 'Fire' ? 'emergency' : 'incident',
        priority: incidentDetails.priority,
      })
      .eq('id', message.id)

    if (updateError) {
      console.warn('Failed to link incident to radio message, but incident was created:', updateError)
    }

    return {
      incidentCreated: true,
      incidentId: result.log.id,
      reason: `Auto-created from radio message: ${incidentDetails.type}`,
    }
  } catch (error: any) {
    console.error('Error creating incident from radio message:', error)
    return {
      incidentCreated: false,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Analyze and categorize a radio message, then create incident if needed (server-side)
 */
export async function processRadioMessage(
  message: RadioMessage,
  eventId: string,
  userId: string,
  supabase: SupabaseClient<Database>,
  autoCreateIncident: boolean = true
): Promise<{
  analyzed: boolean
  category?: string
  priority?: string
  incidentCreated?: boolean
  incidentId?: string | number
}> {
  try {
    const supabaseClient = supabase as SupabaseClient<any>
    // Analyze message if not already analyzed
    if (!message.category || !message.priority) {
      const analysis = analyzeRadioMessage(message.message || message.transcription || '')

      // Update message with analysis
        const { error: updateError } = await supabaseClient
        .from('radio_messages')
        .update({
          category: analysis.category,
          priority: analysis.priority,
        })
        .eq('id', message.id)

      if (updateError) {
        console.warn('Failed to update message with analysis:', updateError)
      }

      // Create incident if auto-create is enabled
      if (autoCreateIncident && (analysis.category === 'emergency' || analysis.category === 'incident')) {
        const updatedMessage = { ...message, category: analysis.category, priority: analysis.priority }
        const incidentResult = await createIncidentFromRadioMessage(updatedMessage, eventId, userId, supabase)
        return {
          analyzed: true,
          category: analysis.category,
          priority: analysis.priority,
          incidentCreated: incidentResult.incidentCreated,
          incidentId: incidentResult.incidentId,
        }
      }

      return {
        analyzed: true,
        category: analysis.category,
        priority: analysis.priority,
      }
    }

    // Message already analyzed, check if incident should be created
    if (autoCreateIncident && shouldCreateIncident(message) && !message.incident_id) {
      const incidentResult = await createIncidentFromRadioMessage(message, eventId, userId, supabase)
      return {
        analyzed: true,
        category: message.category || undefined,
        priority: message.priority || undefined,
        incidentCreated: incidentResult.incidentCreated,
        incidentId: incidentResult.incidentId,
      }
    }

    return {
      analyzed: true,
      category: message.category || undefined,
      priority: message.priority || undefined,
    }
  } catch (error: any) {
    console.error('Error processing radio message:', error)
    return {
      analyzed: false,
    }
  }
}

