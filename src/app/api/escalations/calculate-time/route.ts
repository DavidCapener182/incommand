import { NextRequest, NextResponse } from 'next/server'
import { calculateEscalationTime } from '@/lib/escalationEngine'

export async function POST(req: NextRequest) {
  try {
    const { incidentType, priority } = await req.json()
    
    const escalationTime = await calculateEscalationTime(incidentType, priority)
    
    return NextResponse.json({ escalationTime })
  } catch (error) {
    console.error('Error calculating escalation time:', error)
    return NextResponse.json(
      { error: 'Failed to calculate escalation time' },
      { status: 500 }
    )
  }
}
