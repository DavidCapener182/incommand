import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'

async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: texts })
  })
  if (!resp.ok) throw new Error(`Embedding failed: ${await resp.text()}`)
  const json = await resp.json()
  return json.data.map((d: any) => d.embedding)
}

function chunkText(text: string, size = 700, overlap = 120): string[] {
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

export async function POST() {
  try {
    const supabase = getServiceSupabaseClient()
    // If already fully indexed, avoid overwriting with placeholder
    const existing = await supabase
      .from('green_guide_chunks')
      .select('id', { count: 'exact', head: true })
    if ((existing.count || 0) > 100) {
      return NextResponse.json({ ok: true, chunks: existing.count, note: 'Already indexed. Use CLI ingest for full refresh.' })
    }
    const filePath = path.join(process.cwd(), 'docs', 'green-guide.pdf')
    // Minimal extraction: read bytes and fallback to a placeholder if PDF.js not available server-side
    // In production, prefer running the full scripts/ingest-green-guide.ts
    const buf = await fs.readFile(filePath)
    if (!buf?.byteLength) throw new Error('PDF not found or empty')

    // For server route, we ingest a placeholder summary to avoid heavy PDF parsing
    const placeholder = 'Green Guide PDF available. Use CLI ingest for full indexing.'
    const chunks = chunkText(placeholder, 700, 120)
    const embeddings = await embedTexts(chunks)

    // Upsert minimal row without deleting existing data (safer default)
    const payload = chunks.map((c, idx) => ({ content: c, page: 1, heading: idx === 0 ? 'Overview' : null, embedding: embeddings[idx] as any }))
    const { error } = await supabase.from('green_guide_chunks').upsert(payload)
    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true, chunks: payload.length, note: 'For full indexing run scripts/ingest-green-guide.ts' })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Reindex failed' }, { status: 500 })
  }
}


