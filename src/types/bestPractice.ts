export type RiskLevel = 'low' | 'medium' | 'high'

export interface BestPracticePayload {
  summary: string
  checklist: string[]
  citations: string[]
  risk_level: RiskLevel
  confidence: number
}

export interface BestPracticeApiRequest {
  incidentId?: string
  incidentType: string
  occurrence: string
  eventId?: string
}

export interface BestPracticeApiResponse {
  bestPractice: BestPracticePayload | null
  fromCache?: boolean
  reason?: 'rate_limited' | 'not_found' | 'low_confidence' | 'error'
}


