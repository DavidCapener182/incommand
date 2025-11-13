/**
 * Inquiry Pack API Route
 * Feature 3: Golden Thread Decision Logging
 * 
 * GET /api/decisions/[id]/inquiry-pack - Generate inquiry pack
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import type { InquiryPackOptions } from '@/types/decisions'

export const dynamic = 'force-dynamic'

// GET /api/decisions/[id]/inquiry-pack - Generate inquiry pack
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<any>({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decisionId = params.id
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'json') as 'pdf' | 'json' | 'html'
    const includeEvidence = searchParams.get('include_evidence') !== 'false'
    const includeAnnotations = searchParams.get('include_annotations') !== 'false'
    const eventId = searchParams.get('event_id') // If provided, generate pack for all decisions in event

    // Verify company access
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    let decisions: any[] = []

    if (eventId) {
      // Get all decisions for the event
      const { data: eventDecisions, error: decisionsError } = await supabase
        .from('decisions')
        .select(`
          *,
          decision_evidence (*),
          decision_annotations (*)
        `)
        .eq('event_id', eventId)
        .eq('company_id', profile.company_id)
        .order('timestamp', { ascending: true })

      if (decisionsError) {
        return NextResponse.json(
          { error: 'Failed to fetch decisions', details: decisionsError.message },
          { status: 500 }
        )
      }

      decisions = eventDecisions || []
    } else {
      // Get single decision
      const { data: decision, error: decisionError } = await supabase
        .from('decisions')
        .select(`
          *,
          decision_evidence (*),
          decision_annotations (*)
        `)
        .eq('id', decisionId)
        .eq('company_id', profile.company_id)
        .single()

      if (decisionError || !decision) {
        return NextResponse.json(
          { error: 'Decision not found' },
          { status: 404 }
        )
      }

      decisions = [decision]
    }

    // Get linked incidents
    const allIncidentIds = decisions.flatMap(d => d.linked_incident_ids || [])
    let linkedIncidents: any[] = []
    if (allIncidentIds.length > 0) {
      const { data: incidents } = await supabase
        .from('incident_logs')
        .select('id, incident_type, priority, location, timestamp, occurrence, action_taken')
        .in('id', allIncidentIds)
      
      linkedIncidents = incidents || []
    }

    // Build inquiry pack data
    const inquiryPack = {
      generated_at: new Date().toISOString(),
      generated_by: user.id,
      event_id: eventId || decisions[0]?.event_id,
      decision_count: decisions.length,
      decisions: decisions.map(decision => ({
        id: decision.id,
        timestamp: decision.timestamp,
        trigger_issue: decision.trigger_issue,
        options_considered: decision.options_considered,
        information_available: decision.information_available,
        decision_taken: decision.decision_taken,
        rationale: decision.rationale,
        decision_owner: {
          id: decision.decision_owner_id,
          callsign: decision.decision_owner_callsign,
          role_level: decision.role_level,
        },
        location: decision.location,
        follow_up_review_time: decision.follow_up_review_time,
        is_locked: decision.is_locked,
        locked_at: decision.locked_at,
        locked_by: decision.locked_by_user_id,
        linked_incidents: includeEvidence ? linkedIncidents.filter(i => 
          decision.linked_incident_ids?.includes(i.id)
        ) : [],
        evidence: includeEvidence ? (decision.decision_evidence || []) : [],
        annotations: includeAnnotations ? (decision.decision_annotations || []) : [],
      })),
      metadata: {
        format,
        includes_evidence: includeEvidence,
        includes_annotations: includeAnnotations,
      },
    }

    // Return based on format
    if (format === 'json') {
      return NextResponse.json(inquiryPack, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="inquiry-pack-${decisionId || eventId}-${Date.now()}.json"`,
        },
      })
    }

    if (format === 'html') {
      // Simple HTML format (can be enhanced later)
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Inquiry Pack - ${decisionId || eventId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    .decision { border: 1px solid #ddd; padding: 20px; margin: 20px 0; }
    .metadata { background: #f5f5f5; padding: 10px; margin: 10px 0; }
    .evidence-item { margin: 10px 0; padding: 10px; background: #f9f9f9; }
  </style>
</head>
<body>
  <h1>Inquiry Pack</h1>
  <div class="metadata">
    <p><strong>Generated:</strong> ${inquiryPack.generated_at}</p>
    <p><strong>Decisions:</strong> ${inquiryPack.decision_count}</p>
  </div>
    ${inquiryPack.decisions.map((d: any, i: number) => `
    <div class="decision">
      <h2>Decision ${i + 1}</h2>
      <p><strong>Time:</strong> ${d.timestamp}</p>
      <p><strong>Trigger:</strong> ${d.trigger_issue}</p>
      <p><strong>Decision:</strong> ${d.decision_taken}</p>
      <p><strong>Rationale:</strong> ${d.rationale}</p>
      ${d.evidence.length > 0 ? `<h3>Evidence (${d.evidence.length})</h3>` : ''}
        ${d.evidence.map((e: any) => `<div class="evidence-item">${e.title}: ${e.description || ''}</div>`).join('')}
      ${d.annotations.length > 0 ? `<h3>Annotations (${d.annotations.length})</h3>` : ''}
        ${d.annotations.map((a: any) => `<div class="evidence-item">${a.annotation_text}</div>`).join('')}
    </div>
  `).join('')}
</body>
</html>
      `.trim()

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="inquiry-pack-${decisionId || eventId}-${Date.now()}.html"`,
        },
      })
    }

    // PDF format (placeholder - would need PDF library)
    return NextResponse.json(
      { error: 'PDF format not yet implemented', details: 'Please use format=json or format=html' },
      { status: 501 }
    )

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

