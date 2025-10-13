/**
 * Ingest Green Guide PDF into Supabase pgvector table
 * - Extract text (simple PDF.js extraction via dynamic import)
 * - Chunk text (≈700 chars, 120 overlap)
 * - Embed with OpenAI text-embedding-3-small
 * - Upsert into green_guide_chunks
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!

if (!supabaseUrl || !serviceKey || !OPENAI_API_KEY) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function loadPdfText(filePath: string): Promise<{ page: number; text: string }[]> {
  const pdfjsLib = await import('pdfjs-dist')
  const { getDocument } = await import('pdfjs-dist')
  // @ts-ignore
  const doc = await getDocument(filePath).promise
  const pages: { page: number; text: string }[] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    // @ts-ignore
    const content = await page.getTextContent()
    const text = content.items.map((i: any) => i.str).join(' ')
    pages.push({ page: p, text })
  }
  return pages
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

async function embed(texts: string[]): Promise<number[][]> {
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: texts })
  })
  if (!resp.ok) {
    const t = await resp.text()
    throw new Error(`Embedding failed: ${t}`)
  }
  const json = await resp.json()
  return json.data.map((d: any: any) => d.embedding)
}

async function main() {
  const pdfPath = path.resolve(process.cwd(), 'docs', 'green-guide.pdf')
  console.log('Reading PDF:', pdfPath)
  const pages = await loadPdfText(pdfPath)
  console.log('Pages:', pages.length)

  const rows: { content: string; page: number; heading: string | null; embedding: number[] }[] = []
  for (const { page, text } of pages) {
    const chunks = chunkText(text)
    for (const c of chunks) {
      rows.push({ content: c, page, heading: null, embedding: [] })
    }
  }
  console.log('Chunks:', rows.length)

  // Batch embed (OpenAI supports batching up to many inputs; keep modest)
  const batchSize = 64
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const embeddings = await embed(batch.map(r => r.content))
    embeddings.forEach((e, idx) => batch[idx].embedding = e)
    console.log(`Embedded ${Math.min(i + batch.length, rows.length)} / ${rows.length}`)
  }

  // Upsert to Supabase (chunked)
  const upsertBatch = 200
  for (let i = 0; i < rows.length; i += upsertBatch) {
    const batch = rows.slice(i, i + upsertBatch)
    const payload = batch.map(r => ({ content: r.content, page: r.page, heading: r.heading, embedding: r.embedding as any }))
    const { error } = await supabase.from('green_guide_chunks').upsert(payload)
    if (error) throw new Error(`Upsert error: ${error.message}`)
    console.log(`Upserted ${Math.min(i + batch.length, rows.length)} / ${rows.length}`)
  }

  console.log('✅ Ingest complete')
}

main().catch(err => {
  console.error('❌ Ingest failed:', err)
  process.exit(1)
})


