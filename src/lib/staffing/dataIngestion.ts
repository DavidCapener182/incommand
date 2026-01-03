import { getSupabaseClient } from '@/lib/mcp/supabase'
import type { StaffingDiscipline, StaffingRoleData } from '@/lib/database/staffing'
import { DISCIPLINE_META, resolveDisciplines } from '@/lib/staffing/discipline'

export type StaffingDisciplineSnapshot = {
  discipline: StaffingDiscipline
  label: string
  planned: number
  actual: number
  fulfillmentPct: number
  shortfall: number
  icon: string
  color: string
}

export interface StaffingIngestionBundle {
  eventId: string
  companyId: string
  eventType?: string | null
  requiredDisciplines: StaffingDiscipline[]
  disciplines: StaffingDisciplineSnapshot[]
  staffAvailability: {
    total: number
    active: number
    assignedToEvent: number
    availableEstimate: number
    skillTagCounts: Record<string, number>
  }
  incidentPressure: {
    openIncidents: number
    highPriority: number
    lastHour: number
  }
  attendance: {
    expected?: number | null
    current?: number | null
    lastRecordAt?: string | null
  }
}

const supabase = getSupabaseClient()

async function fetchEventContext(eventId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('id, company_id, event_type, expected_attendance, current_attendance')
    .eq('id', eventId)
    .maybeSingle()

  if (error) {
    console.error('Failed to fetch event context', error)
    throw error
  }

  if (!data) {
    throw new Error(`Event ${eventId} not found`)
  }

  return data
}

async function ensureDefaultRolesForEvent(
  companyId: string,
  eventId: string,
  disciplines: StaffingDiscipline[]
) {
  const { data: roles, error } = await supabase
    .from('staffing_roles')
    .select('id, discipline')
    .eq('company_id', companyId)
    .eq('event_id', eventId)

  if (error) {
    console.error('Unable to load staffing roles', error)
    return
  }

  const existing = new Set((roles ?? []).map((role) => (role.discipline as StaffingDiscipline) || 'security'))
  const missing = disciplines.filter((disc) => !existing.has(disc))

  if (missing.length === 0) {
    return
  }

  const payload = missing.map((discipline) => ({
    company_id: companyId,
    event_id: eventId,
    name: DISCIPLINE_META[discipline].label,
    planned_count: 0,
    discipline,
    icon: DISCIPLINE_META[discipline].icon,
    color: DISCIPLINE_META[discipline].color,
  }))

  const { error: insertError } = await supabase.from('staffing_roles').insert(payload)
  if (insertError) {
    console.error('Failed to insert default staffing roles', insertError)
  }
}

function aggregateDisciplines(
  roles: StaffingRoleData[],
  actualsMap: Map<string, number>,
  requiredDisciplines: StaffingDiscipline[]
): StaffingDisciplineSnapshot[] {
  const totals = new Map<StaffingDiscipline, { planned: number; actual: number }>()

  roles.forEach((role) => {
    const discipline = (role.discipline as StaffingDiscipline) || 'security'
    const planned = role.planned_count || 0
    const actual = actualsMap.get(role.id) ?? role.actual_count ?? 0
    const entry = totals.get(discipline) ?? { planned: 0, actual: 0 }
    entry.planned += planned
    entry.actual += actual
    totals.set(discipline, entry)
  })

  return requiredDisciplines.map((discipline) => {
    const meta = DISCIPLINE_META[discipline]
    const data = totals.get(discipline) ?? { planned: 0, actual: 0 }
    const fulfillment =
      data.planned > 0 ? Math.round((data.actual / data.planned) * 100) : data.actual > 0 ? 100 : 0
    return {
      discipline,
      label: meta.label,
      planned: data.planned,
      actual: data.actual,
      fulfillmentPct: Math.min(fulfillment, 999),
      shortfall: Math.max(data.planned - data.actual, 0),
      icon: meta.icon,
      color: meta.color,
    }
  })
}

export async function buildStaffingIngestion(params: {
  eventId: string
  companyId?: string
}): Promise<StaffingIngestionBundle> {
  const event = await fetchEventContext(params.eventId)
  const companyId = params.companyId ?? event.company_id

  const requiredDisciplines = resolveDisciplines(event.event_type)
  await ensureDefaultRolesForEvent(companyId, params.eventId, requiredDisciplines)

  const [rolesResponse, actualsResponse, staffResponse, assignmentsResponse, incidentsResponse, attendanceResponse] =
    await Promise.all([
      supabase
        .from('staffing_roles')
        .select('*')
        .eq('company_id', companyId)
        .eq('event_id', params.eventId),
      supabase
        .from('staffing_actuals')
        .select('role_id, actual_count')
        .eq('company_id', companyId)
        .eq('event_id', params.eventId),
      supabase.from('staff').select('id, active, skill_tags').eq('company_id', companyId),
      supabase.from('staff_assignments').select('staff_id').eq('event_id', params.eventId),
      supabase
        .from('incident_logs')
        .select('priority, is_closed, created_at')
        .eq('event_id', params.eventId),
      supabase
        .from('attendance_records')
        .select('count, timestamp')
        .eq('event_id', params.eventId)
        .order('timestamp', { ascending: false })
        .limit(1),
    ])

  const roles = (rolesResponse.data ?? []) as StaffingRoleData[]
  const actualsMap = new Map(
    (actualsResponse.data ?? []).map((row) => [row.role_id as string, row.actual_count as number])
  )
  const disciplines = aggregateDisciplines(roles, actualsMap, requiredDisciplines)

  const staffRows = staffResponse.data ?? []
  const assignmentIds = new Set((assignmentsResponse.data ?? []).map((row) => row.staff_id))

  const staffAvailability = {
    total: staffRows.length,
    active: staffRows.filter((row) => row.active).length,
    assignedToEvent: staffRows.filter((row) => assignmentIds.has(row.id)).length,
    availableEstimate: staffRows.filter((row) => row.active && !assignmentIds.has(row.id)).length,
    skillTagCounts: staffRows.reduce<Record<string, number>>((acc, row) => {
      if (Array.isArray(row.skill_tags)) {
        row.skill_tags.forEach((tag: unknown) => {
          if (typeof tag === 'string' && tag.trim().length > 0) {
            const normalized = tag.trim().toLowerCase()
            acc[normalized] = (acc[normalized] ?? 0) + 1
          }
        })
      }
      return acc
    }, {}),
  }

  const incidents = incidentsResponse.data ?? []
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  const incidentPressure = {
    openIncidents: incidents.filter((incident) => !incident.is_closed).length,
    highPriority: incidents.filter((incident) =>
      incident.priority ? ['high', 'urgent', 'critical'].includes(incident.priority.toLowerCase()) : false
    ).length,
    lastHour: incidents.filter((incident) => {
      if (!incident.created_at) return false
      return new Date(incident.created_at).getTime() >= oneHourAgo
    }).length,
  }

  const latestAttendance = attendanceResponse.data?.[0]
  const attendance = {
    expected: event.expected_attendance,
    current: latestAttendance?.count ?? event.current_attendance,
    lastRecordAt: latestAttendance?.timestamp ?? null,
  }

  return {
    eventId: params.eventId,
    companyId,
    eventType: event.event_type,
    requiredDisciplines,
    disciplines,
    staffAvailability,
    incidentPressure,
    attendance,
  }
}

