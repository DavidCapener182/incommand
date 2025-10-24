import { NextRequest, NextResponse } from 'next/server'
import { getEscalationHistory } from '@/lib/escalationEngine'

export async function POST(req: NextRequest) {
  try {
    const { incidentId } = await req.json()
    
    const history = await getEscalationHistory(incidentId)
    
    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error getting escalation history:', error)
    return NextResponse.json(
      { error: 'Failed to get escalation history' },
      { status: 500 }
    )
  }
}
