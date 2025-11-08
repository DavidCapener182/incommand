import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/middleware/auth'
import type { Database } from '@/types/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, 'super_admin', async (context) => {
    const [{ count: ticketCount }, { count: organizationCount }, { count: invoiceCount }, { count: incidentCount }] = await Promise.all([
      context.serviceClient.from('support_tickets' as any).select('id', { count: 'exact', head: true }),
      context.serviceClient.from('organizations' as any).select('id', { count: 'exact', head: true }),
      context.serviceClient.from<any, any>('invoices').select('id', { count: 'exact', head: true }),
      context.serviceClient.from('incident_reviews' as any).select('id', { count: 'exact', head: true }),
    ])

    const { data: errorRates } = await context.serviceClient
      .from('billing_transactions' as any)
      .select('status')
      .order('created_at', { ascending: false })
      .limit(100)

    const failedPayments = (errorRates ?? []).filter((tx: any) => tx.status === 'failed').length

    return NextResponse.json({
      metrics: {
        supportTickets: ticketCount ?? 0,
        organizations: organizationCount ?? 0,
        invoices: invoiceCount ?? 0,
        incidentReviews: incidentCount ?? 0,
        failedPayments,
      },
    })
  })
}
