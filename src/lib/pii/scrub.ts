export function scrubPII(input: string): string {
  const text = String(input || '')
  // Remove emails
  let out = text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
  // Remove phone numbers (simple patterns)
  out = out.replace(/(?:\+?\d[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/g, '[phone]')
  // Remove IDs that look like UUIDs
  out = out.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, '[id]')
  // Collapse whitespace
  out = out.replace(/\s+/g, ' ').trim()
  return out
}


