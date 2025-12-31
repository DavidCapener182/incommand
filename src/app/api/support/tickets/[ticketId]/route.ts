import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/middleware/auth'
import { recordAdminAudit } from '@/lib/admin/audit'
import { z } from 'zod'
import type { Database } from '@/types/supabase'

const updateTicketSchema = z.object({
  status: z.enum(['open', 'assigned', 'resolved', 'closed']).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  escalationLevel: z.number().int().optional(),
  notes: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  return withAdminAuth(request, 'support_agent', async (context) => {
    const body = await request.json()
    const parsed = updateTicketSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (parsed.data.status) updates.status = parsed.data.status
    if (parsed.data.assigneeId !== undefined) updates.assignee_id = parsed.data.assigneeId
    if (parsed.data.escalationLevel !== undefined) updates.escalation_level = parsed.data.escalationLevel
    if (parsed.data.notes) updates.internal_notes = parsed.data.notes

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { data, error } = await (context.serviceClient as any)
      .from('support_tickets')
      .update(updates)
      .eq('id', params.ticketId)
      .select('company_id')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
    }

    await recordAdminAudit(context.serviceClient, {
      organizationId: data?.company_id || '',
      actorId: context.user.id,
      action: 'update_support_ticket',
      resourceType: 'support_tickets',
      resourceId: params.ticketId,
      changes: updates,
    })

    return NextResponse.json({ success: true })
  })
}
