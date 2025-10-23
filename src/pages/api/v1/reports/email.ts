import { NextApiRequest, NextApiResponse } from 'next'
import { emailService } from '@/lib/notifications/emailService'

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

    const emailBody = generateEmailBody(reportData, message)
    const fallbackEventName = eventName || reportData?.event?.name || 'Event'
    const csvAttachment = includeAttachment ? generateCSVAttachment(reportData) : null

    await emailService.send({
      to: recipients,
      subject: subject || `Event Report: ${fallbackEventName}`,
      html: emailBody,
      text: generatePlainText(reportData, message),
      attachments: csvAttachment
        ? [{
            filename: `event-report-${eventId || 'summary'}.csv`,
            content: Buffer.from(csvAttachment, 'utf8'),
            contentType: 'text/csv'
          }]
        : undefined
    })

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

function generateEmailBody(reportData: any, customMessage = ''): string {
  const {
    event = {},
    incidents = {},
    staff = {},
    lessonsLearned = { strengths: [], improvements: [], recommendations: [] },
    aiInsights
  } = reportData || {}

  const avgResponseTime = Number.isFinite(Number(incidents?.avgResponseTime))
    ? Number(incidents.avgResponseTime)
    : 0
  const efficiencyScore = Number.isFinite(Number(staff?.efficiencyScore))
    ? Number(staff.efficiencyScore)
    : 0

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
    <h1>Event Report: ${event.name || 'Event'}</h1>
    <p>${event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Date TBC'} | ${event.venue_name || 'Venue TBC'}</p>
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
        <div class="metric-value">${Number(incidents.total ?? 0)}</div>
        <div class="metric-label">Total Incidents</div>
      </div>
      <div class="metric">
        <div class="metric-value">${Number(incidents.resolved ?? 0)}</div>
        <div class="metric-label">Resolved</div>
      </div>
      <div class="metric">
        <div class="metric-value">${avgResponseTime.toFixed(1)}m</div>
        <div class="metric-label">Avg Response Time</div>
      </div>
      <div class="metric">
        <div class="metric-value">${Number(staff.assignedPositions ?? 0)}</div>
        <div class="metric-label">Staff Positions</div>
      </div>
      <div class="metric">
        <div class="metric-value">${efficiencyScore.toFixed(0)}%</div>
        <div class="metric-label">Efficiency Score</div>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">Lessons Learned</h2>
      
      <h3 style="color: #10B981;">✓ Strengths</h3>
      ${(lessonsLearned.strengths || []).map((s: string) => `<div class="list-item">• ${s}</div>`).join('')}
      
      <h3 style="color: #F59E0B; margin-top: 15px;">⚠ Areas for Improvement</h3>
      ${(lessonsLearned.improvements || []).map((i: string) => `<div class="list-item">• ${i}</div>`).join('')}
      
      <h3 style="color: #3B82F6; margin-top: 15px;">💡 Recommendations</h3>
      ${(lessonsLearned.recommendations || []).map((r: string) => `<div class="list-item">• ${r}</div>`).join('')}
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

function generatePlainText(reportData: any, customMessage = ''): string {
  const {
    event = {},
    incidents = {},
    staff = {},
    lessonsLearned = { strengths: [], improvements: [], recommendations: [] },
    aiInsights
  } = reportData || {}

  const avgResponseTime = Number.isFinite(Number(incidents?.avgResponseTime))
    ? Number(incidents.avgResponseTime)
    : 0
  const efficiencyScore = Number.isFinite(Number(staff?.efficiencyScore))
    ? Number(staff.efficiencyScore)
    : 0

  const eventDate = event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Date TBC'
  const lines = [
    `Event Report: ${event.name || 'Event'}`,
    `${eventDate} | ${event.venue_name || 'Venue TBC'}`,
    '',
    customMessage || '',
    'Executive Summary:',
    aiInsights || 'AI-generated insights not available',
    '',
    'Key Metrics:',
    `- Total Incidents: ${Number(incidents.total ?? 0)}`,
    `- Resolved: ${Number(incidents.resolved ?? 0)}`,
    `- Avg Response Time: ${avgResponseTime.toFixed(1)} minutes`,
    `- Staff Positions: ${Number(staff.assignedPositions ?? 0)}`,
    `- Efficiency Score: ${efficiencyScore.toFixed(0)}%`,
    '',
    'Strengths:',
    ...lessonsLearned.strengths.map((item: string) => `• ${item}`),
    '',
    'Areas for Improvement:',
    ...lessonsLearned.improvements.map((item: string) => `• ${item}`),
    '',
    'Recommendations:',
    ...lessonsLearned.recommendations.map((item: string) => `• ${item}`),
    '',
    'Generated by inCommand Event Management System'
  ]

  return lines.filter(Boolean).join('\n')
}

function generateCSVAttachment(reportData: any): string {
  const {
    event = {},
    incidents = {},
    staff = {},
    lessonsLearned = { strengths: [], improvements: [], recommendations: [] },
    aiInsights
  } = reportData || {}

  const rows = [
    ['Event Report', event.name],
    ['Date', new Date(event.event_date).toLocaleDateString()],
    ['Venue', event.venue_name],
    [''],
    ['INCIDENT SUMMARY'],
    ['Total Incidents', Number(incidents.total ?? 0)],
    ['Resolved', Number(incidents.resolved ?? 0)],
    ['Open', Number(incidents.open ?? 0)],
    ['Average Response Time (min)', Number.isFinite(Number(incidents.avgResponseTime)) ? Number(incidents.avgResponseTime).toFixed(1) : '0.0'],
    [''],
    ['STAFF PERFORMANCE'],
    ['Assigned Positions', Number(staff.assignedPositions ?? 0)],
    ['Radio Sign-outs', Number(staff.radioSignouts ?? 0)],
    ['Efficiency Score (%)', Number.isFinite(Number(staff.efficiencyScore)) ? Number(staff.efficiencyScore).toFixed(0) : '0'],
    [''],
    ['LESSONS LEARNED - STRENGTHS'],
    ...((lessonsLearned.strengths || []).map((s: string) => ['', s])),
    [''],
    ['LESSONS LEARNED - IMPROVEMENTS'],
    ...((lessonsLearned.improvements || []).map((i: string) => ['', i])),
    [''],
    ['LESSONS LEARNED - RECOMMENDATIONS'],
    ...((lessonsLearned.recommendations || []).map((r: string) => ['', r])),
    [''],
    ['AI INSIGHTS'],
    ['', aiInsights]
  ]

  return rows.map(row => row.map((cell: any) => `"${cell}"`).join(',')).join('\n')
}
