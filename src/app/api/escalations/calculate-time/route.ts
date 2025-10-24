import { NextRequest, NextResponse } from 'next/server'
import { calculateEscalationTime } from '@/lib/escalationEngine'

export async function POST(req: NextRequest) {
  try {
    const { incidentType, priority, eventId } = await req.json()
    
    const escalationTime = await calculateEscalationTime(incidentType, priority, eventId)
    
    return NextResponse.json({ escalationTime })
  } catch (error) {
    console.error('Error calculating escalation time:', error)
    return NextResponse.json(
      { error: 'Failed to calculate escalation time' },
      { status: 500 }
    )
  }
}
