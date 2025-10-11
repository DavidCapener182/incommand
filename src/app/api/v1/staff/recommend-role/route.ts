import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

import { cookies } from 'next/headers'

import { z } from 'zod'


const roleRecommendationSchema = z.object({
  staff_id: z.string().min(1, 'Staff ID is required'),
  prior_events: z.array(z.string()).optional().default([]),
  qualifications: z.array(z.string()).optional().default([]),
  experience_level: z.enum(['junior', 'intermediate', 'senior']).optional().default('junior'),
})

const AVAILABLE_ROLES = [
  'Crowd Management',
  'Control Room', 
  'Security',
  'Medical',
  'Technical Support'
]

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

    const result = roleRecommendationSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
    }

    const { staff_id, prior_events, qualifications, experience_level } = result.data

    // Generate AI recommendation via platform proxy
    const prompt = `
Given the following staff profile:
- Previous events: ${prior_events.length} events (${prior_events.join(', ')})
- Qualifications: ${qualifications.join(', ')}
- Experience level: ${experience_level}

Recommend the most suitable role from: ${AVAILABLE_ROLES.join(', ')}.

Consider:
1. Medical qualifications → Medical role
2. Technical/IT skills → Technical Support
3. Security experience + senior level → Security
4. Crowd control experience → Crowd Management
5. Radio/communication skills → Control Room

Respond in JSON format:
{
  "recommended_role": "string",
  "confidence": 0.0-1.0,
  "justification": "brief reason (max 10 words)",
  "alternative_roles": [
    {"role": "string", "confidence": 0.0-1.0}
  ]
}
`

    let aiResponse: Response | null = null
    try {
      aiResponse = await fetch(`${request.nextUrl.origin}/api/v1/ai/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 220,
          temperature: 0.2,
        }),
      })
    } catch (fetchError) {
      console.error('AI proxy error:', fetchError)
    }

    if (!aiResponse || !aiResponse.ok) {
      if (aiResponse) {
        console.error('AI proxy response error:', await aiResponse.text().catch(() => 'unknown error'))
      }
      // Fallback to rule-based recommendation
      const fallbackRecommendation = generateFallbackRecommendation(qualifications, experience_level)
      return NextResponse.json(fallbackRecommendation)
    }

    const aiPayload = await aiResponse.json()
    const aiContent = aiPayload.summary ?? aiPayload.content ?? null

    if (!aiContent) {
      const fallbackRecommendation = generateFallbackRecommendation(qualifications, experience_level)
      return NextResponse.json(fallbackRecommendation)
    }

    try {
      const parsedRecommendation = JSON.parse(aiContent)
      
      // Validate the response structure
      if (!parsedRecommendation.recommended_role || !parsedRecommendation.confidence) {
        throw new Error('Invalid AI response structure')
      }

      // Ensure recommended role is valid
      if (!AVAILABLE_ROLES.includes(parsedRecommendation.recommended_role)) {
        parsedRecommendation.recommended_role = AVAILABLE_ROLES[0]
      }

      return NextResponse.json(parsedRecommendation)
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      const fallbackRecommendation = generateFallbackRecommendation(qualifications, experience_level)
      return NextResponse.json(fallbackRecommendation)
    }

  } catch (error) {
    console.error('Error in role recommendation endpoint:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Fallback recommendation logic when AI is unavailable
function generateFallbackRecommendation(
  qualifications: string[], 
  experience_level: string
) {
  const quals = qualifications.map(q => q.toLowerCase())
  
  // Medical qualifications
  if (quals.some(q => q.includes('paramedic') || q.includes('medical') || q.includes('first aid'))) {
    return {
      recommended_role: 'Medical',
      confidence: 0.9,
      justification: 'Medical qualifications match',
      alternative_roles: [
        { role: 'Control Room', confidence: 0.7 },
        { role: 'Security', confidence: 0.5 }
      ]
    }
  }
  
  // Technical qualifications
  if (quals.some(q => q.includes('technical') || q.includes('it') || q.includes('support'))) {
    return {
      recommended_role: 'Technical Support',
      confidence: 0.8,
      justification: 'Technical expertise',
      alternative_roles: [
        { role: 'Control Room', confidence: 0.6 },
        { role: 'Security', confidence: 0.4 }
      ]
    }
  }
  
  // Security qualifications
  if (quals.some(q => q.includes('sia') || q.includes('security'))) {
    if (experience_level === 'senior') {
      return {
        recommended_role: 'Security',
        confidence: 0.8,
        justification: 'Senior security experience',
        alternative_roles: [
          { role: 'Control Room', confidence: 0.7 },
          { role: 'Crowd Management', confidence: 0.6 }
        ]
      }
    } else {
      return {
        recommended_role: 'Crowd Management',
        confidence: 0.7,
        justification: 'Security training',
        alternative_roles: [
          { role: 'Security', confidence: 0.6 },
          { role: 'Control Room', confidence: 0.5 }
        ]
      }
    }
  }
  
  // Radio/communication skills
  if (quals.some(q => q.includes('radio') || q.includes('communication'))) {
    return {
      recommended_role: 'Control Room',
      confidence: 0.7,
      justification: 'Communication skills',
      alternative_roles: [
        { role: 'Security', confidence: 0.5 },
        { role: 'Crowd Management', confidence: 0.4 }
      ]
    }
  }
  
  // Default recommendation
  return {
    recommended_role: 'Crowd Management',
    confidence: 0.5,
    justification: 'General assignment',
    alternative_roles: [
      { role: 'Security', confidence: 0.4 },
      { role: 'Control Room', confidence: 0.3 }
    ]
  }
}
