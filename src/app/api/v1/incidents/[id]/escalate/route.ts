import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

import { cookies } from 'next/headers'

import { z } from 'zod'

import { Ratelimit } from '@upstash/ratelimit'

import { Redis } from '@upstash/redis'


import { logger } from '@/lib/logger'

import { broadcastIncidentSummaryUpdateByIncidentId } from '@/lib/incidentSummaryBroadcast'


const escalationSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(1, 'Comment is required')
    .max(500, 'Comment must be 500 characters or fewer'),
  recipient_role: z.enum(['manager', 'security_lead', 'control_room']),
  notify_via: z.enum(['email', 'sms', 'both']).optional().default('email'),
})

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_ESCALATIONS_PER_WINDOW = 5

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

const rateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_ESCALATIONS_PER_WINDOW, '1 h'),
    })
  : null

const fallbackRateMap = new Map<string, { count: number; resetAt: number }>()

async function checkRateLimit(incidentId: string): Promise<boolean> {
  const key = `incident-escalate:${incidentId}`

  if (rateLimiter) {
    try {
      const { success } = await rateLimiter.limit(key)
      return success
    } catch (error) {
      logger.warn('Rate limiter failed, falling back to in-memory limit', {
        component: 'IncidentEscalationAPI',
        action: 'checkRateLimit',
        incidentId,
        error,
      })
    }
  }

  const now = Date.now()
  const entry = fallbackRateMap.get(key)

  if (!entry || now > entry.resetAt) {
    fallbackRateMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= MAX_ESCALATIONS_PER_WINDOW) {
    return false
  }

  entry.count += 1
  return true
}

function sanitizeComment(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim()
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const incidentId = params?.id?.trim()

    if (!incidentId) {
      return NextResponse.json({ error: 'Incident id is required' }, { status: 400 })
    }

    if (!(await checkRateLimit(incidentId))) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for this incident. Try again in one hour.' },
        { status: 429 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch (error) {
      logger.warn('Failed to parse escalation payload', {
        component: 'IncidentEscalationAPI',
        action: 'parseRequest',
        incidentId,
        error,
      })
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const result = escalationSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
    }

    const { comment, notify_via, recipient_role } = result.data
    const sanitizedComment = sanitizeComment(comment)

    const { data: incident, error: incidentError } = await supabase
      .from('incident_logs')
      .select('id, escalation_level, status, event_id')
      .eq('id', incidentId)
      .maybeSingle()

    if (incidentError || !incident) {
      logger.error('Incident not found for escalation', incidentError, {
        component: 'IncidentEscalationAPI',
        action: 'loadIncident',
        incidentId,
      })
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    const nextLevel = (incident.escalation_level ?? 0) + 1

    const { data: escalationRecord, error: insertError } = await supabase
      .from('incident_escalations')
      .insert({
        incident_id: incidentId,
        escalation_level: nextLevel,
        notes: sanitizedComment,
        escalated_by: null,
        supervisor_notified: false,
      })
      .select('id, escalated_at, escalated_by')
      .maybeSingle()

    if (insertError || !escalationRecord) {
      logger.error('Failed to create incident escalation record', insertError, {
        component: 'IncidentEscalationAPI',
        action: 'insertEscalation',
        incidentId,
      })
      return NextResponse.json({ error: 'Failed to log escalation' }, { status: 500 })
    }

    const { error: updateError } = await supabase
      .from('incident_logs')
      .update({
        escalation_level: nextLevel,
        escalated: true,
        escalation_notes: sanitizedComment,
        escalate_at: null,
        status:
          typeof incident.status === 'string' && incident.status.toLowerCase() === 'closed'
            ? incident.status
            : 'in_progress',
      })
      .eq('id', incidentId)

    if (updateError) {
      logger.error('Failed to update incident after escalation', updateError, {
        component: 'IncidentEscalationAPI',
        action: 'updateIncident',
        incidentId,
      })
      return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 })
    }

    // Broadcast incident summary update
    await broadcastIncidentSummaryUpdateByIncidentId(incidentId)

    logger.info('Incident escalated successfully', {
      component: 'IncidentEscalationAPI',
      action: 'escalated',
      incidentId,
      notify_via,
      recipient_role,
    })

    return NextResponse.json(
      {
        escalation_id: escalationRecord.id,
        escalated_at: escalationRecord.escalated_at,
        escalated_by: escalationRecord.escalated_by,
        notification_status: 'pending',
        notify_via,
        recipient_role,
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Unexpected error escalating incident', error, {
      component: 'IncidentEscalationAPI',
      action: 'unexpected',
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
