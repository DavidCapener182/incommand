import { NextApiRequest, NextApiResponse } from 'next'

/**
 * Send event report via email
 * POST /api/v1/reports/email
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      eventId,
      eventName,
      recipients,
      subject,
      message,
      reportData,
      includeAttachment
    } = req.body

    // Validate required fields
    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients are required' })
    }

    if (!reportData) {
      return res.status(400).json({ error: 'Report data is required' })
    }

    // Generate email body
    const emailBody = generateEmailBody(reportData, message)

    // Generate CSV attachment if requested
    let attachment = null
    if (includeAttachment) {
      attachment = generateCSVAttachment(reportData)
    }

    // In a production environment, you would use a service like SendGrid, AWS SES, or Nodemailer
    // For now, we'll log the email and return success
    console.log('Email Report Request:', {
      to: recipients,
      subject: subject || `Event Report: ${eventName}`,
      body: emailBody,
      hasAttachment: !!attachment,
      eventId
    })

    // TODO: Implement actual email sending
    // Example with a hypothetical email service:
    /*
    await emailService.send({
      to: recipients,
      subject: subject || `Event Report: ${eventName}`,
      html: emailBody,
      attachments: attachment ? [{
        filename: `event-report-${eventId}.csv`,
        content: attachment
      }] : []
    })
    */

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      recipients: recipients.length
    })

  } catch (error) {
    console.error('Error sending email:', error)
    return res.status(500).json({
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function generateEmailBody(reportData: any, customMessage: string): string {
  const { event, incidents, staff, lessonsLearned, aiInsights } = reportData

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .section { margin-bottom: 30px; }
    .section-title { color: #3B82F6; border-bottom: 2px solid #3B82F6; padding-bottom: 5px; margin-bottom: 15px; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-value { font-size: 24px; font-weight: bold; color: #3B82F6; }
    .metric-label { font-size: 12px; color: #666; }
    .list-item { margin: 5px 0; padding-left: 15px; }
    .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Event Report: ${event.name}</h1>
    <p>${new Date(event.event_date).toLocaleDateString()} | ${event.venue_name}</p>
  </div>
  
  <div class="content">
    ${customMessage ? `<div class="section"><p>${customMessage}</p></div>` : ''}
    
    <div class="section">
      <h2 class="section-title">Executive Summary</h2>
      <p>${aiInsights || 'AI-generated insights not available'}</p>
    </div>
    
    <div class="section">
      <h2 class="section-title">Key Metrics</h2>
      <div class="metric">
        <div class="metric-value">${incidents.total}</div>
        <div class="metric-label">Total Incidents</div>
      </div>
      <div class="metric">
        <div class="metric-value">${incidents.resolved}</div>
        <div class="metric-label">Resolved</div>
      </div>
      <div class="metric">
        <div class="metric-value">${incidents.avgResponseTime.toFixed(1)}m</div>
        <div class="metric-label">Avg Response Time</div>
      </div>
      <div class="metric">
        <div class="metric-value">${staff.assignedPositions}</div>
        <div class="metric-label">Staff Positions</div>
      </div>
      <div class="metric">
        <div class="metric-value">${staff.efficiencyScore.toFixed(0)}%</div>
        <div class="metric-label">Efficiency Score</div>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">Lessons Learned</h2>
      
      <h3 style="color: #10B981;">✓ Strengths</h3>
      ${lessonsLearned.strengths.map((s: string) => `<div class="list-item">• ${s}</div>`).join('')}
      
      <h3 style="color: #F59E0B; margin-top: 15px;">⚠ Areas for Improvement</h3>
      ${lessonsLearned.improvements.map((i: string) => `<div class="list-item">• ${i}</div>`).join('')}
      
      <h3 style="color: #3B82F6; margin-top: 15px;">💡 Recommendations</h3>
      ${lessonsLearned.recommendations.map((r: string) => `<div class="list-item">• ${r}</div>`).join('')}
    </div>
  </div>
  
  <div class="footer">
    <p>Generated by inCommand Event Management System</p>
    <p>This is an automated report. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `.trim()
}

function generateCSVAttachment(reportData: any): string {
  const { event, incidents, staff, lessonsLearned, aiInsights } = reportData

  const rows = [
    ['Event Report', event.name],
    ['Date', new Date(event.event_date).toLocaleDateString()],
    ['Venue', event.venue_name],
    [''],
    ['INCIDENT SUMMARY'],
    ['Total Incidents', incidents.total],
    ['Resolved', incidents.resolved],
    ['Open', incidents.open],
    ['Average Response Time (min)', incidents.avgResponseTime.toFixed(1)],
    [''],
    ['STAFF PERFORMANCE'],
    ['Assigned Positions', staff.assignedPositions],
    ['Radio Sign-outs', staff.radioSignouts],
    ['Efficiency Score (%)', staff.efficiencyScore.toFixed(0)],
    [''],
    ['LESSONS LEARNED - STRENGTHS'],
    ...(lessonsLearned.strengths.map((s: string) => ['', s])),
    [''],
    ['LESSONS LEARNED - IMPROVEMENTS'],
    ...(lessonsLearned.improvements.map((i: string) => ['', i])),
    [''],
    ['LESSONS LEARNED - RECOMMENDATIONS'],
    ...(lessonsLearned.recommendations.map((r: string) => ['', r])),
    [''],
    ['AI INSIGHTS'],
    ['', aiInsights]
  ]

  return rows.map(row => row.map((cell: any) => `"${cell}"`).join(',')).join('\n')
}

