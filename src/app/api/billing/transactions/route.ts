import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, requireOrganizationAccess } from '@/lib/middleware/auth'
import { recordAdminAudit } from '@/lib/admin/audit'
import { z } from 'zod'

const createTransactionSchema = z.object({
  organizationId: z.string().uuid(),
  invoiceId: z.string().uuid().nullable().optional(),
  amount: z.number(),
  currency: z.string().length(3).default('GBP'),
  status: z.enum(['pending', 'paid', 'failed']).default('pending'),
  gateway: z.enum(['stripe', 'paddle', 'manual']).default('stripe'),
  description: z.string().nullable().optional(),
  metadata: z.record(z.any()).optional(),
})

export async function GET(request: NextRequest) {
  return withAdminAuth(request, 'billing_manager', async (context) => {
    const url = new URL(request.url)
    const organizationId = url.searchParams.get('organizationId')
    const limit = Number(url.searchParams.get('limit') ?? '50')

    let query = context.serviceClient
      .from('billing_transactions' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Number.isNaN(limit) ? 50 : limit)

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
      return NextResponse.json({ error: 'Failed to load transactions' }, { status: 500 })
    }

    return NextResponse.json({ transactions: data ?? [] })
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, 'billing_manager', async (context) => {
    const body = await request.json()
    const parsed = createTransactionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const resolvedOrg = await requireOrganizationAccess(context, parsed.data.organizationId)
    if (resolvedOrg instanceof NextResponse) {
      return resolvedOrg
    }

    const { data, error } = await context.serviceClient
      .from('billing_transactions' as any)
      .insert({
        organization_id: resolvedOrg,
        invoice_id: parsed.data.invoiceId ?? null,
        amount: parsed.data.amount,
        currency: parsed.data.currency.toUpperCase(),
        status: parsed.data.status,
        gateway: parsed.data.gateway,
        description: parsed.data.description ?? null,
        metadata: parsed.data.metadata ?? {},
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 })
    }

    await recordAdminAudit(context.serviceClient, {
      organizationId: resolvedOrg,
      actorId: context.user.id,
      action: 'create_transaction',
      resourceType: 'billing_transactions',
      resourceId: data.id,
      changes: data,
    })

    return NextResponse.json({ transaction: data })
  })
}
