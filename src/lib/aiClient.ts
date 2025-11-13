/**
 * AI Client Wrapper
 * Wraps AI API calls with usage tracking, quota enforcement, and cost calculation
 */

import { checkQuota } from './subscriptions'
import { logAIUsage } from './aiUsage'
import { logClientEvent } from '@/analytics/events'

// Model pricing per 1M tokens (input/output)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
  'claude-3-sonnet-20240229': { input: 3.0, output: 15.0 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
}

/**
 * Estimate token count from text (rough approximation)
 * Uses ~4 characters per token as a rule of thumb
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Calculate cost based on tokens and model pricing
 */
function calculateCost(
  model: string,
  tokensPrompt: number,
  tokensCompletion: number
): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o-mini']
  const inputCost = (tokensPrompt / 1_000_000) * pricing.input
  const outputCost = (tokensCompletion / 1_000_000) * pricing.output
  return inputCost + outputCost
}

export interface AICallParams {
  userId: string
  orgId?: string | null
  endpoint: string
  model: string
  messages?: Array<{ role: string; content: string }>
  prompt?: string
  maxTokens?: number
  temperature?: number
  metadata?: Record<string, any>
}

export interface AICallResponse {
  content: string
  tokensPrompt?: number
  tokensCompletion?: number
  tokensTotal?: number
  costUsd?: number
}

/**
 * Call AI API with usage tracking and quota enforcement
 */
export async function callAI(params: AICallParams): Promise<AICallResponse> {
  const startTime = Date.now()

  // Check quota before making the call
  const quota = await checkQuota({ userId: params.userId })

  if (quota.hardBlocked) {
    logClientEvent('ai_call_blocked', {
      userId: params.userId,
      reason: 'quota_exceeded',
      usagePercentage: quota.usagePercentage,
    })
    throw new Error('AI usage limit reached for your subscription. Please upgrade or wait for your quota to reset.')
  }

  // Warn if approaching limit
  if (quota.usagePercentage >= 80 && quota.policy === 'warn') {
    console.warn(`User ${params.userId} is at ${quota.usagePercentage}% of quota`)
  }

  try {
    // Determine which API to call based on model
    const isOpenAI = params.model.startsWith('gpt-')
    const isAnthropic = params.model.startsWith('claude-')

    let response: Response
    let responseData: any

    if (isOpenAI) {
      // OpenAI API call
      const openaiUrl = 'https://api.openai.com/v1/chat/completions'
      const apiKey = process.env.OPENAI_API_KEY

      if (!apiKey) {
        throw new Error('OpenAI API key not configured')
      }

      const body: any = {
        model: params.model,
        max_tokens: params.maxTokens || 1000,
        temperature: params.temperature || 0.7,
      }

      if (params.messages) {
        body.messages = params.messages
      } else if (params.prompt) {
        body.messages = [{ role: 'user', content: params.prompt }]
      } else {
        throw new Error('Either messages or prompt must be provided')
      }

      response = await fetch(openaiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
      }

      responseData = await response.json()
    } else if (isAnthropic) {
      // Anthropic API call
      const anthropicUrl = 'https://api.anthropic.com/v1/messages'
      const apiKey = process.env.ANTHROPIC_API_KEY

      if (!apiKey) {
        throw new Error('Anthropic API key not configured')
      }

      const messages = params.messages || [{ role: 'user', content: params.prompt || '' }]
      const systemMessage = messages.find((m) => m.role === 'system')
      const userMessages = messages.filter((m) => m.role !== 'system')

      const body = {
        model: params.model,
        max_tokens: params.maxTokens || 1000,
        temperature: params.temperature || 0.7,
        messages: userMessages.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        ...(systemMessage && { system: systemMessage.content }),
      }

      response = await fetch(anthropicUrl, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
      }

      responseData = await response.json()
    } else {
      throw new Error(`Unsupported model: ${params.model}`)
    }

    // Extract response content
    let content = ''
    let tokensPrompt = 0
    let tokensCompletion = 0

    if (isOpenAI) {
      content = responseData.choices?.[0]?.message?.content || ''
      tokensPrompt = responseData.usage?.prompt_tokens || 0
      tokensCompletion = responseData.usage?.completion_tokens || 0
    } else if (isAnthropic) {
      content = responseData.content?.[0]?.text || ''
      tokensPrompt = responseData.usage?.input_tokens || 0
      tokensCompletion = responseData.usage?.output_tokens || 0
    }

    // Fallback to estimation if tokens not provided
    if (tokensPrompt === 0 && params.messages) {
      const promptText = params.messages.map((m) => m.content).join('\n')
      tokensPrompt = estimateTokens(promptText)
    } else if (tokensPrompt === 0 && params.prompt) {
      tokensPrompt = estimateTokens(params.prompt)
    }

    if (tokensCompletion === 0 && content) {
      tokensCompletion = estimateTokens(content)
    }

    const tokensTotal = tokensPrompt + tokensCompletion
    const costUsd = calculateCost(params.model, tokensPrompt, tokensCompletion)

    // Log usage
    await logAIUsage({
      userId: params.userId,
      orgId: params.orgId,
      endpoint: params.endpoint,
      model: params.model,
      tokensPrompt,
      tokensCompletion,
      tokensTotal,
      costUsd,
      metadata: {
        ...params.metadata,
        latencyMs: Date.now() - startTime,
        quotaUsagePercentage: quota.usagePercentage,
      },
    })

    // Emit telemetry
    logClientEvent('ai_call_logged', {
      userId: params.userId,
      endpoint: params.endpoint,
      model: params.model,
      tokensTotal,
      costUsd,
    })

    return {
      content,
      tokensPrompt,
      tokensCompletion,
      tokensTotal,
      costUsd,
    }
  } catch (error) {
    // Log failed call
    logClientEvent('ai_call_failed', {
      userId: params.userId,
      endpoint: params.endpoint,
      model: params.model,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    throw error
  }
}

/**
 * Helper to call OpenAI chat completions (backward compatibility)
 */
export async function callOpenAI(params: {
  userId: string
  orgId?: string | null
  messages: Array<{ role: string; content: string }>
  model?: string
  maxTokens?: number
  temperature?: number
  metadata?: Record<string, any>
}): Promise<AICallResponse> {
  return callAI({
    userId: params.userId,
    orgId: params.orgId,
    endpoint: 'chat.completions',
    model: params.model || 'gpt-4o-mini',
    messages: params.messages,
    maxTokens: params.maxTokens,
    temperature: params.temperature,
    metadata: params.metadata,
  })
}





