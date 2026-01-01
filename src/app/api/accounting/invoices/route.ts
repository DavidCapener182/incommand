export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, requireOrganizationAccess } from '@/lib/middleware/auth'
import { recordAdminAudit } from '@/lib/admin/audit'
import { z } from 'zod'

const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().nonnegative(),
})

const createInvoiceSchema = z.object({
  organizationId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional(),
  issuedDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  currency: z.string().length(3).default('GBP'),
  lineItems: z.array(lineItemSchema).min(1),
  paymentReference: z.string().optional(),
})

export async function GET(request: NextRequest) {
  return withAdminAuth(request, 'billing_manager', async (context) => {
    const url = new URL(request.url)
    const organizationId = url.searchParams.get('organizationId')
    const status = url.searchParams.get('status')

    let query = context.serviceClient
      .from('inquest_invoices')
      .select('*')
      .order('issued_date', { ascending: false })

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

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to load invoices' }, { status: 500 })
    }

    return NextResponse.json({ invoices: data ?? [] })
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, 'billing_manager', async (context) => {
    const body = await request.json()
    const parsed = createInvoiceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const resolvedOrg = await requireOrganizationAccess(context, parsed.data.organizationId)
    if (resolvedOrg instanceof NextResponse) {
      return resolvedOrg
    }

    const totalAmount = parsed.data.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    const { data, error } = await context.serviceClient
      .from('invoices')
      .insert({
        organization_id: resolvedOrg,
        subscription_id: parsed.data.subscriptionId ?? null,
        issued_date: parsed.data.issuedDate ?? new Date().toISOString(),
        due_date: parsed.data.dueDate ?? null,
        status: 'pending',
        line_items: parsed.data.lineItems,
        total_amount: totalAmount,
        currency: parsed.data.currency.toUpperCase(),
        payment_reference: parsed.data.paymentReference ?? null,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    if (!data || !('id' in data)) {
      throw new Error('Failed to create invoice: invalid response')
    }

    const invoiceData = data as unknown as { id: string; [key: string]: unknown }

    await recordAdminAudit(context.serviceClient, {
      organizationId: resolvedOrg,
      actorId: context.user.id,
      action: 'create_invoice',
      resourceType: 'invoices',
      resourceId: invoiceData.id,
      changes: invoiceData as Record<string, unknown>,
    })

    return NextResponse.json({ invoice: data })
  })
}
