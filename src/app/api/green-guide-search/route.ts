import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { query, topK = 5 } = await req.json()
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 })
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
        input: query
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

    // RPC or SQL using pgvector; use raw SQL here via supabase-js
    const { data, error } = await supabase.rpc('match_green_guide_chunks', {
      query_embedding: embedding,
      match_count: Math.min(Number(topK) || 5, 10)
    })

    if (error) {
      // Fallback to manual query if RPC not present
      const { data: raw, error: rawErr } = await supabase
        .from('green_guide_chunks')
        .select('id, content, page, heading')
        .limit(Math.min(Number(topK) || 5, 10))
      if (rawErr) {
        return NextResponse.json({ error: 'Query failed', details: rawErr.message }, { status: 500 })
      }
      return NextResponse.json({ results: raw || [] })
    }

    return NextResponse.json({ results: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error', details: e?.message }, { status: 500 })
  }
}


