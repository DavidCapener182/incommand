import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/v1/incidents/bulk-actions
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { action, incident_ids, data } = body

    if (!action || !incident_ids || !Array.isArray(incident_ids)) {
      return NextResponse.json(
        { error: 'action and incident_ids (array) are required' },
        { status: 400 }
      )
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let result: any

    switch (action) {
      case 'close':
        // Close all selected incidents
        const { error: closeError } = await supabase
          .from('incident_logs')
          .update({ 
            is_closed: true, 
            status: 'closed',
            resolved_at: new Date().toISOString()
          })
          .in('id', incident_ids)

        if (closeError) throw closeError
        result = { closed_count: incident_ids.length }
        break

      case 'status':
        // Change status of selected incidents
        if (!data?.status) {
          return NextResponse.json(
            { error: 'status is required for status change action' },
            { status: 400 }
          )
        }

        const updateData: any = { status: data.status }
        
        // Set appropriate flags based on status
        if (data.status === 'closed') {
          updateData.is_closed = true
          updateData.resolved_at = new Date().toISOString()
        } else if (data.status === 'in-progress') {
          updateData.responded_at = updateData.responded_at || new Date().toISOString()
        }

        const { error: statusError } = await supabase
          .from('incident_logs')
          .update(updateData)
          .in('id', incident_ids)

        if (statusError) throw statusError
        result = { updated_count: incident_ids.length, status: data.status }
        break

      case 'assign':
        // Assign incidents to staff
        if (!data?.assigned_to) {
          return NextResponse.json(
            { error: 'assigned_to is required for assign action' },
            { status: 400 }
          )
        }

        const { error: assignError } = await supabase
          .from('incident_logs')
          .update({ 
            assigned_to: data.assigned_to,
            responded_at: new Date().toISOString()
          })
          .in('id', incident_ids)

        if (assignError) throw assignError
        result = { assigned_count: incident_ids.length, assigned_to: data.assigned_to }
        break

      case 'delete':
        // Soft delete selected incidents
        const { error: deleteError } = await supabase
          .from('incident_logs')
          .delete()
          .in('id', incident_ids)

        if (deleteError) throw deleteError
        result = { deleted_count: incident_ids.length }
        break

      case 'export':
        // Fetch incidents for export
        const { data: incidents, error: exportError } = await supabase
          .from('incident_logs')
          .select('*')
          .in('id', incident_ids)
          .order('timestamp', { ascending: false })

        if (exportError) throw exportError
        
        // Convert to CSV
        const csvData = convertToCSV(incidents || [])
        result = { export_data: csvData, count: incidents?.length || 0 }
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      action,
      result
    })
  } catch (error) {
    console.error('Bulk action error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to perform bulk action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        // Escape values with commas or quotes
        if (value && (value.toString().includes(',') || value.toString().includes('"'))) {
          return `"${value.toString().replace(/"/g, '""')}"`
        }
        return value || ''
      }).join(',')
    )
  ]

  return csvRows.join('\n')
}

