// Auto-Task Creation from Incident Logs (Feature 10, Phase 7)

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { RadioMessage } from '@/types/radio'

export interface IncidentTaskCreationResult {
  taskCreated: boolean
  taskId?: string
  reason?: string
  error?: string
}

// Incident interface matching incident_logs structure
interface Incident {
  id: number
  occurrence: string
  incident_type: string
  priority?: string
  location?: string
  callsign_from?: string
  callsign_to?: string
  event_id: string
  is_closed: boolean
  created_at: string
}

// Task-related keywords that indicate a task should be created
const TASK_KEYWORDS = [
  'check', 'verify', 'inspect', 'review', 'monitor',
  'follow up', 'follow-up', 'followup',
  'assign', 'allocate', 'deploy', 'send',
  'report back', 'report back to', 'update me',
  'confirm', 'acknowledge', 'respond',
  'investigate', 'look into', 'check on',
  'ensure', 'make sure', 'ensure that',
  'coordinate', 'arrange', 'organize',
  'prepare', 'set up', 'setup',
  'clear', 'secure', 'lock down',
  'standby', 'stand by', 'wait for',
  'meet', 'rendezvous', 'location',
  'patrol', 'sweep', 'check area',
]

// Action verbs that suggest task creation
const ACTION_VERBS = [
  'need', 'require', 'must', 'should',
  'please', 'can you', 'could you',
  'task', 'action', 'assignment',
]

/**
 * Detect if an incident contains task-related keywords
 */
export function shouldCreateTaskFromIncident(incident: Incident): boolean {
  const lowerOccurrence = (incident.occurrence || '').toLowerCase()
  const lowerType = (incident.incident_type || '').toLowerCase()
  
  // Skip closed incidents
  if (incident.is_closed) {
    return false
  }
  
  // Check for task keywords in occurrence text
  const hasTaskKeyword = TASK_KEYWORDS.some(keyword => 
    lowerOccurrence.includes(keyword)
  )
  
  // Check for action verbs in occurrence text
  const hasActionVerb = ACTION_VERBS.some(verb => 
    lowerOccurrence.includes(verb)
  )
  
  // Check incident types that often require tasks
  const taskRelatedTypes = [
    'patrol', 'check', 'inspection', 'monitor', 'coordination',
    'follow up', 'follow-up', 'assignment', 'deployment'
  ]
  const isTaskRelatedType = taskRelatedTypes.some(type => 
    lowerType.includes(type)
  )
  
  // If incident type suggests a task
  if (isTaskRelatedType) {
    return true
  }
  
  // If occurrence has task keyword and is not a critical incident type
  const criticalTypes = ['medical', 'fire', 'evacuation', 'emergency', 'critical']
  const isCriticalType = criticalTypes.some(type => lowerType.includes(type))
  
  // VERY LENIENT: if it has ANY task keyword and not critical, create task
  if (hasTaskKeyword && !isCriticalType) {
    return true
  }
  
  // If incident has both task keyword and action verb, high confidence
  if (hasTaskKeyword && hasActionVerb) {
    return true
  }
  
  // Check for explicit task requests
  if (lowerOccurrence.includes('task') || lowerOccurrence.includes('assignment')) {
    return true
  }
  
  // Even more lenient: if occurrence contains common task words anywhere
  const commonTaskWords = ['check', 'verify', 'inspect', 'monitor', 'patrol', 'follow', 'assign']
  const hasCommonTaskWord = commonTaskWords.some(word => lowerOccurrence.includes(word))
  if (hasCommonTaskWord && !isCriticalType && !incident.is_closed) {
    return true
  }
  
  return false
}

/**
 * Extract task details from incident
 */
export function extractTaskDetailsFromIncident(incident: Incident): {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  location?: string
  assignedTo?: string // callsign or name if mentioned
} {
  const lowerOccurrence = (incident.occurrence || '').toLowerCase()
  
  // Use incident location if available
  const location = incident.location || undefined
  
  // Try to extract assigned callsign/person from occurrence text
  const assignedMatch = incident.occurrence?.match(/(?:to|assign|send|deploy)\s+([A-Z0-9\s]+)/i)
  const assignedTo = assignedMatch ? assignedMatch[1].trim() : incident.callsign_to || undefined
  
  // Generate title from incident type and occurrence (first 50 chars or up to first sentence)
  const firstSentence = incident.occurrence.split(/[.!?]/)[0].trim()
  const title = firstSentence.length > 50 
    ? firstSentence.substring(0, 47) + '...'
    : `${incident.incident_type}: ${firstSentence}` || `Task from ${incident.incident_type}`
  
  // Determine priority based on incident priority and urgency keywords
  let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  
  const incidentPriority = (incident.priority || '').toLowerCase()
  if (incidentPriority === 'critical' || incidentPriority === 'urgent') {
    priority = 'urgent'
  } else if (incidentPriority === 'high') {
    priority = 'high'
  } else if (lowerOccurrence.includes('urgent') || lowerOccurrence.includes('asap') || 
             lowerOccurrence.includes('immediately')) {
    priority = 'high'
  } else if (lowerOccurrence.includes('routine') || lowerOccurrence.includes('when possible')) {
    priority = 'low'
  }
  
  return {
    title,
    description: `Task created from incident log:\n\nIncident Type: ${incident.incident_type}\nOccurrence: ${incident.occurrence}\n\nFrom: ${incident.callsign_from || 'Unknown'}\nTo: ${incident.callsign_to || 'All'}\nIncident ID: ${incident.id}`,
    priority,
    location,
    assignedTo,
  }
}

/**
 * Check for duplicate tasks within a time window (10 minutes) with similar content
 */
async function checkForDuplicateTask(
  supabase: SupabaseClient<Database>,
  eventId: string,
  taskTitle: string,
  timeWindowMinutes: number = 10
): Promise<{ isDuplicate: boolean; existingTaskId?: string }> {
  try {
    const supabaseClient = supabase as SupabaseClient<any>
    const timeWindow = new Date()
    timeWindow.setMinutes(timeWindow.getMinutes() - timeWindowMinutes)

    // Search for recent tasks with similar titles
    const { data: recentTasks, error } = await supabaseClient
      .from('tasks')
      .select('id, title, created_at')
      .eq('event_id', eventId)
      .gte('created_at', timeWindow.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error checking for duplicate tasks:', error)
      return { isDuplicate: false }
    }

    if (!recentTasks || recentTasks.length === 0) {
      return { isDuplicate: false }
    }

    // Check for similar content (simple keyword matching)
    const titleKeywords = taskTitle.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)
    
    for (const task of recentTasks) {
      const taskKeywords = (task.title || '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)
      
      // If more than 50% of keywords match, consider it a duplicate
      const matchingKeywords = titleKeywords.filter((kw: string) => taskKeywords.includes(kw)).length
      const similarity = matchingKeywords / Math.max(titleKeywords.length, taskKeywords.length)
      
      if (similarity > 0.5) {
        return { isDuplicate: true, existingTaskId: task.id }
      }
    }

    return { isDuplicate: false }
  } catch (error) {
    console.error('Error in checkForDuplicateTask:', error)
    return { isDuplicate: false }
  }
}

/**
 * Create a task from an incident if it meets criteria (server-side)
 */
export async function createTaskFromIncident(
  incident: Incident,
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<IncidentTaskCreationResult> {
  try {
    const supabaseClient = supabase as SupabaseClient<any>
    // Check if task should be created
    if (!shouldCreateTaskFromIncident(incident)) {
      return {
        taskCreated: false,
        reason: 'Incident does not contain task-related keywords',
      }
    }

    // Extract task details
    const taskDetails = extractTaskDetailsFromIncident(incident)

      // Check for duplicates
      const duplicateCheck = await checkForDuplicateTask(
        supabase,
        incident.event_id,
        taskDetails.title
      )

    if (duplicateCheck.isDuplicate) {
      return {
        taskCreated: false,
        reason: 'Similar task already exists',
        taskId: duplicateCheck.existingTaskId,
      }
    }

      // Get company_id from user profile
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single()

    if (profileError || !profile?.company_id) {
      return {
        taskCreated: false,
        error: 'Failed to get company ID',
      }
    }

      // Create the task
      const { data: taskData, error: taskError } = await supabaseClient
        .from('tasks')
        .insert({
          company_id: profile.company_id,
          event_id: incident.event_id,
          title: taskDetails.title,
          description: taskDetails.description,
          priority: taskDetails.priority,
          location: taskDetails.location ? JSON.stringify({ address: taskDetails.location }) : null,
          notes: `Auto-created from incident log #${incident.id} (${incident.incident_type})`,
          created_by: userId,
          status: 'open',
        })
        .select()
        .single()

    if (taskError) {
      console.error('Error creating task:', taskError)
      return {
        taskCreated: false,
        error: taskError.message,
      }
    }

    return {
      taskCreated: true,
      taskId: taskData.id,
      reason: 'Task created from incident log',
    }
  } catch (error: any) {
    console.error('Error in createTaskFromIncident:', error)
    return {
      taskCreated: false,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Process an incident and create a task if needed (server-side)
 */
export async function processIncidentForTask(
  incident: Incident,
  userId: string,
  supabase: SupabaseClient<Database>,
  autoCreateTask: boolean = true
): Promise<{
  analyzed: boolean
  shouldCreate: boolean
  taskCreated?: boolean
  taskId?: string
}> {
  if (!autoCreateTask) {
    return {
      analyzed: true,
      shouldCreate: false,
    }
  }

  const shouldCreate = shouldCreateTaskFromIncident(incident)

  if (!shouldCreate) {
    return {
      analyzed: true,
      shouldCreate: false,
    }
  }

  const result = await createTaskFromIncident(incident, userId, supabase)

  return {
    analyzed: true,
    shouldCreate: true,
    taskCreated: result.taskCreated,
    taskId: result.taskId,
  }
}

/**
 * Process multiple incidents and create tasks (for batch processing)
 */
export async function processIncidentsForTasks(
  incidents: Incident[],
  userId: string,
  supabase: SupabaseClient<Database>,
  autoCreateTask: boolean = true
): Promise<{
  processed: number
  tasksCreated: number
  results: IncidentTaskCreationResult[]
}> {
  const results: IncidentTaskCreationResult[] = []
  let tasksCreated = 0

  for (const incident of incidents) {
    if (incident.is_closed) {
      continue // Skip closed incidents
    }

    const result = await processIncidentForTask(incident, userId, supabase, autoCreateTask)
    
    if (result.taskCreated) {
      tasksCreated++
      results.push({
        taskCreated: true,
        taskId: result.taskId,
        reason: 'Task created from incident',
      })
    } else {
      results.push({
        taskCreated: false,
        reason: result.shouldCreate ? 'Duplicate or error' : 'No task keywords detected',
      })
    }
  }

  return {
    processed: incidents.length,
    tasksCreated,
    results,
  }
}

/**
 * Process a radio message and create a task if appropriate.
 * Reuses the incident-based task creation heuristics by mapping radio data to an incident shape.
 */
export async function processRadioMessageForTask(
  message: RadioMessage,
  eventId: string,
  userId: string,
  supabase: SupabaseClient<Database>,
  autoCreateTask: boolean = true
): Promise<IncidentTaskCreationResult> {
  try {
    const supabaseClient = supabase as SupabaseClient<any>
    if (!autoCreateTask) {
      return {
        taskCreated: false,
        reason: 'Auto task creation disabled',
      }
    }

    if (!eventId) {
      return {
        taskCreated: false,
        error: 'Event ID is required for task creation',
      }
    }

    if (message.task_id) {
      return {
        taskCreated: false,
        reason: 'Task already linked to this message',
        taskId: message.task_id,
      }
    }

    const syntheticIncident: Incident = {
      id: Number(message.incident_id ?? message.id) || Date.now(),
      occurrence: message.message || message.transcription || '',
      incident_type: message.category || 'Radio Task',
      priority: message.priority || undefined,
      location:
        (typeof message.metadata?.location === 'string'
          ? message.metadata.location
          : message.metadata?.location?.address) ||
        undefined,
      callsign_from: message.from_callsign || undefined,
      callsign_to: message.to_callsign || undefined,
      event_id: eventId,
      is_closed: false,
      created_at: message.created_at || new Date().toISOString(),
    }

    // Ensure we only attempt creation when heuristics suggest it's needed
    if (!shouldCreateTaskFromIncident(syntheticIncident)) {
      return {
        taskCreated: false,
        reason: 'Radio message does not contain task-related keywords',
      }
    }

    const result = await createTaskFromIncident(syntheticIncident, userId, supabase)

    if (result.taskCreated && result.taskId) {
      await supabaseClient
        .from('radio_messages')
        .update({ task_id: result.taskId })
        .eq('id', message.id)
    }

    return result
  } catch (error: any) {
    console.error('Error processing radio message for task creation:', error)
    return {
      taskCreated: false,
      error: error.message || 'Unknown error',
    }
  }
}

