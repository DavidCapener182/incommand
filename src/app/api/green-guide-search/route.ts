import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceSupabaseClient()
    const { query, topK = 5 } = await req.json()
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 })
    }

    // Expand synonyms to improve recall (helpful when terms like "ingress" aren't in source)
    const SYNONYMS: Record<string, string[]> = {
      ingress: ['entry', 'gate entry', 'queuing', 'arrival', 'gates', 'queue management'],
      egress: ['exit', 'dispersal', 'egress routes', 'crowd exit'],
      crowd: ['crowd management', 'density', 'flow', 'audience'],
      queue: ['queuing', 'queues'],
      breach: ['entry breach', 'gate breach']
    }
    const lower = String(query || '').toLowerCase()
    const extra = Object.keys(SYNONYMS)
      .filter(k => lower.includes(k))
      .flatMap(k => SYNONYMS[k])
    const searchText = extra.length ? `${query} ${extra.join(' ')}` : query

    // Utility to return clean sentence-level snippets
    const stopwords = new Set(['the','and','or','to','of','in','on','for','with','at','by','a','an','is','are','be','as'])
    const keyTerms = lower.split(/[^a-z0-9]+/).filter(w => w.length > 3 && !stopwords.has(w)).slice(0, 8)
    function prettifySnippet(text: string): string {
      const t = (text || '').replace(/\s+/g, ' ').trim()
      if (!t) return t
      const sentences = t.split(/(?<=[\.!?])\s+/)
      const hit = sentences.find(s => keyTerms.some(k => s.toLowerCase().includes(k))) || sentences.slice(0, 2).join(' ')
      const cleaned = (hit || t).trim()
      const startsClean = /^[A-Z0-9]/.test(cleaned)
      const endsClean = /[\.!?]$/.test(cleaned)
      return `${startsClean ? '' : '… '}${cleaned}${endsClean ? '' : ' …'}`
    }

    // Get embedding from OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const embedResp = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: searchText
      })
    })
    if (!embedResp.ok) {
      const msg = await embedResp.text()
      return NextResponse.json({ error: 'Embedding failed', details: msg }, { status: 500 })
    }
    const embedJson = await embedResp.json()
    const embedding: number[] = embedJson?.data?.[0]?.embedding
    if (!embedding) {
      return NextResponse.json({ error: 'No embedding returned' }, { status: 500 })
    }

    // Try RPC with pgvector similarity first
    const { data, error } = await supabase.rpc('match_green_guide_chunks', {
      query_embedding: embedding,
      match_count: Math.min(Number(topK) || 5, 10)
    })

    const sanitize = (items: any[]) =>
      (items || [])
        .filter((r: any) => typeof r?.content === 'string')
        .filter((r: any) => r.content.length > 40)
        .filter((r: any) => !/use cli ingest/i.test(r.content))
        .map((r: any) => ({ ...r, content: prettifySnippet(r.content) }))

    if (error || !data) {
      // Fallback: fetch embeddings and rank in Node (works without RPC)
      const { data: rows, error: rawErr } = await supabase
        .from('green_guide_chunks')
        .select('id, content, page, heading, embedding')
        .limit(2000)
      if (rawErr) {
        return NextResponse.json({ error: 'Query failed', details: rawErr.message }, { status: 500 })
      }

      const norm = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1
      const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * (b[i] || 0), 0)
      const embNorm = norm(embedding)

      const scored = sanitize(rows || [])
        .filter((r: any) => Array.isArray(r.embedding))
        .map((r: any) => {
          const s = dot(embedding, r.embedding as number[]) / (embNorm * norm(r.embedding as number[]))
          return { ...r, similarity: s }
        })
        .sort((a: any, b: any) => (b.similarity ?? 0) - (a.similarity ?? 0))
        .slice(0, Math.min(Number(topK) || 5, 10))
        .map(({ id, content, page, heading }) => ({ id, content, page, heading }))

      if (scored.length > 0) {
        return NextResponse.json({ results: scored })
      }

      // Final fallback: simple text search when embeddings unavailable
      const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
      let simpleQuery = supabase.from('green_guide_chunks').select('id, content, page, heading')
      for (const term of terms.slice(0, 3)) {
        simpleQuery = simpleQuery.ilike('content', `%${term}%`)
      }
      const { data: simple, error: simpleErr } = await simpleQuery.limit(Math.min(Number(topK) || 5, 10))
      if (simpleErr) {
        return NextResponse.json({ error: 'Query failed', details: simpleErr.message }, { status: 500 })
      }
      return NextResponse.json({ results: sanitize(simple || []) })
    }

    return NextResponse.json({ results: sanitize(data || []) })
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error', details: e?.message }, { status: 500 })
  }
}


