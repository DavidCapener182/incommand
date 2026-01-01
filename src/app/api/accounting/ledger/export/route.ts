export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, requireOrganizationAccess } from '@/lib/middleware/auth'

function buildCsv(rows: any[]) {
  if (rows.length === 0) {
    return 'entry_id,organization_id,date,type,account_code,description,amount,currency\n'
  }
  const header = Object.keys(rows[0])
  const csvRows = [header.join(',')]
  for (const row of rows) {
    const values = header.map((key) => {
      const value = row[key]
      if (value === null || value === undefined) return ''
      const asString = String(value)
      if (asString.includes(',') || asString.includes('\n')) {
        return `"${asString.replace(/"/g, '""')}"`
      }
      return asString
    })
    csvRows.push(values.join(','))
  }
  return csvRows.join('\n')
}

export async function GET(request: NextRequest) {
  return withAdminAuth(request, 'billing_manager', async (context) => {
    const url = new URL(request.url)
    const organizationId = url.searchParams.get('organizationId')
    const format = (url.searchParams.get('format') ?? 'json').toLowerCase()

    const resolvedOrg = await requireOrganizationAccess(context, organizationId)
    if (resolvedOrg instanceof NextResponse) {
      return resolvedOrg
    }

    const { data, error } = await context.serviceClient
      .from('ledger_entries' as any)
      .select('*')
      .eq('organization_id', resolvedOrg)
      .order('date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to export ledger entries' }, { status: 500 })
    }

    if (format === 'csv') {
      const csv = buildCsv(data ?? [])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="ledger.csv"',
        },
      })
    }

    return NextResponse.json({ entries: data ?? [] })
  })
}
