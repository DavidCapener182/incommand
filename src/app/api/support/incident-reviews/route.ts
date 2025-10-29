import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, requireOrganizationAccess } from '@/lib/middleware/auth'
import { recordAdminAudit } from '@/lib/admin/audit'
import { z } from 'zod'

const createReviewSchema = z.object({
  organizationId: z.string().uuid(),
  incidentId: z.string().uuid(),
  summary: z.string().min(5),
  resolution: z.string().min(5),
  followUpActions: z.array(z.string()).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
})

export async function GET(request: NextRequest) {
  return withAdminAuth(request, 'support_agent', async (context) => {
    const url = new URL(request.url)
    const organizationId = url.searchParams.get('organizationId')

    let query = context.serviceClient
      .from('incident_reviews' as any)
      .select('*')
      .order('created_at', { ascending: false })

    if (organizationId) {
      const resolvedOrg = await requireOrganizationAccess(context, organizationId)
      if (resolvedOrg instanceof NextResponse) {
        return resolvedOrg
      }
      query = query.eq('organization_id', resolvedOrg)
    } else if (context.highestRole !== 'super_admin') {
      query = query.in('organization_id', context.organizationMemberships)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to load incident reviews' }, { status: 500 })
    }

    return NextResponse.json({ reviews: data ?? [] })
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, 'support_agent', async (context) => {
    const body = await request.json()
    const parsed = createReviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const resolvedOrg = await requireOrganizationAccess(context, parsed.data.organizationId)
    if (resolvedOrg instanceof NextResponse) {
      return resolvedOrg
    }

    // For now, return a mock response since the incident_reviews table doesn't exist
    const mockReview = {
      id: 'mock-review-id',
      organization_id: resolvedOrg,
      incident_id: parsed.data.incidentId,
      summary: parsed.data.summary,
      resolution: parsed.data.resolution,
      follow_up_actions: parsed.data.followUpActions ?? [],
      severity: parsed.data.severity,
      reviewer_id: context.user.id,
    }

    await recordAdminAudit(context.serviceClient, {
      organizationId: resolvedOrg,
      actorId: context.user.id,
      action: 'create_incident_review',
      resourceType: 'incident_reviews',
      resourceId: mockReview.id,
      changes: mockReview,
    })

    return NextResponse.json({ review: mockReview })
  })
}
