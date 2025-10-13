import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabaseClient, logAIUsage } from '@/lib/supabaseServer'
import { featureFlags } from '@/config/featureFlags'
import { BestPracticeApiRequest, BestPracticeApiResponse } from '@/types/bestPractice'
import { scrubPII } from '@/lib/pii/scrub'
import { buildIncidentHash } from '@/lib/hash/incidentHash'
import { searchGreenGuide, formatPassages } from '@/lib/rag/greenGuide'
import { generateBestPractice } from '@/lib/llm/bestPractice'

export async function POST(req: NextRequest) {
  try {
    if (!featureFlags.best_practice_enabled) {
      return NextResponse.json<BestPracticeApiResponse>({ bestPractice: null, reason: 'error' }, { status: 200 })
    }

    const supabase = getServiceSupabaseClient()
    const body = (await req.json()) as BestPracticeApiRequest
    const incidentType = String(body?.incidentType || '').trim()
    const occurrenceRaw = String(body?.occurrence || '')
    if (!incidentType || !occurrenceRaw) {
      return NextResponse.json({ bestPractice: null, reason: 'error' }, { status: 400 })
    }

    const userId = req.headers.get('x-user-id') || undefined
    const occurrence = scrubPII(occurrenceRaw)
    const incidentHash = buildIncidentHash(incidentType, occurrence)

    // Check cache hit
    const { data: cached } = await supabase
      .from('best_practice_cache')
      .select('best_practice, ttl_expires_at')
      .eq('incident_hash', incidentHash)
      .gt('ttl_expires_at', new Date().toISOString())
      .maybeSingle()

    if (cached?.best_practice) {
      return NextResponse.json<BestPracticeApiResponse>({ bestPractice: cached.best_practice as any, fromCache: true })
    }

    // Basic per-user rate limit: 6/min for this endpoint
    if (userId) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
      const { count } = await supabase
        .from('ai_usage_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', oneMinuteAgo)
        .eq('user_id', userId)
        .ilike('endpoint', '%/api/best-practice%')
      if ((count || 0) >= 6) {
        return NextResponse.json<BestPracticeApiResponse>({ bestPractice: null, reason: 'rate_limited' }, { status: 200 })
      }
    }

    // RAG search
    const passages = await searchGreenGuide(`${incidentType} ${occurrence}`, 5)
    if (!passages.length) {
      return NextResponse.json<BestPracticeApiResponse>({ bestPractice: null, reason: 'not_found' })
    }
    const passageText = formatPassages(passages)

    // LLM
    const model = process.env.OPENAI_BEST_PRACTICE_MODEL || 'gpt-4o-mini'
    const bp = await generateBestPractice({ incidentType, occurrence, passages: passageText })
    if (!bp || (bp.confidence ?? 0) < 0.5 || !bp.summary) {
      return NextResponse.json<BestPracticeApiResponse>({ bestPractice: null, reason: 'low_confidence' })
    }

    // Clamp and store cache
    const ttlHours = Number(process.env.BEST_PRACTICE_TTL_HOURS || 36)
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString()
    await supabase.from('best_practice_cache').upsert({
      incident_hash: incidentHash,
      incident_type: incidentType,
      occurrence_excerpt: occurrence.slice(0, 240),
      best_practice: bp as any,
      ttl_expires_at: expiresAt,
    }, { onConflict: 'incident_hash' })

    // Log usage for rate monitoring
    try { await logAIUsage({ endpoint: '/api/best-practice', model, user_id: userId }) } catch {}

    return NextResponse.json<BestPracticeApiResponse>({ bestPractice: bp, fromCache: false })
  } catch (e: any) {
    return NextResponse.json<BestPracticeApiResponse>({ bestPractice: null, reason: 'error' }, { status: 200 })
  }
}


