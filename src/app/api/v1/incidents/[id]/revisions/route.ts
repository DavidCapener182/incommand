/**
 * API Route: Get Incident Log Revisions
 * GET /api/v1/incidents/[id]/revisions
 * 
 * Retrieves complete revision history for an incident log
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getRevisionHistory } from '@/lib/auditableLogging'
import { GetRevisionsResponse } from '@/types/auditableLog'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const incidentId = params.id

    // Get Supabase client with user session
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // Get auth token from request
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the incident log
    const { data: incident, error: incidentError } = await supabase
      .from('incident_logs')
      .select('*')
      .eq('id', incidentId)
      .single()

    if (incidentError || !incident) {
      return NextResponse.json(
        { success: false, error: 'Incident log not found' },
        { status: 404 }
      )
    }

    // Get revision history
    const result = await getRevisionHistory(incidentId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    const response: GetRevisionsResponse = {
      success: true,
      revisions: result.revisions,
      incident: incident
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching revisions:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

