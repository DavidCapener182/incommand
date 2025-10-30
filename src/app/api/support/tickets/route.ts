import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const payload: any = {
    company_id: body.company_id || null,
    title: body.title || '',
    description: body.description || '',
    priority: body.priority || 'normal',
    status: 'open',
    created_by: user.id
  }

  const { data, error } = await supabase.from('support_tickets').insert(payload).select('*').maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ticket: data })
}

import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, requireOrganizationAccess } from '@/lib/middleware/auth'
import { recordAdminAudit } from '@/lib/admin/audit'
import { z } from 'zod'

const createTicketSchema = z.object({
  organizationId: z.string().uuid(),
  subject: z.string().min(3),
  description: z.string().min(5),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  requesterId: z.string().uuid().optional(),
  incidentId: z.string().uuid().optional(),
})

export async function GET(request: NextRequest) {
  return withAdminAuth(request, 'support_agent', async (context) => {
    const url = new URL(request.url)
    const organizationId = url.searchParams.get('organizationId')
    const status = url.searchParams.get('status')
    const queue = url.searchParams.get('queue')

    let query = context.serviceClient
      .from('support_tickets' as any)
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

    if (status) {
      query = query.eq('status', status)
    }
    if (queue) {
      query = query.eq('queue', queue)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to load support tickets' }, { status: 500 })
    }

    return NextResponse.json({ tickets: data ?? [] })
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, 'support_agent', async (context) => {
    const body = await request.json()
    const parsed = createTicketSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const resolvedOrg = await requireOrganizationAccess(context, parsed.data.organizationId)
    if (resolvedOrg instanceof NextResponse) {
      return resolvedOrg
    }

    const { data, error } = await context.serviceClient
      .from('support_tickets')
      .insert({
        organization_id: resolvedOrg,
        subject: parsed.data.subject,
        priority: parsed.data.priority,
        status: 'open',
        category: 'general',
        user_id: parsed.data.requesterId ?? context.user.id,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create support ticket' }, { status: 500 })
    }

    await recordAdminAudit(context.serviceClient, {
      organizationId: resolvedOrg,
      actorId: context.user.id,
      action: 'create_support_ticket',
      resourceType: 'support_tickets',
      resourceId: data?.id || '',
      changes: data,
    })

    return NextResponse.json({ ticket: data })
  })
}
