export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, requireOrganizationAccess } from '@/lib/middleware/auth'

function jsonToCsv(rows: any[]) {
  if (rows.length === 0) {
    return 'id,resource_type,action,created_at\n'
  }
  const header = Object.keys(rows[0])
  const csvRows = [header.join(',')]
  for (const row of rows) {
    const values = header.map((key) => {
      const value = row[key]
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`
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
  return withAdminAuth(request, 'organization_admin', async (context) => {
    const url = new URL(request.url)
    const organizationId = url.searchParams.get('organizationId')
    const format = (url.searchParams.get('format') ?? 'json').toLowerCase()

    const resolvedOrg = await requireOrganizationAccess(context, organizationId)
    if (resolvedOrg instanceof NextResponse) {
      return resolvedOrg
    }

    const { data, error } = await context.serviceClient
      .from('audit_log' as any)
      .select('*')
      .eq('organization_id', resolvedOrg)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to export compliance logs' }, { status: 500 })
    }

    if (format === 'csv') {
      const csv = jsonToCsv(data ?? [])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="compliance.csv"',
        },
      })
    }

    return NextResponse.json({ auditLogs: data ?? [] })
  })
}
