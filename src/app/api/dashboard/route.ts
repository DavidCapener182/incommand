import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, requireOrganizationAccess } from '@/lib/middleware/auth'
import type { Database } from '@/types/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, 'organization_admin', async (context) => {
    const url = new URL(request.url)
    const organizationId = url.searchParams.get('organizationId')

    const resolvedOrg = await requireOrganizationAccess(context, organizationId)
    if (resolvedOrg instanceof NextResponse) {
      return resolvedOrg
    }

    const [{ data: usage }, { data: transactions }, { data: invoices }, { data: tickets }, { data: aiUsage }] = await Promise.all([
      context.serviceClient
        .from('subscription_usage' as any)
        .select('*')
        .eq('organization_id', resolvedOrg)
        .order('period_start', { ascending: false })
        .limit(6),
      context.serviceClient
        .from('billing_transactions' as any)
        .select('*')
        .eq('organization_id', resolvedOrg)
        .order('created_at', { ascending: false })
        .limit(12),
      (context.serviceClient as any)
        .from('invoices')
        .select('*')
        .eq('organization_id', resolvedOrg)
        .order('issued_date', { ascending: false })
        .limit(12),
      context.serviceClient
        .from('support_tickets' as any)
        .select('*')
        .eq('organization_id', resolvedOrg)
        .order('created_at', { ascending: false })
        .limit(20),
      context.serviceClient
        .from('ai_usage_logs' as any)
        .select('*')
        .eq('organization_id', resolvedOrg)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    const activeTickets = (tickets ?? []).filter((ticket: any) => ticket.status !== 'resolved' && ticket.status !== 'closed')
    const pendingInvoices = (invoices ?? []).filter((invoice: any) => invoice.status !== 'paid')
    const revenue = (transactions ?? [])
      .filter((tx: any) => tx.status === 'paid')
      .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0)

    const mrr = (usage ?? []).reduce((sum: number, row: any) => sum + Number(row.events_count ?? 0), 0)

    return NextResponse.json({
      organizationId: resolvedOrg,
      metrics: {
        activeTickets: activeTickets.length,
        pendingInvoices: pendingInvoices.length,
        revenue,
        usageTrend: usage ?? [],
        aiUsage: aiUsage ?? [],
        supportBacklog: activeTickets,
        outstandingInvoices: pendingInvoices,
        mrr,
      },
    })
  })
}
