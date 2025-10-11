import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

import { cookies } from 'next/headers'

import { z } from 'zod'


const promptSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  max_tokens: z.number().min(1).max(4000).optional().default(150),
  temperature: z.number().min(0).max(2).optional().default(0.7),
})

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const result = promptSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
    }

    const { prompt, max_tokens, temperature } = result.data

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured' 
      }, { status: 500 })
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that provides concise, professional operational summaries for event security and incident management. Keep responses brief and focused on key insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens,
        temperature,
        stream: false,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}))
      console.error('OpenAI API error:', errorData)
      return NextResponse.json({ 
        error: 'Failed to generate AI response' 
      }, { status: 500 })
    }

    const openaiData = await openaiResponse.json()
    const summary = openaiData.choices?.[0]?.message?.content?.trim()

    if (!summary) {
      return NextResponse.json({ 
        error: 'No response generated from AI' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      summary,
      tokens_used: openaiData.usage?.total_tokens || 0,
      model: openaiData.model || 'gpt-4-turbo-preview'
    })

  } catch (error) {
    console.error('Error in AI prompt endpoint:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
