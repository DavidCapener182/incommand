export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/middleware/auth'
import { recordAdminAudit } from '@/lib/admin/audit'
import { z } from 'zod'

const updateInvoiceSchema = z.object({
  status: z.enum(['paid', 'pending', 'overdue']).optional(),
  paymentReference: z.string().optional(),
  dueDate: z.string().datetime().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  return withAdminAuth(request, 'billing_manager', async (context) => {
    const body = await request.json()
    const parsed = updateInvoiceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (parsed.data.status) updates.status = parsed.data.status
    if (parsed.data.paymentReference !== undefined) updates.payment_reference = parsed.data.paymentReference
    if (parsed.data.dueDate) updates.due_date = parsed.data.dueDate

    const { data, error } = await context.serviceClient
      .from('invoices')
      .update(updates)
      .eq('id', params.invoiceId)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
    }

    await recordAdminAudit(context.serviceClient, {
      organizationId: data.organization_id || '',
      actorId: context.user.id,
      action: 'update_invoice',
      resourceType: 'invoices',
      resourceId: params.invoiceId,
      changes: updates,
    })

    return NextResponse.json({ invoice: data })
  })
}
