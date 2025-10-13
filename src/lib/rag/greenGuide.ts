import { getServiceSupabaseClient } from '@/lib/supabaseServer'

export interface GreenGuidePassage {
  id: string | number
  content: string
  page?: number
  heading?: string
}

const SYNONYMS: Record<string, string[]> = {
  ingress: ['entry', 'gate entry', 'queuing', 'arrival', 'gates', 'queue management'],
  egress: ['exit', 'dispersal', 'egress routes', 'crowd exit'],
  crowd: ['crowd management', 'density', 'flow', 'audience'],
  queue: ['queuing', 'queues'],
  breach: ['entry breach', 'gate breach']
}

function prettifySnippet(text: string, terms: string[]): string {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  if (!t) return t
  const sentences = t.split(/(?<=[\.!?])\s+/)
  const hit = sentences.find(s => terms.some(k => s.toLowerCase().includes(k))) || sentences.slice(0, 2).join(' ')
  const cleaned = (hit || t).trim()
  const startsClean = /^[A-Z0-9]/.test(cleaned)
  const endsClean = /[\.!?]$/.test(cleaned)
  return `${startsClean ? '' : '… '}${cleaned}${endsClean ? '' : ' …'}`
}

export async function searchGreenGuide(query: string, k = 5): Promise<GreenGuidePassage[]> {
  const supabase = getServiceSupabaseClient()
  const apiKey = process.env.OPENAI_API_KEY
  const lower = String(query || '').toLowerCase()
  const extra = Object.keys(SYNONYMS).filter(k => lower.includes(k)).flatMap(k => SYNONYMS[k])
  const searchText = extra.length ? `${query} ${extra.join(' ')}` : query
  const stopwords = new Set(['the','and','or','to','of','in','on','for','with','at','by','a','an','is','are','be','as'])
  const keyTerms = lower.split(/[^a-z0-9]+/).filter(w => w.length > 3 && !stopwords.has(w)).slice(0, 8)

  if (!apiKey) {
    const terms = lower.split(/\s+/).filter(Boolean)
    let simpleQuery = supabase.from('green_guide_chunks').select('id, content, page, heading')
    for (const term of terms.slice(0, 3)) {
      simpleQuery = simpleQuery.ilike('content', `%${term}%`)
    }
    const { data: simple } = await simpleQuery.limit(Math.min(Number(k) || 5, 10))
    return (simple || [])
      .filter((r: any) => typeof r?.content === 'string')
      .filter((r: any) => r.content.length > 40)
      .map((r: any) => ({ id: r.id, content: prettifySnippet(r.content, keyTerms), page: r.page, heading: r.heading }))
  }

  const embedResp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: searchText })
  })
  if (!embedResp.ok) return []
  const embedJson = await embedResp.json()
  const embedding: number[] = embedJson?.data?.[0]?.embedding
  if (!embedding) return []

  const { data, error } = await supabase.rpc('match_green_guide_chunks', {
    query_embedding: embedding,
    match_count: Math.min(Number(k) || 5, 10)
  })
  if (!error && data) {
    return (data || [])
      .filter((r: any) => typeof r?.content === 'string' && r.content.length > 40)
      .map((r: any) => ({ id: r.id, content: prettifySnippet(r.content, keyTerms), page: r.page, heading: r.heading }))
  }

  const terms = lower.split(/\s+/).filter(Boolean)
  let simpleQuery = supabase.from('green_guide_chunks').select('id, content, page, heading')
  for (const term of terms.slice(0, 3)) {
    simpleQuery = simpleQuery.ilike('content', `%${term}%`)
  }
  const { data: simple } = await simpleQuery.limit(Math.min(Number(k) || 5, 10))
  return (simple || [])
    .filter((r: any) => typeof r?.content === 'string')
    .filter((r: any) => r.content.length > 40)
    .map((r: any) => ({ id: r.id, content: prettifySnippet(r.content, keyTerms), page: r.page, heading: r.heading }))
}

export function formatPassages(passages: GreenGuidePassage[]): string {
  return passages
    .map((p, idx) => `#${idx + 1} [page ${p.page ?? '?'} - ${p.heading ?? 'untitled'}]\n${p.content}`)
    .join('\n\n')
}


