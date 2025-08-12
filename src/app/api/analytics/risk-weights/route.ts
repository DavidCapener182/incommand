import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { RiskScoringEngine, RiskWeights, DEFAULT_RISK_WEIGHTS } from '../../../../lib/riskScoring';

export interface RiskWeightsResponse {
  currentWeights: RiskWeights;
  isCustom: boolean;
  lastUpdated?: string;
  message?: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get event ID from query parameters
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Check if user has access to this event
    const { data: eventAccess, error: accessError } = await supabase
      .from('events')
      .select('id, organization_id, risk_weights')
      .eq('id', eventId)
      .single();

    if (accessError || !eventAccess) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Initialize risk scoring engine
    const riskEngine = new RiskScoringEngine(eventId);
    const currentWeights = await riskEngine.getCurrentRiskWeights();

    // Check if weights are custom or default
    const isCustom = eventAccess.risk_weights !== null;

    const response: RiskWeightsResponse = {
      currentWeights,
      isCustom,
      lastUpdated: isCustom ? new Date().toISOString() : undefined,
      message: isCustom ? 'Using custom risk weights' : 'Using default risk weights'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching risk weights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risk weights' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, weights, action } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Check if user has access to this event
    const { data: eventAccess, error: accessError } = await supabase
      .from('events')
      .select('id, organization_id')
      .eq('id', eventId)
      .single();

    if (accessError || !eventAccess) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Initialize risk scoring engine
    const riskEngine = new RiskScoringEngine(eventId);

    let success = false;
    let message = '';

    if (action === 'set' && weights) {
      // Set custom weights
      success = await riskEngine.setRiskWeights(weights);
      message = success ? 'Risk weights updated successfully' : 'Failed to update risk weights';
    } else if (action === 'reset') {
      // Reset to defaults
      success = await riskEngine.resetRiskWeights();
      message = success ? 'Risk weights reset to defaults' : 'Failed to reset risk weights';
    } else {
      return NextResponse.json({ error: 'Invalid action or missing weights' }, { status: 400 });
    }

    if (!success) {
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Get updated weights
    const currentWeights = await riskEngine.getCurrentRiskWeights();
    const isCustom = action === 'set';

    const response: RiskWeightsResponse = {
      currentWeights,
      isCustom,
      lastUpdated: new Date().toISOString(),
      message
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error managing risk weights:', error);
    return NextResponse.json(
      { error: 'Failed to manage risk weights' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, weights } = body;

    if (!eventId || !weights) {
      return NextResponse.json({ error: 'Event ID and weights are required' }, { status: 400 });
    }

    // Validate weights structure
    const requiredKeys = ['weather', 'crowd', 'time', 'location', 'eventPhase'];
    const hasAllKeys = requiredKeys.every(key => key in weights);
    
    if (!hasAllKeys) {
      return NextResponse.json({ 
        error: 'Invalid weights format. Must include: weather, crowd, time, location, eventPhase' 
      }, { status: 400 });
    }

    // Validate weights sum to 1.0
    const sum = Object.values(weights).reduce((acc: number, val: any) => acc + val, 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      return NextResponse.json({ 
        error: 'Weights must sum to 1.0. Current sum: ' + sum.toFixed(3) 
      }, { status: 400 });
    }

    // Check if user has access to this event
    const { data: eventAccess, error: accessError } = await supabase
      .from('events')
      .select('id, organization_id')
      .eq('id', eventId)
      .single();

    if (accessError || !eventAccess) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Initialize risk scoring engine and set weights
    const riskEngine = new RiskScoringEngine(eventId);
    const success = await riskEngine.setRiskWeights(weights);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update risk weights' }, { status: 500 });
    }

    const response: RiskWeightsResponse = {
      currentWeights: weights,
      isCustom: true,
      lastUpdated: new Date().toISOString(),
      message: 'Risk weights updated successfully'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating risk weights:', error);
    return NextResponse.json(
      { error: 'Failed to update risk weights' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get event ID from query parameters
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Check if user has access to this event
    const { data: eventAccess, error: accessError } = await supabase
      .from('events')
      .select('id, organization_id')
      .eq('id', eventId)
      .single();

    if (accessError || !eventAccess) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Initialize risk scoring engine and reset weights
    const riskEngine = new RiskScoringEngine(eventId);
    const success = await riskEngine.resetRiskWeights();

    if (!success) {
      return NextResponse.json({ error: 'Failed to reset risk weights' }, { status: 500 });
    }

    const response: RiskWeightsResponse = {
      currentWeights: DEFAULT_RISK_WEIGHTS,
      isCustom: false,
      lastUpdated: new Date().toISOString(),
      message: 'Risk weights reset to defaults'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error resetting risk weights:', error);
    return NextResponse.json(
      { error: 'Failed to reset risk weights' },
      { status: 500 }
    );
  }
}
