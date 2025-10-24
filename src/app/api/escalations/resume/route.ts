import { NextRequest, NextResponse } from 'next/server'
import { resumeEscalationTimer } from '@/lib/escalationEngine'

export async function POST(req: NextRequest) {
  try {
    const { incidentId, reason } = await req.json()
    
    const success = await resumeEscalationTimer(incidentId, reason)
    
    return NextResponse.json({ success })
  } catch (error) {
    console.error('Error resuming escalation timer:', error)
    return NextResponse.json(
      { error: 'Failed to resume escalation timer' },
      { status: 500 }
    )
  }
}
