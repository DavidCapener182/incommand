import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, requireOrganizationAccess } from '@/lib/middleware/auth'

function toCsv(rows: any[]) {
  if (rows.length === 0) {
    return 'invoice_id,organization_id,status,total_amount,currency,issued_date,due_date\n'
  }
  const header = Object.keys(rows[0])
  const csvRows = [header.join(',')]
  for (const row of rows) {
    const values = header.map((key) => {
      const value = row[key]
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') {
        return JSON.stringify(value).replace(/"/g, '""')
      }
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

    let query = context.serviceClient
      .from('invoices')
      .select('id, organization_id, status, total_amount, currency, issued_date, due_date, payment_reference, line_items')
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

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to export invoices' }, { status: 500 })
    }

    if (format === 'csv') {
      const csv = toCsv(data ?? [])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="invoices.csv"',
        },
      })
    }

    return NextResponse.json({ invoices: data ?? [] })
  })
}
