import { getSupabaseClient } from '@/lib/mcp/supabase'

export interface FixtureTaskData {
  id: string
  company_id: string
  event_id: string
  minute: number
  description: string
  assigned_role?: string
  completed?: boolean
  completed_at?: string
  completed_by?: string
  created_at: string
  updated_at: string
}

export interface FixtureCompletionData {
  id: string
  company_id: string
  event_id: string
  task_id: string
  completed: boolean
  completed_at?: string
  completed_by?: string
}

// Get all fixture tasks with completion status for a company/event
export async function getFixtureTasks(companyId: string, eventId: string): Promise<FixtureTaskData[]> {
  const supabase = getSupabaseClient()
  
  // Get fixture tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('fixture_tasks')
    .select('*')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .order('minute', { ascending: true })
  
  if (tasksError) {
    console.error('Error fetching fixture tasks:', tasksError)
    return []
  }
  
  // Get completion data
  const { data: completions, error: completionsError } = await supabase
    .from('fixture_completions')
    .select('task_id, completed, completed_at, completed_by')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
  
  if (completionsError) {
    console.error('Error fetching fixture completions:', completionsError)
  }
  
  // Merge tasks with completion data
  const tasksWithCompletions = tasks?.map(task => ({
    ...task,
    completed: completions?.find(comp => comp.task_id === task.id)?.completed || false,
    completed_at: completions?.find(comp => comp.task_id === task.id)?.completed_at,
    completed_by: completions?.find(comp => comp.task_id === task.id)?.completed_by
  })) || []
  
  return tasksWithCompletions
}

// Create a new fixture task
export async function createFixtureTask(
  companyId: string,
  eventId: string,
  data: { minute: number; description: string; assigned_role?: string }
): Promise<FixtureTaskData> {
  const supabase = getSupabaseClient()
  
  const { data: task, error } = await supabase
    .from('fixture_tasks')
    .insert({
      company_id: companyId,
      event_id: eventId,
      minute: data.minute,
      description: data.description,
      assigned_role: data.assigned_role
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating fixture task:', error)
    throw error
  }
  
  return task
}

// Update a fixture task
export async function updateFixtureTask(
  companyId: string,
  eventId: string,
  taskId: string,
  data: { minute?: number; description?: string; assigned_role?: string }
): Promise<FixtureTaskData> {
  const supabase = getSupabaseClient()
  
  const updateData: any = {}
  if (data.minute !== undefined) updateData.minute = data.minute
  if (data.description !== undefined) updateData.description = data.description
  if (data.assigned_role !== undefined) updateData.assigned_role = data.assigned_role
  
  const { data: task, error } = await supabase
    .from('fixture_tasks')
    .update(updateData)
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .eq('id', taskId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating fixture task:', error)
    throw error
  }
  
  return task
}

// Delete a fixture task
export async function deleteFixtureTask(companyId: string, eventId: string, taskId: string): Promise<void> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('fixture_tasks')
    .delete()
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .eq('id', taskId)
  
  if (error) {
    console.error('Error deleting fixture task:', error)
    throw error
  }
}

// Update task completion status
export async function updateTaskCompletion(
  companyId: string,
  eventId: string,
  taskId: string,
  completed: boolean,
  completedBy?: string
): Promise<FixtureCompletionData> {
  const supabase = getSupabaseClient()
  
  const completedAt = completed ? new Date().toISOString() : null
  
  const { data: completion, error } = await supabase
    .from('fixture_completions')
    .upsert({
      company_id: companyId,
      event_id: eventId,
      task_id: taskId,
      completed,
      completed_at: completedAt,
      completed_by: completedBy
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error updating task completion:', error)
    throw error
  }
  
  return completion
}

// Get task completion summary
export async function getTaskCompletionSummary(companyId: string, eventId: string): Promise<{
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  completion_percentage: number
}> {
  const supabase = getSupabaseClient()
  
  // Get all tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('fixture_tasks')
    .select('id')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
  
  if (tasksError) {
    console.error('Error fetching tasks for summary:', tasksError)
    return { total_tasks: 0, completed_tasks: 0, pending_tasks: 0, completion_percentage: 0 }
  }
  
  // Get completed tasks
  const { data: completions, error: completionsError } = await supabase
    .from('fixture_completions')
    .select('task_id, completed')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .eq('completed', true)
  
  if (completionsError) {
    console.error('Error fetching completions for summary:', completionsError)
  }
  
  const totalTasks = tasks?.length || 0
  const completedTasks = completions?.length || 0
  const pendingTasks = totalTasks - completedTasks
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100 * 10) / 10 : 0
  
  return {
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    pending_tasks: pendingTasks,
    completion_percentage: completionPercentage
  }
}
