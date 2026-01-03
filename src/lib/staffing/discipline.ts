import type { StaffingDiscipline } from '@/lib/database/staffing'

export const DISCIPLINE_META: Record<StaffingDiscipline, { label: string; icon: string; color: string }> = {
  security: { label: 'Security', icon: 'shield', color: '#1d4ed8' },
  police: { label: 'Police', icon: 'badge', color: '#0f172a' },
  medical: { label: 'Medical', icon: 'heart-pulse', color: '#15803d' },
  stewarding: { label: 'Stewarding', icon: 'users', color: '#ea580c' },
  other: { label: 'Other', icon: 'grid', color: '#6b7280' },
}

const FOOTBALL_KEYWORDS = ['football', 'soccer', 'match', 'fixture']

export function resolveDisciplines(eventType?: string | null): StaffingDiscipline[] {
  if (!eventType) return ['security']
  const normalized = eventType.toLowerCase()
  if (FOOTBALL_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return ['security', 'police', 'medical']
  }
  return ['security']
}

