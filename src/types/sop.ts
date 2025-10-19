export interface IncidentSOPStep {
  id: string
  incident_type: string
  step_order: number
  description: string
  is_required: boolean
  linked_action_id?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface IncidentSOP {
  incident_type: string
  steps: IncidentSOPStep[]
}
