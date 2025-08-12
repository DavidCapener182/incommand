import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { CrowdFlowPredictionEngine } from '../../../../lib/crowdFlowPrediction';
import { PatternRecognitionEngine } from '../../../../lib/patternRecognition';

export interface CrowdDensityPredictionsResponse {
  currentDensity: {
    occupancy: number;
    capacity: number;
    percentage: number;
    status: 'low' | 'medium' | 'high' | 'critical';
  };
  predictions: {
    timestamp: string;
    predictedCount: number;
    predictedPercentage: number;
    confidence: number;
    factors: string[];
  }[];
  flowAnalysis: {
    entryRate: number;
    exitRate: number;
    netFlow: number;
    peakEntryTime: string | null;
    peakExitTime: string | null;
  };
  capacityWarnings: {
    time: string;
    predictedOccupancy: number;
    severity: 'warning' | 'critical';
    recommendations: string[];
  }[];
  venueZones: {
    zone: string;
    currentOccupancy: number;
    predictedPeak: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  }[];
  crowdBehavior: {
    movementPatterns: string[];
    congestionPoints: string[];
    flowEfficiency: number;
    recommendations: string[];
  };
  lastUpdated: string;
  confidence: number;
}

// Cache for storing crowd density prediction results
const crowdDensityCache = new Map<string, { data: CrowdDensityPredictionsResponse; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
      .select('id, organization_id, venue_name, venue_capacity, event_date, main_act_start_time, curfew_time')
      .eq('id', eventId)
      .single();

    if (accessError || !eventAccess) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check cache first
    const cacheKey = `${eventId}-crowd-${user.id}`;
    const cachedData = crowdDensityCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData.data);
    }

    // Initialize engines
    const crowdEngine = new CrowdFlowPredictionEngine(eventId);
    const patternEngine = new PatternRecognitionEngine(eventId);

    // Fetch crowd data and analyze patterns
    const [
      crowdFlow,
      occupancyForecast,
      currentOccupancy,
      venueZones,
      flowPatterns,
      historicalFlow
    ] = await Promise.all([
      crowdEngine.predictCrowdFlow(),
      crowdEngine.calculateOccupancyForecast(),
      crowdEngine.getCurrentOccupancy(),
      crowdEngine.getVenueZoneAnalysis(),
      patternEngine.analyzeCrowdFlowPatterns(),
      patternEngine.getHistoricalCrowdFlow()
    ]);

    // Analyze current density
    const currentDensity = analyzeCurrentDensity(currentOccupancy, eventAccess.venue_capacity);

    // Generate capacity warnings
    const capacityWarnings = generateCapacityWarnings(crowdFlow, eventAccess.venue_capacity);

    // Analyze crowd behavior
    const crowdBehavior = analyzeCrowdBehavior(flowPatterns, venueZones);

    // Calculate flow analysis
    const flowAnalysis = calculateFlowAnalysis(historicalFlow, crowdFlow);

    // Build response
    const response: CrowdDensityPredictionsResponse = {
      currentDensity,
      predictions: crowdFlow.map(prediction => ({
        timestamp: prediction.timestamp.toISOString(),
        predictedCount: prediction.predictedCount,
        predictedPercentage: (prediction.predictedCount / eventAccess.venue_capacity) * 100,
        confidence: prediction.confidence,
        factors: Object.entries(prediction.factors || {}).map(([key, value]) => `${key}: ${value}`)
      })),
      flowAnalysis,
      capacityWarnings,
      venueZones: venueZones.map(zone => ({
        zone: zone.name,
        currentOccupancy: zone.currentOccupancy,
        predictedPeak: zone.predictedPeak,
        riskLevel: zone.riskLevel,
        recommendations: zone.recommendations
      })),
      crowdBehavior,
      lastUpdated: new Date().toISOString(),
      confidence: calculateCrowdConfidence(crowdFlow, occupancyForecast, historicalFlow)
    };

    // Cache the response
    crowdDensityCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    // Store predictions in database
    await crowdEngine.storeCrowdPredictions(crowdFlow);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating crowd density predictions:', error);
    return NextResponse.json(
      { error: 'Failed to generate crowd density predictions' },
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
    const { eventId, forceRefresh = false, customParameters } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Clear cache if force refresh is requested
    if (forceRefresh) {
      const cacheKey = `${eventId}-crowd-${user.id}`;
      crowdDensityCache.delete(cacheKey);
    }

    // If custom parameters are provided, use them for analysis
    if (customParameters) {
      console.log('Custom crowd parameters provided:', customParameters);
      // This would allow for scenario planning with different crowd parameters
    }

    // Reuse the GET logic
    const url = new URL(request.url);
    url.searchParams.set('eventId', eventId);
    
    const getRequest = new NextRequest(url, {
      method: 'GET',
      headers: request.headers
    });

    return GET(getRequest);
  } catch (error) {
    console.error('Error in POST crowd density predictions:', error);
    return NextResponse.json(
      { error: 'Failed to process crowd density predictions request' },
      { status: 500 }
    );
  }
}

// Helper functions
function analyzeCurrentDensity(currentOccupancy: number, venueCapacity: number) {
  const percentage = (currentOccupancy / venueCapacity) * 100;
  
  let status: 'low' | 'medium' | 'high' | 'critical';
  if (percentage < 30) status = 'low';
  else if (percentage < 60) status = 'medium';
  else if (percentage < 85) status = 'high';
  else status = 'critical';

  return {
    occupancy: currentOccupancy,
    capacity: venueCapacity,
    percentage: Math.round(percentage * 10) / 10,
    status
  };
}

function generateCapacityWarnings(crowdFlow: any[], venueCapacity: number) {
  const warnings = [];
  const criticalThreshold = venueCapacity * 0.9; // 90% capacity
  const warningThreshold = venueCapacity * 0.75; // 75% capacity

  crowdFlow.forEach(prediction => {
    if (prediction.predictedCount >= criticalThreshold) {
      warnings.push({
        time: prediction.timestamp.toISOString(),
        predictedOccupancy: prediction.predictedCount,
        severity: 'critical' as const,
        recommendations: [
          'Implement immediate crowd control measures',
          'Consider temporary venue closure',
          'Deploy maximum security and medical staff',
          'Activate emergency response protocols'
        ]
      });
    } else if (prediction.predictedCount >= warningThreshold) {
      warnings.push({
        time: prediction.timestamp.toISOString(),
        predictedOccupancy: prediction.predictedCount,
        severity: 'warning' as const,
        recommendations: [
          'Increase security presence',
          'Monitor entry rates closely',
          'Prepare for potential capacity issues',
          'Review crowd flow management procedures'
        ]
      });
    }
  });

  return warnings.slice(0, 5); // Limit to top 5 warnings
}

function analyzeCrowdBehavior(flowPatterns: any[], venueZones: any[]) {
  const movementPatterns = [];
  const congestionPoints = [];
  const recommendations = [];

  // Analyze movement patterns
  if (flowPatterns.length > 0) {
    const mainPattern = flowPatterns[0];
    if (mainPattern.type === 'bottleneck') {
      movementPatterns.push('Bottleneck formation detected');
      recommendations.push('Implement crowd flow management at bottleneck points');
    } else if (mainPattern.type === 'surge') {
      movementPatterns.push('Crowd surge patterns identified');
      recommendations.push('Prepare for sudden crowd movements');
    } else if (mainPattern.type === 'stagnation') {
      movementPatterns.push('Crowd stagnation in certain areas');
      recommendations.push('Redirect crowd flow to reduce congestion');
    }
  }

  // Identify congestion points
  venueZones
    .filter(zone => zone.riskLevel === 'high')
    .forEach(zone => {
      congestionPoints.push(zone.name);
      recommendations.push(`Increase monitoring at ${zone.name}`);
    });

  // Calculate flow efficiency
  const flowEfficiency = calculateFlowEfficiency(flowPatterns, venueZones);

  return {
    movementPatterns,
    congestionPoints,
    flowEfficiency,
    recommendations
  };
}

function calculateFlowAnalysis(historicalFlow: any[], crowdFlow: any[]) {
  // Calculate entry and exit rates based on historical data
  const entryRate = historicalFlow.length > 0 ? 
    historicalFlow.reduce((sum, flow) => sum + (flow.entryRate || 0), 0) / historicalFlow.length : 0;
  
  const exitRate = historicalFlow.length > 0 ? 
    historicalFlow.reduce((sum, flow) => sum + (flow.exitRate || 0), 0) / historicalFlow.length : 0;

  const netFlow = entryRate - exitRate;

  // Find peak times
  const peakEntryTime = crowdFlow.length > 0 ? 
    crowdFlow.reduce((max, flow) => flow.predictedCount > max.predictedCount ? flow : max).timestamp.toISOString() : null;
  
  const peakExitTime = historicalFlow.length > 0 ? 
    historicalFlow.reduce((max, flow) => (flow.exitRate || 0) > (max.exitRate || 0) ? flow : max).timestamp?.toISOString() : null;

  return {
    entryRate: Math.round(entryRate * 100) / 100,
    exitRate: Math.round(exitRate * 100) / 100,
    netFlow: Math.round(netFlow * 100) / 100,
    peakEntryTime,
    peakExitTime
  };
}

function calculateFlowEfficiency(flowPatterns: any[], venueZones: any[]): number {
  if (flowPatterns.length === 0) return 100;

  // Calculate efficiency based on patterns and zone risks
  const patternEfficiency = flowPatterns.reduce((sum, pattern) => {
    switch (pattern.type) {
      case 'bottleneck': return sum + 60;
      case 'surge': return sum + 70;
      case 'stagnation': return sum + 50;
      default: return sum + 90;
    }
  }, 0) / flowPatterns.length;

  const zoneEfficiency = venueZones.reduce((sum, zone) => {
    switch (zone.riskLevel) {
      case 'high': return sum + 50;
      case 'medium': return sum + 75;
      case 'low': return sum + 95;
      default: return sum + 85;
    }
  }, 0) / venueZones.length;

  return Math.round((patternEfficiency + zoneEfficiency) / 2);
}

function calculateCrowdConfidence(crowdFlow: any[], occupancyForecast: any, historicalFlow: any[]): number {
  const flowConfidence = crowdFlow.length > 0 ? 
    crowdFlow.reduce((sum, flow) => sum + flow.confidence, 0) / crowdFlow.length : 0.5;
  
  const forecastConfidence = occupancyForecast?.confidence || 0.5;
  
  const historicalConfidence = historicalFlow.length > 0 ? 
    Math.min(historicalFlow.length / 50, 1.0) : 0.3;

  return Math.round(((flowConfidence + forecastConfidence + historicalConfidence) / 3) * 100) / 100;
}
