import { z } from 'zod'

export interface IncidentAIResult {
  incidentType: string
  description: string
  callsign: string
  location: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  confidence: number
  actionTaken?: string
}

const ResultSchema = z.object({
  incidentType: z.string().catch(''),
  description: z.string().catch(''),
  callsign: z.string().catch(''),
  location: z.string().catch(''),
  priority: z.enum(['urgent','high','medium','low']).catch('medium'),
  confidence: z.number().min(0).max(1).catch(0),
  actionTaken: z.string().optional().catch('')
})

export function extractIncidentJson(content: string, fallbackInput?: string): IncidentAIResult | null {
  if (!content) return null
  const fence = content.match(/```json[\s\S]*?```|```[\s\S]*?```/i)
  const candidate = fence ? fence[0].replace(/```json|```/gi, '').trim() : content
  const match = candidate.match(/\{[\s\S]*?\}/)
  if (!match) return null
  try {
    const parsed = ResultSchema.parse(JSON.parse(match[0]))
    const priority = (parsed.priority || 'medium').toLowerCase() as IncidentAIResult['priority']
    return {
      incidentType: (parsed.incidentType || '').trim(),
      description: (parsed.description || fallbackInput || '').toString().trim(),
      callsign: (parsed.callsign || '').trim(),
      location: (parsed.location || '').trim(),
      priority: (['urgent','high','medium','low'] as const).includes(priority) ? priority : 'medium',
      confidence: Math.max(0, Math.min(1, Number((parsed as any).confidence ?? 0))),
      actionTaken: (parsed.actionTaken || '').toString().trim(),
    }
  } catch {
    return null
  }
}


