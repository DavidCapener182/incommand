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

  return (data || []) as IncidentSOPStep[]
}

export default fetchIncidentSOPSteps
