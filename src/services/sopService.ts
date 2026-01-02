import { supabase } from '@/lib/supabase'
import type { IncidentSOPStep } from '@/types/sop'

export async function fetchIncidentSOPSteps(incidentType: string): Promise<IncidentSOPStep[]> {
  if (!incidentType) {
    return []
  }

  const { data, error } = await supabase
    .from('incident_sops')
    .select('*')
    .eq('incident_type', incidentType)
    .order('step_order', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const steps = (data ?? []) as IncidentSOPStep[]

  return steps.map((step) => ({
    ...step,
    description: step?.description ?? ''
  })) as IncidentSOPStep[]
}

export default fetchIncidentSOPSteps
