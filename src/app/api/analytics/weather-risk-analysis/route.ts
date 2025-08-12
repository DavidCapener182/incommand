import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PatternRecognitionEngine } from '../../../../lib/patternRecognition';
import { RiskScoringEngine } from '../../../../lib/riskScoring';

export interface WeatherRiskAnalysisResponse {
  weatherConditions: {
    current: string;
    forecast: string;
    change: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  weatherRelatedRisks: {
    riskType: string;
    probability: number;
    impact: string;
    recommendations: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
  historicalPatterns: {
    weatherCondition: string;
    incidentCount: number;
    incidentTypes: string[];
    averageRiskScore: number;
  }[];
  proactiveMeasures: {
    priority: 'high' | 'medium' | 'low';
    measure: string;
    reasoning: string;
    implementationTime: string;
  }[];
  riskScore: number;
  confidence: number;
  lastUpdated: string;
}

// Cache for storing weather risk analysis results
const weatherRiskCache = new Map<string, { data: WeatherRiskAnalysisResponse; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (weather changes more frequently)

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
      .select('id, organization_id, venue_address, event_date')
      .eq('id', eventId)
      .single();

    if (accessError || !eventAccess) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check cache first
    const cacheKey = `${eventId}-weather-${user.id}`;
    const cachedData = weatherRiskCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData.data);
    }

    // Initialize engines
    const patternEngine = new PatternRecognitionEngine(eventId);
    const riskEngine = new RiskScoringEngine(eventId);

    // Fetch weather data and analyze patterns
    const [
      weatherPatterns,
      historicalWeatherIncidents,
      currentWeatherConditions,
      weatherRiskFactors
    ] = await Promise.all([
      patternEngine.analyzeWeatherPatterns(),
      patternEngine.getHistoricalWeatherIncidents(),
      patternEngine.getCurrentWeatherConditions(),
      riskEngine.getWeatherRiskFactors()
    ]);

    // Analyze weather-related risks
    const weatherRelatedRisks = analyzeWeatherRisks(
      currentWeatherConditions,
      weatherPatterns,
      historicalWeatherIncidents
    );

    // Generate proactive measures
    const proactiveMeasures = generateWeatherProactiveMeasures(
      weatherRelatedRisks,
      currentWeatherConditions,
      eventAccess.event_date
    );

    // Calculate overall weather risk score
    const riskScore = calculateWeatherRiskScore(weatherRelatedRisks, weatherPatterns);

    // Build response
    const response: WeatherRiskAnalysisResponse = {
      weatherConditions: {
        current: currentWeatherConditions.current || 'Unknown',
        forecast: currentWeatherConditions.forecast || 'Unknown',
        change: currentWeatherConditions.change || 'No significant change',
        severity: determineWeatherSeverity(currentWeatherConditions, weatherRelatedRisks)
      },
      weatherRelatedRisks,
      historicalPatterns: historicalWeatherIncidents.map(pattern => ({
        weatherCondition: pattern.weatherCondition,
        incidentCount: pattern.incidentCount,
        incidentTypes: pattern.incidentTypes,
        averageRiskScore: pattern.averageRiskScore
      })),
      proactiveMeasures,
      riskScore,
      confidence: calculateWeatherConfidence(weatherPatterns, historicalWeatherIncidents),
      lastUpdated: new Date().toISOString()
    };

    // Cache the response
    weatherRiskCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating weather risk analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate weather risk analysis' },
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
    const { eventId, forceRefresh = false, customWeatherConditions } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Clear cache if force refresh is requested
    if (forceRefresh) {
      const cacheKey = `${eventId}-weather-${user.id}`;
      weatherRiskCache.delete(cacheKey);
    }

    // If custom weather conditions are provided, use them for analysis
    if (customWeatherConditions) {
      console.log('Custom weather conditions provided:', customWeatherConditions);
      // This would allow for scenario planning with different weather conditions
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
    console.error('Error in POST weather risk analysis:', error);
    return NextResponse.json(
      { error: 'Failed to process weather risk analysis request' },
      { status: 500 }
    );
  }
}

// Helper functions
function analyzeWeatherRisks(
  currentWeather: any,
  weatherPatterns: any[],
  historicalIncidents: any[]
): { riskType: string; probability: number; impact: string; recommendations: string[]; severity: 'low' | 'medium' | 'high' | 'critical' }[] {
  const risks = [];

  // Rain-related risks
  if (currentWeather.current?.toLowerCase().includes('rain') || 
      currentWeather.forecast?.toLowerCase().includes('rain')) {
    const rainIncidents = historicalIncidents.filter(incident => 
      incident.weatherCondition.toLowerCase().includes('rain')
    );
    
    const probability = rainIncidents.length > 0 ? 
      Math.min(rainIncidents.length / historicalIncidents.length * 100, 85) : 30;

    risks.push({
      riskType: 'Slippery Surfaces',
      probability,
      impact: 'Increased risk of slips, falls, and medical incidents',
      recommendations: [
        'Deploy additional medical staff',
        'Place warning signs for wet surfaces',
        'Increase lighting in affected areas',
        'Provide shelter or covered areas'
      ],
      severity: (probability > 60 ? 'high' : probability > 30 ? 'medium' : 'low') as 'low' | 'medium' | 'high' | 'critical'
    });
  }

  // Wind-related risks
  if (currentWeather.current?.toLowerCase().includes('wind') || 
      currentWeather.forecast?.toLowerCase().includes('wind')) {
    const windIncidents = historicalIncidents.filter(incident => 
      incident.weatherCondition.toLowerCase().includes('wind')
    );
    
    const probability = windIncidents.length > 0 ? 
      Math.min(windIncidents.length / historicalIncidents.length * 100, 75) : 25;

    risks.push({
      riskType: 'Structural Safety',
      probability,
      impact: 'Risk of falling objects, structural damage, and evacuation needs',
      recommendations: [
        'Inspect temporary structures and equipment',
        'Secure loose objects and signage',
        'Prepare evacuation procedures',
        'Monitor wind speeds continuously'
      ],
      severity: (probability > 50 ? 'high' : probability > 25 ? 'medium' : 'low') as 'low' | 'medium' | 'high' | 'critical'
    });
  }

  // Heat-related risks
  if (currentWeather.current?.toLowerCase().includes('hot') || 
      currentWeather.forecast?.toLowerCase().includes('hot')) {
    const heatIncidents = historicalIncidents.filter(incident => 
      incident.weatherCondition.toLowerCase().includes('hot')
    );
    
    const probability = heatIncidents.length > 0 ? 
      Math.min(heatIncidents.length / historicalIncidents.length * 100, 90) : 40;

    risks.push({
      riskType: 'Heat Stress',
      probability,
      impact: 'Increased risk of heat exhaustion, dehydration, and medical emergencies',
      recommendations: [
        'Increase medical staff deployment',
        'Provide free water stations',
        'Create shaded rest areas',
        'Monitor vulnerable attendees'
      ],
      severity: (probability > 70 ? 'critical' : probability > 40 ? 'high' : 'medium') as 'low' | 'medium' | 'high' | 'critical'
    });
  }

  // Cold-related risks
  if (currentWeather.current?.toLowerCase().includes('cold') || 
      currentWeather.forecast?.toLowerCase().includes('cold')) {
    const coldIncidents = historicalIncidents.filter(incident => 
      incident.weatherCondition.toLowerCase().includes('cold')
    );
    
    const probability = coldIncidents.length > 0 ? 
      Math.min(coldIncidents.length / historicalIncidents.length * 100, 80) : 35;

    risks.push({
      riskType: 'Cold Stress',
      probability,
      impact: 'Risk of hypothermia, reduced mobility, and medical incidents',
      recommendations: [
        'Provide warm shelter areas',
        'Offer hot beverages',
        'Increase medical monitoring',
        'Ensure proper heating in indoor areas'
      ],
      severity: (probability > 60 ? 'high' : probability > 35 ? 'medium' : 'low') as 'low' | 'medium' | 'high' | 'critical'
    });
  }

  return risks;
}

function generateWeatherProactiveMeasures(
  weatherRisks: any[],
  currentWeather: any,
  eventDate: string
): { priority: 'high' | 'medium' | 'low'; measure: string; reasoning: string; implementationTime: string }[] {
  const measures = [];

  // High priority measures for critical weather risks
  weatherRisks
    .filter(risk => risk.severity === 'critical')
    .forEach(risk => {
      measures.push({
        priority: 'high',
        measure: risk.recommendations[0] || 'Implement emergency weather protocols',
        reasoning: `Critical ${risk.riskType} risk with ${risk.probability.toFixed(0)}% probability`,
        implementationTime: 'Immediate'
      });
    });

  // Medium priority measures for high weather risks
  weatherRisks
    .filter(risk => risk.severity === 'high')
    .forEach(risk => {
      measures.push({
        priority: 'medium',
        measure: risk.recommendations[0] || 'Prepare for weather-related incidents',
        reasoning: `High ${risk.riskType} risk with ${risk.probability.toFixed(0)}% probability`,
        implementationTime: 'Within 1 hour'
      });
    });

  // General weather preparedness
  if (weatherRisks.length > 0) {
    measures.push({
      priority: 'medium',
      measure: 'Review and update emergency weather procedures',
      reasoning: `${weatherRisks.length} weather-related risks identified`,
      implementationTime: 'Within 2 hours'
    });
  }

  return measures;
}

function calculateWeatherRiskScore(weatherRisks: any[], weatherPatterns: any[]): number {
  if (weatherRisks.length === 0) return 0;

  const riskScores = weatherRisks.map(risk => {
    const severityMultiplier = risk.severity === 'critical' ? 1.0 :
                              risk.severity === 'high' ? 0.8 :
                              risk.severity === 'medium' ? 0.5 : 0.2;
    
    return risk.probability * severityMultiplier;
  });

  const averageRiskScore = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
  
  // Adjust based on weather patterns
  const patternMultiplier = weatherPatterns.length > 0 ? 
    Math.min(weatherPatterns.reduce((sum, pattern) => sum + pattern.riskScore, 0) / weatherPatterns.length / 100, 1.5) : 1.0;

  return Math.min(averageRiskScore * patternMultiplier, 100);
}

function determineWeatherSeverity(currentWeather: any, weatherRisks: any[]): 'low' | 'medium' | 'high' | 'critical' {
  const criticalRisks = weatherRisks.filter(risk => risk.severity === 'critical').length;
  const highRisks = weatherRisks.filter(risk => risk.severity === 'high').length;

  if (criticalRisks > 0) return 'critical';
  if (highRisks > 1) return 'high';
  if (highRisks > 0 || weatherRisks.length > 2) return 'medium';
  return 'low';
}

function calculateWeatherConfidence(weatherPatterns: any[], historicalIncidents: any[]): number {
  const patternConfidence = weatherPatterns.length > 0 ? 
    Math.min(weatherPatterns.length / 10, 1.0) : 0.3;
  
  const historicalConfidence = historicalIncidents.length > 0 ? 
    Math.min(historicalIncidents.length / 20, 1.0) : 0.2;

  return (patternConfidence + historicalConfidence) / 2;
}
