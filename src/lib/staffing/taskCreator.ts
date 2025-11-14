import { getSupabaseClient } from '@/lib/mcp/supabase'
import type { DisciplineForecast, StaffingForecastResult } from '@/lib/analytics/staffingForecast'

const supabase = getSupabaseClient()

const DUPLICATE_WINDOW_MINUTES = 120

async function hasRecentTask(
  companyId: string,
  eventId: string,
  disciplineLabel: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, status, created_at')
    .eq('company_id', companyId)
    .eq('event_id', eventId)
    .ilike('title', `%${disciplineLabel}%staff%`)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Unable to check staffing task duplicates', error)
    return false
  }

  if (!data || data.length === 0) {
    return false
  }

  const record = data[0]
  if (record.status === 'completed' || record.status === 'done') {
    return false
  }

  const createdAt = record.created_at ? new Date(record.created_at).getTime() : 0
  const windowStart = Date.now() - DUPLICATE_WINDOW_MINUTES * 60 * 1000
  return createdAt >= windowStart
}

async function notifyEventOwner(
  eventId: string,
  title: string,
  message: string,
  metadata: Record<string, unknown>
) {
  const { data: eventRecord, error } = await supabase
    .from('events')
    .select('created_by')
    .eq('id', eventId)
    .single()

  if (error || !eventRecord?.created_by) {
    if (error) console.error('Unable to fetch event owner for staffing notification', error)
    return
  }

  await supabase.from('notifications').insert({
    user_id: eventRecord.created_by,
    title,
    message,
    type: 'staffing_alert',
    is_read: false,
    metadata,
  })
}

async function createTaskForDiscipline(
  forecast: StaffingForecastResult,
  discipline: DisciplineForecast
) {
  if (discipline.shortfall < 2 && discipline.risk === 'low') {
    return
  }

  if (await hasRecentTask(forecast.companyId, forecast.eventId, discipline.label)) {
    return
  }

  const title = `${discipline.label} staffing shortfall`
  const description = [
    `Predicted requirement: ${discipline.recommended}`,
    `Confirmed on-site: ${discipline.actual}`,
    `Shortfall: ${discipline.shortfall}`,
    '',
    'Recommended actions:',
    '- Alert discipline supervisors',
    '- Consider redeployments or agency call-out',
    '- Update Staffing Centre once resolved',
  ].join('\n')

  const priority = discipline.risk === 'high' ? 'urgent' : 'high'

  const { error } = await supabase.from('tasks').insert({
    company_id: forecast.companyId,
    event_id: forecast.eventId,
    title,
    description,
    priority,
    status: 'open',
    notes: JSON.stringify({
      source: 'staffing_forecast',
      discipline: discipline.discipline,
      generated_at: forecast.generatedAt,
    }),
  })

  if (error) {
    console.error('Failed to create staffing shortfall task', error)
    return
  }

  await notifyEventOwner(
    forecast.eventId,
    title,
    `Forecast detected a shortage of ${discipline.shortfall} ${discipline.label.toLowerCase()} staff.`,
    {
      discipline: discipline.discipline,
      shortfall: discipline.shortfall,
    }
  )
}

export async function createTasksForStaffingShortfalls(forecast: StaffingForecastResult) {
  await Promise.all(forecast.disciplines.map((discipline) => createTaskForDiscipline(forecast, discipline)))
}

