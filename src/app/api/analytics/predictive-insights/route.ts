import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { cookies } from 'next/headers';

import { RiskScoringEngine } from '../../../../lib/riskScoring';

import { PatternRecognitionEngine } from '../../../../lib/patternRecognition';

import { PredictiveAlertSystem } from '../../../../lib/predictiveAlerts';

import { CrowdFlowPredictionEngine } from '../../../../lib/crowdFlowPrediction';


export interface PredictiveInsightsResponse {
  overallRisk: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    contributingFactors: string[];
    confidence: number;
  };
  locationRisks: {
    location: string;
    riskScore: number;
    incidentTypes: string[];
    lastIncident?: string;
  }[];
  incidentTypeRisks: {
    incidentType: string;
    riskScore: number;
    probability: number;
    contributingFactors: string[];
  }[];
  crowdFlow: {
    predictions: {
      timestamp: string;
      predictedCount: number;
      confidence: number;
    }[];
    peakTime: string | null;
    peakOccupancy: number;
    capacityWarnings: string[];
  };
  weatherAlerts: {
    condition: string;
    change: string;
    impact: string;
    recommendations: string[];
    severity: 'info' | 'warning' | 'critical';
  }[];
  crowdAlerts: {
    currentDensity: number;
    predictedDensity: number;
    threshold: number;
    timeToThreshold: number;
    recommendations: string[];
    severity: 'info' | 'warning' | 'critical';
  }[];
  riskAlerts: {
    riskScore: number;
    threshold: number;
    contributingFactors: string[];
    recommendations: string[];
    severity: 'info' | 'warning' | 'critical';
  }[];
  proactiveRecommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    recommendation: string;
    reasoning: string;
  }[];
  lastUpdated: string;
  confidence: number;
}

// Cache for storing prediction results
const predictionCache = new Map<string, { data: PredictiveInsightsResponse; timestamp: number }>();
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
      .select('id, organization_id')
      .eq('id', eventId)
      .single();

    if (accessError || !eventAccess) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check cache first
    const cacheKey = `${eventId}-${user.id}`;
    const cachedData = predictionCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData.data);
    }

    // Initialize engines
    const riskEngine = new RiskScoringEngine(eventId);
    const patternEngine = new PatternRecognitionEngine(eventId);
    const alertSystem = new PredictiveAlertSystem(eventId);
    const crowdEngine = new CrowdFlowPredictionEngine(eventId);

    // Fetch all predictive data in parallel
    const [
      overallRisk,
      locationRisks,
      incidentTypeRisks,
      crowdFlow,
      occupancyForecast,
      weatherAlerts,
      crowdAlerts,
      riskAlerts
    ] = await Promise.all([
      riskEngine.calculateOverallRiskScore(),
      riskEngine.getLocationSpecificRiskScores(),
      riskEngine.getIncidentTypeRiskScores(),
      crowdEngine.predictCrowdFlow(),
      crowdEngine.calculateOccupancyForecast(),
      alertSystem.monitorWeatherAlerts(),
      alertSystem.monitorCrowdDensityAlerts(),
      alertSystem.checkRiskThresholds()
    ]);

    // Generate proactive recommendations
    const proactiveRecommendations = generateProactiveRecommendations(
      overallRisk,
      locationRisks,
      incidentTypeRisks,
      occupancyForecast,
      weatherAlerts,
      crowdAlerts,
      riskAlerts
    );

    // Calculate overall confidence
    const confidence = calculateOverallConfidence(
      overallRisk,
      crowdFlow,
      occupancyForecast
    );

    // Build response
    const response: PredictiveInsightsResponse = {
      overallRisk: {
        score: overallRisk.overallScore,
        level: overallRisk.overallScore < 30 ? 'low' : 
               overallRisk.overallScore < 60 ? 'medium' : 
               overallRisk.overallScore < 80 ? 'high' : 'critical',
        contributingFactors: overallRisk.contributingFactors.map(factor => 
          `${factor.factorType}: ${factor.factorValue.condition || factor.factorValue.densityRange || factor.factorValue.timeSlot || factor.factorValue.location}`
        ),
        confidence: overallRisk.confidence
      },
      locationRisks: locationRisks.map(location => ({
        location: location.location,
        riskScore: location.riskScore,
        incidentTypes: location.incidentTypes,
        lastIncident: location.lastIncident?.toISOString()
      })),
      incidentTypeRisks: incidentTypeRisks.map(incident => ({
        incidentType: incident.incidentType,
        riskScore: incident.riskScore * 100,
        probability: incident.probability * 100,
        contributingFactors: incident.contributingFactors
      })),
      crowdFlow: {
        predictions: crowdFlow.map(prediction => ({
          timestamp: prediction.timestamp.toISOString(),
          predictedCount: prediction.predictedCount,
          confidence: prediction.confidence
        })),
        peakTime: occupancyForecast?.peakTime?.toISOString() || null,
        peakOccupancy: occupancyForecast?.peakOccupancy || 0,
        capacityWarnings: occupancyForecast?.capacityWarnings || []
      },
      weatherAlerts: weatherAlerts.map(alert => ({
        condition: alert.condition,
        change: alert.change,
        impact: alert.impact,
        recommendations: alert.recommendations,
        severity: alert.severity
      })),
      crowdAlerts: crowdAlerts.map(alert => ({
        currentDensity: alert.currentDensity,
        predictedDensity: alert.predictedDensity,
        threshold: alert.threshold,
        timeToThreshold: alert.timeToThreshold,
        recommendations: alert.recommendations,
        severity: alert.severity
      })),
      riskAlerts: riskAlerts.map(alert => ({
        riskScore: alert.riskScore,
        threshold: alert.threshold,
        contributingFactors: alert.contributingFactors,
        recommendations: alert.recommendations,
        severity: alert.severity
      })),
      proactiveRecommendations,
      lastUpdated: new Date().toISOString(),
      confidence
    };

    // Cache the response
    predictionCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    // Store predictions in database
    await crowdEngine.storeCrowdPredictions(crowdFlow);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating predictive insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictive insights' },
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
      const cacheKey = `${eventId}-${user.id}`;
      predictionCache.delete(cacheKey);
    }

    // If custom parameters are provided, use them to adjust predictions
    if (customParameters) {
      // This would allow for custom prediction scenarios
      // For now, we'll just return the standard predictions
      console.log('Custom parameters provided:', customParameters);
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
    console.error('Error in POST predictive insights:', error);
    return NextResponse.json(
      { error: 'Failed to process predictive insights request' },
      { status: 500 }
    );
  }
}

// Helper functions
function generateProactiveRecommendations(
  overallRisk: any,
  locationRisks: any[],
  incidentTypeRisks: any[],
  occupancyForecast: any,
  weatherAlerts: any[],
  crowdAlerts: any[],
  riskAlerts: any[]
): { priority: 'high' | 'medium' | 'low'; category: string; recommendation: string; reasoning: string }[] {
  const recommendations: { priority: 'high' | 'medium' | 'low'; category: string; recommendation: string; reasoning: string }[] = [];

  // High-risk recommendations
  if (overallRisk.overallScore >= 80) {
    recommendations.push({
      priority: 'high',
      category: 'Emergency Response',
      recommendation: 'Activate emergency response protocols and deploy maximum security and medical staff',
      reasoning: `Overall risk score is critical (${overallRisk.overallScore}%)`
    });
  }

  // Weather-related recommendations
  weatherAlerts.forEach(alert => {
    if (alert.severity === 'critical') {
      recommendations.push({
        priority: 'high',
        category: 'Weather Management',
        recommendation: alert.recommendations[0] || 'Take immediate weather-related precautions',
        reasoning: `Critical weather alert: ${alert.condition} - ${alert.change}`
      });
    }
  });

  // Crowd-related recommendations
  crowdAlerts.forEach(alert => {
    if (alert.severity === 'critical') {
      recommendations.push({
        priority: 'high',
        category: 'Crowd Control',
        recommendation: alert.recommendations[0] || 'Implement immediate crowd control measures',
        reasoning: `Critical crowd density alert: ${alert.currentDensity.toFixed(1)}% occupancy`
      });
    }
  });

  // Location-specific recommendations
  locationRisks
    .filter(location => location.riskScore >= 70)
    .forEach(location => {
      recommendations.push({
        priority: 'medium',
        category: 'Location Security',
        recommendation: `Increase security presence at ${location.location}`,
        reasoning: `High risk location: ${location.riskScore}% risk score with ${location.incidentTypes.join(', ')} incidents`
      });
    });

  // Capacity recommendations
  if (occupancyForecast?.capacityWarnings?.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'Capacity Management',
      recommendation: 'Prepare for capacity issues and implement crowd flow management',
      reasoning: `Capacity warnings: ${occupancyForecast.capacityWarnings.length} critical occupancy periods predicted`
    });
  }

  // Incident type recommendations
  incidentTypeRisks
    .filter(incident => incident.riskScore >= 60)
    .forEach(incident => {
      recommendations.push({
        priority: 'medium',
        category: 'Incident Prevention',
        recommendation: `Prepare for ${incident.incidentType} incidents`,
        reasoning: `High ${incident.incidentType} risk: ${incident.riskScore.toFixed(1)}% risk score`
      });
    });

  // General recommendations based on overall risk
  if (overallRisk.overallScore >= 60 && overallRisk.overallScore < 80) {
    recommendations.push({
      priority: 'medium',
      category: 'General Security',
      recommendation: 'Increase security presence and monitor high-risk areas',
      reasoning: `Elevated overall risk: ${overallRisk.overallScore}%`
    });
  }

  return recommendations.slice(0, 10); // Limit to top 10 recommendations
}

function calculateOverallConfidence(
  overallRisk: any,
  crowdFlow: any[],
  occupancyForecast: any
): number {
  const riskConfidence = overallRisk.confidence || 0.5;
  const crowdConfidence = crowdFlow.length > 0 
    ? crowdFlow.reduce((sum, pred) => sum + pred.confidence, 0) / crowdFlow.length 
    : 0.5;
  const forecastConfidence = occupancyForecast?.confidence || 0.5;

  return (riskConfidence + crowdConfidence + forecastConfidence) / 3;
}
