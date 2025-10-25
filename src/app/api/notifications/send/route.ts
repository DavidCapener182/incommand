/**
 * Send Notification API
 * Handles email and SMS notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/notifications/emailService'
import { smsService } from '@/lib/notifications/smsService'
import { getServiceClient } from '@/lib/supabaseServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const supabase = getServiceClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, incidentId, recipients, method } = body

    // Validate inputs
    if (!type || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Fetch incident data if incidentId provided
    let incident = null
    if (incidentId) {
      const { data, error } = await supabase
        .from('incident_logs')
        .select('id, incident_type, occurrence, timestamp, status, is_closed, priority, location')
        .eq('id', incidentId)
        .single()

      if (error) {
        console.error('Error fetching incident:', error)
        return NextResponse.json(
          { error: 'Incident not found' },
          { status: 404 }
        )
      }

      incident = data
    }

    const results = {
      email: null as boolean | null,
      sms: null as boolean | null,
      errors: [] as string[]
    }

    // Send email notifications
    if (method === 'email' || method === 'both') {
      const emailRecipients = recipients.filter((r: any) => r.email).map((r: any) => r.email)
      
      if (emailRecipients.length > 0) {
        try {
          if (type === 'incident') {
            results.email = await emailService.sendIncidentAlert(incident, emailRecipients)
          } else if (type === 'shift-handoff') {
            results.email = await emailService.sendShiftHandoffReport(body.report, emailRecipients)
          }
        } catch (error: any) {
          results.errors.push(`Email error: ${error.message}`)
        }
      }
    }

    // Send SMS notifications
    if (method === 'sms' || method === 'both') {
      const phoneNumbers = recipients.filter((r: any) => r.phone).map((r: any) => r.phone)
      
      if (phoneNumbers.length > 0) {
        try {
          if (type === 'incident') {
            results.sms = await smsService.sendIncidentAlert(incident, phoneNumbers)
          } else if (type === 'emergency') {
            results.sms = await smsService.sendEmergencyAlert(body.message, phoneNumbers)
          }
        } catch (error: any) {
          results.errors.push(`SMS error: ${error.message}`)
        }
      }
    }

    // Log notification
    await supabase.from('notification_logs').insert({
      title: `Notification sent`,
      body: `Sent to ${recipients.length} recipients`,
      incident_id: incidentId,
      recipients: recipients.length,
      status: 'sent',
      user_id: recipients[0] || '',
      type: 'notification',
      sent_at: new Date().toISOString()
    })

    // Return results
    if (results.errors.length > 0) {
      return NextResponse.json({
        success: false,
        results,
        message: 'Some notifications failed to send'
      }, { status: 207 }) // Multi-status
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Notifications sent successfully'
    })

  } catch (error: any) {
    console.error('Notification send error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
