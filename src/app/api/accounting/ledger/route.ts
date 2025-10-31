import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, requireOrganizationAccess } from '@/lib/middleware/auth'
import { recordAdminAudit } from '@/lib/admin/audit'
import { z } from 'zod'

const ledgerEntrySchema = z.object({
  organizationId: z.string().uuid(),
  date: z.string().datetime(),
  type: z.enum(['credit', 'debit']),
  accountCode: z.string(),
  description: z.string(),
  amount: z.number(),
  currency: z.string().length(3).default('GBP'),
})

export async function GET(request: NextRequest) {
  return withAdminAuth(request, 'billing_manager', async (context) => {
    const url = new URL(request.url)
    const organizationId = url.searchParams.get('organizationId')
    const limit = Number(url.searchParams.get('limit') ?? '100')

    const resolvedOrg = await requireOrganizationAccess(context, organizationId)
    if (resolvedOrg instanceof NextResponse) {
      return resolvedOrg
    }

    const { data: entries, error } = await context.serviceClient
      .from('ledger_entries' as any)
      .select('*')
      .eq('organization_id', resolvedOrg)
      .order('date', { ascending: false })
      .limit(Number.isNaN(limit) ? 100 : limit)

    if (error) {
      return NextResponse.json({ error: 'Failed to load ledger entries' }, { status: 500 })
    }

    const credits = (entries ?? []).filter((entry: any) => entry.type === 'credit').reduce((sum: number, entry: any) => sum + Number(entry.amount), 0)
    const debits = (entries ?? []).filter((entry: any) => entry.type === 'debit').reduce((sum: number, entry: any) => sum + Number(entry.amount), 0)

    const { data: outstandingInvoices } = await context.serviceClient
      .from('invoices')
      .select('total_amount')
      .eq('organization_id', resolvedOrg)
      .in('status', ['pending', 'overdue'])

    const outstandingTotal = (outstandingInvoices ?? []).reduce((sum: number, invoice: any) => sum + Number(invoice.total_amount), 0)

    const { data: failedPayments } = await context.serviceClient
      .from('billing_transactions' as any)
      .select('id')
      .eq('organization_id', resolvedOrg)
      .eq('status', 'failed')

    return NextResponse.json({
      entries: entries ?? [],
      metrics: {
        totalCredits: credits,
        totalDebits: debits,
        outstandingInvoices: outstandingTotal,
        paymentFailures: failedPayments?.length ?? 0,
        net: credits - debits,
      },
    })
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, 'billing_manager', async (context) => {
    const body = await request.json()
    const parsed = ledgerEntrySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const resolvedOrg = await requireOrganizationAccess(context, parsed.data.organizationId)
    if (resolvedOrg instanceof NextResponse) {
      return resolvedOrg
    }

    const { data, error } = await context.serviceClient
      .from('ledger_entries')
      .insert({
        organization_id: resolvedOrg,
        date: parsed.data.date,
        type: parsed.data.type,
        account_code: parsed.data.accountCode,
        description: parsed.data.description,
        amount: parsed.data.amount,
        currency: parsed.data.currency.toUpperCase(),
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to record ledger entry' }, { status: 500 })
    }

    if (!data || !('id' in data)) {
      throw new Error('Failed to record ledger entry: invalid response')
    }

    const ledgerData = data as unknown as { id: string; [key: string]: unknown }

    await recordAdminAudit(context.serviceClient, {
      organizationId: resolvedOrg,
      actorId: context.user.id,
      action: 'create_ledger_entry',
      resourceType: 'ledger_entries',
      resourceId: ledgerData.id,
      changes: ledgerData as Record<string, unknown>,
    })

    return NextResponse.json({ entry: data })
  })
}
