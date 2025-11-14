import { getSupabaseClient } from '@/lib/mcp/supabase'
import { buildStaffingIngestion } from '@/lib/staffing/dataIngestion'
import type { StaffingDiscipline } from '@/lib/database/staffing'
import { DISCIPLINE_META } from '@/lib/staffing/discipline'
import { createTasksForStaffingShortfalls } from '@/lib/staffing/taskCreator'

const supabase = getSupabaseClient()

export type DisciplineForecast = {
  discipline: StaffingDiscipline
  label: string
  recommended: number
  planned: number
  actual: number
  shortfall: number
  confidence: number
  risk: 'low' | 'medium' | 'high'
}

export interface StaffingForecastResult {
  eventId: string
  companyId: string
  generatedAt: string
  eventType?: string | null
  utilisationPct: number
  riskLevel: 'low' | 'medium' | 'high'
  disciplines: DisciplineForecast[]
}

function determineRisk(shortfall: number, planned: number): 'low' | 'medium' | 'high' {
  if (planned === 0) return 'low'
  const pct = shortfall / planned
  if (pct >= 0.25) return 'high'
  if (pct >= 0.1) return 'medium'
  return 'low'
}

function overallRiskFromDisciplines(disciplines: DisciplineForecast[]): 'low' | 'medium' | 'high' {
  if (disciplines.some((d) => d.risk === 'high')) return 'high'
  if (disciplines.some((d) => d.risk === 'medium')) return 'medium'
  return 'low'
}

export async function generateStaffingForecast(params: {
  eventId: string
  companyId?: string
}): Promise<StaffingForecastResult> {
  const ingestion = await buildStaffingIngestion(params)

  const incidentMultiplier =
    1 +
    ingestion.incidentPressure.highPriority * 0.05 +
    ingestion.incidentPressure.openIncidents * 0.02 +
    ingestion.incidentPressure.lastHour * 0.01

  const expectedAttendance = ingestion.attendance.expected ?? ingestion.attendance.current ?? 0
  const currentAttendance = ingestion.attendance.current ?? expectedAttendance
  const attendanceMultiplier =
    expectedAttendance > 0 ? Math.min(currentAttendance / expectedAttendance, 1.5) : 1

  const utilisationDenominator = ingestion.disciplines.reduce(
    (sum, discipline) => sum + discipline.planned,
    0
  )
  const utilisationNumerator = ingestion.disciplines.reduce(
    (sum, discipline) => sum + Math.min(discipline.actual, discipline.planned),
    0
  )

  const disciplines: DisciplineForecast[] = ingestion.disciplines.map((discipline) => {
    const baseline = Math.max(discipline.planned, 5)
    const recommendedRaw =
      baseline * incidentMultiplier * attendanceMultiplier * (discipline.fulfillmentPct < 75 ? 1.1 : 1)
    const recommended = Math.max(Math.round(recommendedRaw), discipline.planned)
    const shortfall = Math.max(recommended - discipline.actual, 0)
    const risk = determineRisk(shortfall, recommended)
    const confidence = Math.min(
      0.9,
      0.6 +
        (ingestion.staffAvailability.active / Math.max(ingestion.staffAvailability.total, 1)) * 0.3 -
        (risk === 'high' ? 0.2 : risk === 'medium' ? 0.1 : 0)
    )

    return {
      discipline: discipline.discipline,
      label: DISCIPLINE_META[discipline.discipline].label,
      recommended,
      planned: discipline.planned,
      actual: discipline.actual,
      shortfall,
      confidence,
      risk,
    }
  })

  const result: StaffingForecastResult = {
    eventId: ingestion.eventId,
    companyId: ingestion.companyId,
    eventType: ingestion.eventType,
    generatedAt: new Date().toISOString(),
    utilisationPct:
      utilisationDenominator > 0
        ? Math.round((utilisationNumerator / utilisationDenominator) * 100)
        : 0,
    riskLevel: overallRiskFromDisciplines(disciplines),
    disciplines,
  }

  // Persist results for history / dashboards
  const payload = disciplines.map((discipline) => ({
    company_id: ingestion.companyId,
    event_id: ingestion.eventId,
    discipline: discipline.discipline,
    predicted_required: discipline.recommended,
    confidence: discipline.confidence,
    methodology: 'auto-forecast:v1',
    generated_by: null,
  }))

  const { error } = await supabase.from('staffing_forecasts').insert(payload)
  if (error) {
    console.error('Failed to persist staffing forecast snapshot', error)
  }

  await createTasksForStaffingShortfalls(result)

  return result
}

