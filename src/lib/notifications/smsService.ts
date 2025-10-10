/**
 * SMS Service
 * Sends SMS notifications using multiple providers
 */

interface SMSOptions {
  to: string | string[]
  message: string
  from?: string
}

interface SMSProvider {
  name: string
  send: (options: SMSOptions) => Promise<boolean>
}

/**
 * Twilio SMS Provider
 */
class TwilioProvider implements SMSProvider {
  name = 'Twilio'
  private accountSid: string
  private authToken: string
  private fromNumber: string

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.accountSid = accountSid
    this.authToken = authToken
    this.fromNumber = fromNumber
  }

  async send(options: SMSOptions): Promise<boolean> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to]

    try {
      for (const recipient of recipients) {
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              To: recipient,
              From: options.from || this.fromNumber,
              Body: options.message
            })
          }
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Twilio API error: ${error.message}`)
        }

        console.log(`SMS sent to ${recipient} via Twilio`)
      }

      return true
    } catch (error) {
      console.error('Twilio SMS error:', error)
      throw error
    }
  }
}

/**
 * AWS SNS Provider (alternative)
 */
class SNSProvider implements SMSProvider {
  name = 'AWS SNS'
  private region: string
  private accessKeyId: string
  private secretAccessKey: string

  constructor(region: string, accessKeyId: string, secretAccessKey: string) {
    this.region = region
    this.accessKeyId = accessKeyId
    this.secretAccessKey = secretAccessKey
  }

  async send(options: SMSOptions): Promise<boolean> {
    // This would require AWS SDK implementation
    // Placeholder for now
    console.log('SMS via AWS SNS:', options)
    return true
  }
}

/**
 * SMS Service Manager
 */
class SMSService {
  private provider: SMSProvider | null = null

  constructor() {
    this.initializeProvider()
  }

  private initializeProvider() {
    // Try Twilio
    const twilioSid = process.env.TWILIO_ACCOUNT_SID
    const twilioToken = process.env.TWILIO_AUTH_TOKEN
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER

    if (twilioSid && twilioToken && twilioFrom) {
      this.provider = new TwilioProvider(twilioSid, twilioToken, twilioFrom)
      return
    }

    console.warn('No SMS provider configured')
  }

  async send(options: SMSOptions): Promise<boolean> {
    if (!this.provider) {
      throw new Error('No SMS provider configured')
    }

    // Truncate message to 160 characters for SMS
    const truncatedMessage = options.message.slice(0, 160)

    try {
      return await this.provider.send({
        ...options,
        message: truncatedMessage
      })
    } catch (error) {
      console.error(`SMS send failed (${this.provider.name}):`, error)
      throw error
    }
  }

  async sendIncidentAlert(incident: any, phoneNumbers: string[]): Promise<boolean> {
    const message = this.generateIncidentAlertSMS(incident)

    return this.send({
      to: phoneNumbers,
      message
    })
  }

  async sendEmergencyAlert(message: string, phoneNumbers: string[]): Promise<boolean> {
    return this.send({
      to: phoneNumbers,
      message: `[EMERGENCY] ${message}`
    })
  }

  private generateIncidentAlertSMS(incident: any): string {
    // Format for SMS (160 char limit)
    return `[inCommand] ${incident.incident_type} - ${incident.priority.toUpperCase()} @ ${new Date(incident.timestamp).toLocaleTimeString()} - ${incident.occurrence.slice(0, 60)}...`
  }
}

// Export singleton instance
export const smsService = new SMSService()
