/**
 * Webhook Service
 * Sends real-time data to external systems via webhooks
 */

export interface WebhookConfig {
  id: string
  name: string
  url: string
  events: WebhookEvent[]
  headers?: Record<string, string>
  secret?: string
  isActive: boolean
  retryAttempts?: number
  timeout?: number
}

export type WebhookEvent = 
  | 'incident.created'
  | 'incident.updated'
  | 'incident.closed'
  | 'log.created'
  | 'log.amended'
  | 'event.started'
  | 'event.ended'
  | 'alert.critical'

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: any
  metadata?: Record<string, any>
}

export interface WebhookDelivery {
  id: string
  webhookId: string
  event: WebhookEvent
  payload: WebhookPayload
  status: 'pending' | 'success' | 'failed' | 'retrying'
  attempts: number
  lastAttempt: string
  response?: any
  error?: string
}

class WebhookService {
  private webhooks: Map<string, WebhookConfig> = new Map()
  private deliveryQueue: WebhookDelivery[] = []
  private isProcessing = false

  /**
   * Register a webhook
   */
  registerWebhook(config: WebhookConfig): void {
    this.webhooks.set(config.id, config)
    console.log(`Webhook registered: ${config.name} (${config.url})`)
  }

  /**
   * Unregister a webhook
   */
  unregisterWebhook(webhookId: string): void {
    this.webhooks.delete(webhookId)
    console.log(`Webhook unregistered: ${webhookId}`)
  }

  /**
   * Get all registered webhooks
   */
  getWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values())
  }

  /**
   * Trigger webhook for an event
   */
  async trigger(event: WebhookEvent, data: any, metadata?: Record<string, any>): Promise<void> {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      metadata
    }

    // Find matching webhooks
    const matchingWebhooks = Array.from(this.webhooks.values()).filter(
      webhook => webhook.isActive && webhook.events.includes(event)
    )

    if (matchingWebhooks.length === 0) {
      console.log(`No webhooks registered for event: ${event}`)
      return
    }

    // Queue deliveries
    for (const webhook of matchingWebhooks) {
      const delivery: WebhookDelivery = {
        id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        webhookId: webhook.id,
        event,
        payload,
        status: 'pending',
        attempts: 0,
        lastAttempt: new Date().toISOString()
      }

      this.deliveryQueue.push(delivery)
    }

    // Process queue
    this.processQueue()
  }

  /**
   * Process delivery queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return

    this.isProcessing = true

    while (this.deliveryQueue.length > 0) {
      const delivery = this.deliveryQueue[0]
      const webhook = this.webhooks.get(delivery.webhookId)

      if (!webhook) {
        console.warn(`Webhook not found: ${delivery.webhookId}`)
        this.deliveryQueue.shift()
        continue
      }

      try {
        await this.sendWebhook(webhook, delivery)
        this.deliveryQueue.shift() // Remove from queue on success
      } catch (error) {
        // Handle retry logic
        delivery.attempts++
        delivery.lastAttempt = new Date().toISOString()

        const maxAttempts = webhook.retryAttempts || 3
        if (delivery.attempts >= maxAttempts) {
          delivery.status = 'failed'
          console.error(`Webhook delivery failed after ${maxAttempts} attempts:`, delivery.id)
          this.deliveryQueue.shift() // Remove from queue
        } else {
          delivery.status = 'retrying'
          console.log(`Retrying webhook delivery (${delivery.attempts}/${maxAttempts}):`, delivery.id)
          // Move to end of queue
          this.deliveryQueue.shift()
          this.deliveryQueue.push(delivery)
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * delivery.attempts))
        }
      }
    }

    this.isProcessing = false
  }

  /**
   * Send webhook request
   */
  private async sendWebhook(webhook: WebhookConfig, delivery: WebhookDelivery): Promise<void> {
    const { payload } = delivery

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'inCommand-Webhook/1.0',
      'X-Webhook-Event': payload.event,
      'X-Webhook-Timestamp': payload.timestamp,
      ...webhook.headers
    }

    // Add signature if secret provided
    if (webhook.secret) {
      const signature = await this.generateSignature(payload, webhook.secret)
      headers['X-Webhook-Signature'] = signature
    }

    // Send request
    const controller = new AbortController()
    const timeout = webhook.timeout || 10000

    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      delivery.response = {
        status: response.status,
        statusText: response.statusText
      }

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}: ${response.statusText}`)
      }

      delivery.status = 'success'
      console.log(`Webhook delivered successfully: ${webhook.name}`)

    } catch (error: any) {
      if (error.name === 'AbortError') {
        delivery.error = 'Request timeout'
      } else {
        delivery.error = error.message
      }
      throw error
    }
  }

  /**
   * Generate HMAC signature for webhook security
   */
  private async generateSignature(payload: any, secret: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(payload))
    const key = encoder.encode(secret)

    // Use Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data)
    const hashArray = Array.from(new Uint8Array(signature))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    return hashHex
  }

  /**
   * Test webhook connection
   */
  async testWebhook(webhookId: string): Promise<{ success: boolean; message: string }> {
    const webhook = this.webhooks.get(webhookId)
    
    if (!webhook) {
      return { success: false, message: 'Webhook not found' }
    }

    try {
      const testPayload: WebhookPayload = {
        event: 'incident.created',
        timestamp: new Date().toISOString(),
        data: {
          test: true,
          message: 'This is a test webhook from inCommand'
        }
      }

      const delivery: WebhookDelivery = {
        id: 'test',
        webhookId: webhook.id,
        event: 'incident.created',
        payload: testPayload,
        status: 'pending',
        attempts: 0,
        lastAttempt: new Date().toISOString()
      }

      await this.sendWebhook(webhook, delivery)

      return { success: true, message: 'Webhook test successful' }
    } catch (error: any) {
      return { success: false, message: error.message }
    }
  }
}

// Export singleton instance
export const webhookService = new WebhookService()

// Initialize default webhooks (from environment or database)
if (process.env.DEFAULT_WEBHOOK_URL) {
  webhookService.registerWebhook({
    id: 'default',
    name: 'Default Webhook',
    url: process.env.DEFAULT_WEBHOOK_URL,
    events: [
      'incident.created',
      'incident.updated',
      'incident.closed',
      'alert.critical'
    ],
    isActive: true,
    retryAttempts: 3,
    timeout: 10000
  })
}
