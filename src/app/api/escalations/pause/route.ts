import { NextRequest, NextResponse } from 'next/server'
import { pauseEscalationTimer } from '@/lib/escalationEngine'

export async function POST(req: NextRequest) {
  try {
    const { incidentId, reason } = await req.json()
    
    const success = await pauseEscalationTimer(incidentId, reason)
    
    return NextResponse.json({ success })
  } catch (error) {
    console.error('Error pausing escalation timer:', error)
    return NextResponse.json(
      { error: 'Failed to pause escalation timer' },
      { status: 500 }
    )
  }
}
