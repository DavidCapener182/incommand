import crypto from 'crypto'

export function normalizeOccurrence(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildIncidentHash(incidentType: string, occurrence: string): string {
  const base = `${String(incidentType || '').toLowerCase()}|${normalizeOccurrence(occurrence)}`
  return crypto.createHash('sha256').update(base).digest('hex')
}


