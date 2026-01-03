import { NextResponse } from 'next/server'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'
import best from '@/data/greenGuideBestPractices.json'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

function* walkTexts(obj: any): Generator<string> {
  if (!obj) return
  if (typeof obj === 'string') {
    yield obj
    return
  }
  if (Array.isArray(obj)) {
    for (const v of obj) yield* walkTexts(v)
    return
  }
  if (typeof obj === 'object') {
    for (const k of Object.keys(obj)) yield* walkTexts((obj as any)[k])
  }
}

function chunkText(text: string, size = 500, overlap = 100): string[] {
  const chunks: string[] = []
  let i = 0
  while (i < text.length) {
    const end = Math.min(text.length, i + size)
    const slice = text.slice(i, end)
    chunks.push(slice)
    if (end === text.length) break
    i = end - overlap
  }
  return chunks.map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean)
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured')
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: texts })
  })
  if (!resp.ok) throw new Error(await resp.text())
  const json = await resp.json()
  return json.data.map((d: any) => d.embedding)
}

export async function POST() {
  try {
    const supabase = getServiceSupabaseClient()

    const texts: string[] = []
    for (const t of walkTexts(best)) {
      if (t && t.length > 40 && !/green guide pdf available/i.test(t)) texts.push(t)
    }

    // Dedup
    const unique = Array.from(new Set(texts))
    // Chunk long ones
    const toEmbed = unique.flatMap(t => t.length > 600 ? chunkText(t) : [t])

    let total = 0
    const batchSize = 64
    for (let i = 0; i < toEmbed.length; i += batchSize) {
      const batch = toEmbed.slice(i, i + batchSize)
      const embeddings = await embedBatch(batch)
      const payload = batch.map((c, idx) => ({ content: c, page: null as any, heading: null as any, embedding: embeddings[idx] as any }))
      const { error } = await (supabase as any).from('green_guide_chunks').upsert(payload)
      if (error) throw new Error(error.message)
      total += payload.length
    }

    return NextResponse.json({ ok: true, chunks: total, source: 'json' })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'seed failed' }, { status: 500 })
  }
}


