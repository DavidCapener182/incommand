export function extractJsonFromText(text: string): string {
  if (typeof text !== 'string') return '';
  const fenced = text.match(/```json[\s\S]*?```|```[\s\S]*?```/i);
  const candidate = fenced ? fenced[0].replace(/```json|```/gi, '').trim() : text.trim();
  return candidate;
}


