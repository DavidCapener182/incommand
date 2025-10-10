import { NextRequest, NextResponse } from 'next/server'
import { extractIncidentFromVoice, generateVoiceConfirmation } from '@/lib/ai/voiceIncidentExtraction'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transcript, provider = 'openai' } = body

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      )
    }

    // Extract incident data from voice
    const extracted = await extractIncidentFromVoice(transcript, provider)

    // Generate voice confirmation
    const confirmation = await generateVoiceConfirmation(extracted)

    return NextResponse.json({
      success: true,
      data: extracted,
      confirmation,
      transcript
    })
  } catch (error) {
    console.error('Voice extraction API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to extract incident from voice', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

