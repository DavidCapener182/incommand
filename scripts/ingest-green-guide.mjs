// ESM ingest script for Green Guide PDF
import path from 'path'
import fs from 'fs/promises'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!supabaseUrl || !serviceKey || !OPENAI_API_KEY) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

function chunkText(text, size = 700, overlap = 120) {
  const chunks = []
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

async function embed(texts) {
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: texts })
  })
  if (!resp.ok) {
    const t = await resp.text()
    throw new Error(`Embedding failed: ${t}`)
  }
  const json = await resp.json()
  return json.data.map(d => d.embedding)
}

async function main() {
  const pdfPath = path.resolve(process.cwd(), 'docs', 'green-guide.pdf')
  console.log('Reading PDF:', pdfPath)
  const buf = await fs.readFile(pdfPath)
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buf), disableWorker: true })
  const doc = await loadingTask.promise
  let text = ''
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    const strings = content.items.map(i => i.str)
    text += strings.join(' ') + '\n'
  }
  const fullText = text.replace(/\u0000/g, '')
  console.log('Text length:', fullText.length)

  const chunks = chunkText(fullText)
  console.log('Chunks:', chunks.length)

  const rows = []
  const batchSize = 64
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    const embeddings = await embed(batch)
    for (let j = 0; j < batch.length; j++) {
      rows.push({ content: batch[j], page: null, heading: null, embedding: embeddings[j] })
    }
    console.log(`Embedded ${Math.min(i + batch.length, chunks.length)} / ${chunks.length}`)
  }

  const upsertBatch = 200
  for (let i = 0; i < rows.length; i += upsertBatch) {
    const payload = rows.slice(i, i + upsertBatch).map(r => ({
      content: r.content,
      page: r.page,
      heading: r.heading,
      embedding: r.embedding,
    }))
    const { error } = await supabase.from('green_guide_chunks').upsert(payload)
    if (error) throw new Error(`Upsert error: ${error.message}`)
    console.log(`Upserted ${Math.min(i + payload.length, rows.length)} / ${rows.length}`)
  }

  console.log('✅ Ingest complete')
}

main().catch(err => {
  console.error('❌ Ingest failed:', err)
  process.exit(1)
})


