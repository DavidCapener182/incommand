import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, requireOrganizationAccess } from '@/lib/middleware/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, 'billing_manager', async (context) => {
    const url = new URL(request.url)
    const organizationId = url.searchParams.get('organizationId')
    const limit = Number(url.searchParams.get('limit') ?? '12')

    const resolvedOrg = await requireOrganizationAccess(context, organizationId)
    if (resolvedOrg instanceof NextResponse) {
      return resolvedOrg
    }

    const { data, error } = await context.serviceClient
      .from('subscription_usage' as any)
      .select('*')
      .eq('organization_id', resolvedOrg)
      .order('period_start', { ascending: false })
      .limit(Number.isNaN(limit) ? 12 : limit)

    if (error) {
      return NextResponse.json({ error: 'Failed to load usage metrics' }, { status: 500 })
    }

    return NextResponse.json({ usage: data ?? [] })
  })
}
