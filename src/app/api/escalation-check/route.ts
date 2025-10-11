import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { cookies } from 'next/headers';

import { checkEscalations, getEscalationStats } from '../../../lib/escalationEngine';


export async function POST(request: NextRequest) {
  try {
    // Check for Supabase authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body for optional parameters
    const body = await request.json().catch(() => ({}));
    const { eventId, dryRun = false } = body;

    // Check escalations
    const escalatedIncidentIds = await checkEscalations();

    // Get escalation statistics if eventId is provided
    let stats = null;
    if (eventId) {
      stats = await getEscalationStats(eventId);
    }

    return NextResponse.json({
      success: true,
      escalatedIncidents: escalatedIncidentIds.length,
      escalatedIncidentIds,
      dryRun,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in escalation check:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for Supabase authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    // Get escalation statistics
    let stats = null;
    if (eventId) {
      stats = await getEscalationStats(eventId);
    }

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting escalation stats:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
