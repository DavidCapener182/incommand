/**
 * Email Service
 * Sends email notifications using multiple providers
 */

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  attachments?: EmailAttachment[]
}

interface EmailAttachment {
  filename: string
  content: string | Buffer
  contentType: string
}

interface EmailProvider {
  name: string
  send: (options: EmailOptions) => Promise<boolean>
}

/**
 * Resend Email Provider (recommended - free tier available)
 */
class ResendProvider implements EmailProvider {
  name = 'Resend'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async send(options: EmailOptions): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: options.from || 'inCommand <onboarding@resend.dev>',
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
          cc: options.cc,
          bcc: options.bcc,
          reply_to: options.replyTo
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Resend API error: ${error.message}`)
      }

      console.log('Email sent successfully via Resend')
      return true
    } catch (error) {
      console.error('Resend email error:', error)
      throw error
    }
  }
}

/**
 * SendGrid Provider (alternative)
 */
class SendGridProvider implements EmailProvider {
  name = 'SendGrid'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async send(options: EmailOptions): Promise<boolean> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: Array.isArray(options.to) 
              ? options.to.map(email => ({ email }))
              : [{ email: options.to }],
            cc: options.cc?.map(email => ({ email })),
            bcc: options.bcc?.map(email => ({ email })),
            subject: options.subject
          }],
          from: { email: options.from || 'noreply@incommand.app' },
          reply_to: options.replyTo ? { email: options.replyTo } : undefined,
          content: [
            { type: 'text/html', value: options.html },
            { type: 'text/plain', value: options.text || '' }
          ]
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`SendGrid API error: ${JSON.stringify(error)}`)
      }

      console.log('Email sent successfully via SendGrid')
      return true
    } catch (error) {
      console.error('SendGrid email error:', error)
      throw error
    }
  }
}

/**
 * Email Service Manager
 */
class EmailService {
  private provider: EmailProvider | null = null

  constructor() {
    this.initializeProvider()
  }

  private initializeProvider() {
    // Try Resend first
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      this.provider = new ResendProvider(resendKey)
      return
    }

    // Fallback to SendGrid
    const sendgridKey = process.env.SENDGRID_API_KEY
    if (sendgridKey) {
      this.provider = new SendGridProvider(sendgridKey)
      return
    }

    console.warn('No email provider configured')
  }

  async send(options: EmailOptions): Promise<boolean> {
    if (!this.provider) {
      throw new Error('No email provider configured')
    }

    try {
      return await this.provider.send(options)
    } catch (error) {
      console.error(`Email send failed (${this.provider.name}):`, error)
      throw error
    }
  }

  async sendIncidentAlert(incident: any, recipients: string[]): Promise<boolean> {
    const html = this.generateIncidentAlertHTML(incident)
    const text = this.generateIncidentAlertText(incident)

    return this.send({
      to: recipients,
      subject: `[inCommand Alert] ${incident.incident_type} - ${incident.priority.toUpperCase()} Priority`,
      html,
      text
    })
  }

  async sendShiftHandoffReport(report: any, recipients: string[]): Promise<boolean> {
    const html = this.generateShiftHandoffHTML(report)
    const text = this.generateShiftHandoffText(report)

    return this.send({
      to: recipients,
      subject: `[inCommand] Shift Handoff Report - ${new Date().toLocaleDateString()}`,
      html,
      text
    })
  }

  private generateIncidentAlertHTML(incident: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .priority-high { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; }
            .priority-medium { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
            .priority-low { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .label { font-weight: bold; color: #6b7280; }
            .value { color: #111827; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .btn { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Incident Alert</h1>
              <p style="margin: 0; opacity: 0.9;">New incident requires your attention</p>
            </div>
            <div class="content">
              <div class="priority-${incident.priority.toLowerCase()}">
                <strong style="font-size: 18px;">${incident.incident_type}</strong>
                <span style="float: right; font-weight: bold; text-transform: uppercase;">${incident.priority} PRIORITY</span>
              </div>
              
              <div class="info-row">
                <span class="label">Log Number:</span>
                <span class="value">${incident.log_number || 'N/A'}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Time:</span>
                <span class="value">${new Date(incident.timestamp).toLocaleString()}</span>
              </div>
              
              <div class="info-row">
                <span class="label">From:</span>
                <span class="value">${incident.callsign_from || 'N/A'}</span>
              </div>
              
              <div class="info-row">
                <span class="label">To:</span>
                <span class="value">${incident.callsign_to || 'N/A'}</span>
              </div>
              
              <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 6px;">
                <div class="label">Occurrence:</div>
                <p style="margin: 10px 0 0 0;">${incident.occurrence}</p>
              </div>
              
              <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 6px;">
                <div class="label">Action Taken:</div>
                <p style="margin: 10px 0 0 0;">${incident.action_taken}</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://incommand.app'}/dashboard" class="btn">
                  View in Dashboard
                </a>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated alert from inCommand Event Management System</p>
              <p>To manage your notification preferences, visit Settings</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private generateIncidentAlertText(incident: any): string {
    return `
INCIDENT ALERT - ${incident.priority.toUpperCase()} PRIORITY

Type: ${incident.incident_type}
Log Number: ${incident.log_number || 'N/A'}
Time: ${new Date(incident.timestamp).toLocaleString()}
From: ${incident.callsign_from || 'N/A'}
To: ${incident.callsign_to || 'N/A'}

OCCURRENCE:
${incident.occurrence}

ACTION TAKEN:
${incident.action_taken}

View in Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://incommand.app'}/dashboard

---
This is an automated alert from inCommand Event Management System
    `.trim()
  }

  private generateShiftHandoffHTML(report: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .summary-card { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #3b82f6; }
            .metric { display: inline-block; margin: 10px 20px 10px 0; }
            .metric-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
            .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #e5e7eb; padding: 12px; text-align: left; font-weight: bold; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Shift Handoff Report</h1>
              <p style="margin: 0; opacity: 0.9;">${report.shiftName} - ${new Date(report.date).toLocaleDateString()}</p>
            </div>
            <div class="content">
              <div class="summary-card">
                <h2>Summary</h2>
                <div class="metric">
                  <div class="metric-value">${report.totalIncidents}</div>
                  <div class="metric-label">Total Incidents</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${report.openIncidents}</div>
                  <div class="metric-label">Open</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${report.closedIncidents}</div>
                  <div class="metric-label">Closed</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${report.highPriorityIncidents}</div>
                  <div class="metric-label">High Priority</div>
                </div>
              </div>
              
              <h3>Key Incidents</h3>
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.keyIncidents.map((inc: any) => `
                    <tr>
                      <td>${new Date(inc.timestamp).toLocaleTimeString()}</td>
                      <td>${inc.incident_type}</td>
                      <td style="text-transform: uppercase; font-weight: bold; color: ${inc.priority === 'high' ? '#ef4444' : inc.priority === 'medium' ? '#f59e0b' : '#3b82f6'}">
                        ${inc.priority}
                      </td>
                      <td>${inc.is_closed ? 'Closed' : 'Open'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <h3>Notes & Actions for Next Shift</h3>
              <div style="background: white; padding: 20px; border-radius: 6px;">
                ${report.notes ? `<p>${report.notes}</p>` : '<p><em>No additional notes</em></p>'}
              </div>
            </div>
            <div class="footer">
              <p>Generated by inCommand Event Management System</p>
              <p>${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private generateShiftHandoffText(report: any): string {
    return `
SHIFT HANDOFF REPORT
${report.shiftName} - ${new Date(report.date).toLocaleDateString()}

SUMMARY:
- Total Incidents: ${report.totalIncidents}
- Open: ${report.openIncidents}
- Closed: ${report.closedIncidents}
- High Priority: ${report.highPriorityIncidents}

KEY INCIDENTS:
${report.keyIncidents.map((inc: any) => 
  `${new Date(inc.timestamp).toLocaleTimeString()} - ${inc.incident_type} (${inc.priority.toUpperCase()}) - ${inc.is_closed ? 'Closed' : 'Open'}`
).join('\n')}

NOTES FOR NEXT SHIFT:
${report.notes || 'No additional notes'}

---
Generated by inCommand Event Management System
${new Date().toLocaleString()}
    `.trim()
  }
}

// Export singleton instance
export const emailService = new EmailService()
