import { supabase } from './supabase';
import { logger } from './logger';

export interface IncidentPattern {
  id: string;
  patternType: 'temporal' | 'spatial' | 'behavioral' | 'correlation' | 'seasonal' | 'anomaly';
  confidence: number;
  description: string;
  factors: PatternFactor[];
  impact: 'positive' | 'negative' | 'neutral';
  recommendations: string[];
  detectedAt: Date;
  lastUpdated: Date;
}

export interface PatternFactor {
  type: 'time' | 'location' | 'weather' | 'crowd' | 'staff' | 'event_type' | 'correlation';
  value: string | number;
  weight: number;
  correlation: number;
}

export interface TemporalPattern {
  timeSlot: string;
  frequency: number;
  incidentTypes: string[];
  averageSeverity: number;
  confidence: number;
}

export interface SpatialPattern {
  location: string;
  incidentCount: number;
  incidentTypes: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  densityCorrelation: number;
}

export interface BehavioralPattern {
  trigger: string;
  response: string;
  frequency: number;
  effectiveness: number;
  confidence: number;
}

export interface CorrelationPattern {
  factor1: string;
  factor2: string;
  correlationStrength: number;
  significance: number;
  description: string;
}

export interface WeatherPattern {
  pattern: string;
  frequency: number;
  riskScore: number;
}

export interface HistoricalWeatherIncident {
  weatherCondition: string;
  incidentCount: number;
  incidentTypes: string[];
  averageRiskScore: number;
}

export interface CurrentWeatherConditions {
  current: string;
  forecast: string;
  change: string;
}

export class PatternRecognitionEngine {
  private eventId: string;
  private patterns: IncidentPattern[] = [];
  private temporalPatterns: TemporalPattern[] = [];
  private spatialPatterns: SpatialPattern[] = [];
  private behavioralPatterns: BehavioralPattern[] = [];
  private correlationPatterns: CorrelationPattern[] = [];

  constructor(eventId: string) {
    this.eventId = eventId;
  }

  async analyzeWeatherPatterns(): Promise<WeatherPattern[]> {
    try {
      const incidents = await this.getHistoricalWeatherIncidents();

      return incidents.map(incident => ({
        pattern: incident.weatherCondition,
        frequency: incident.incidentCount,
        riskScore: incident.averageRiskScore
      }));
    } catch (error) {
      logger.error('Error analyzing weather patterns', { error, eventId: this.eventId });
      return [];
    }
  }

  async getHistoricalWeatherIncidents(): Promise<HistoricalWeatherIncident[]> {
    try {
      const { data, error } = await supabase
        .from('incident_logs')
        .select('incident_type, weather_condition, risk_score')
        .eq('event_id', this.eventId);

      if (error || !data) return [];

      const grouped: Record<string, any[]> = {};

      (data as any[]).forEach(incident => {
        const condition = incident.weather_condition || 'Unknown';
        if (!grouped[condition]) {
          grouped[condition] = [];
        }
        grouped[condition].push(incident);
      });

      return Object.entries(grouped).map(([condition, incidents]) => ({
        weatherCondition: condition,
        incidentCount: incidents.length,
        incidentTypes: [...new Set(incidents.map(i => i.incident_type))],
        averageRiskScore:
          incidents.reduce((sum, i) => sum + (i.risk_score ?? 0), 0) / incidents.length
      }));
    } catch (error) {
      logger.error('Error fetching historical weather incidents', { error, eventId: this.eventId });
      return [];
    }
  }

  async getCurrentWeatherConditions(): Promise<CurrentWeatherConditions> {
    try {
      return {
        current: 'Unknown',
        forecast: 'Unknown',
        change: 'No significant change'
      };
    } catch (error) {
      logger.error('Error fetching current weather conditions', { error, eventId: this.eventId });
      return {
        current: 'Unknown',
        forecast: 'Unknown',
        change: 'No significant change'
      };
    }
  }

  async analyzeIncidentPatterns(): Promise<IncidentPattern[]> {
    try {
      logger.info('Starting incident pattern analysis', { eventId: this.eventId });

      // Fetch incident data
      const { data: incidents, error } = await supabase
        .from('incident_logs')
        .select('*')
        .eq('event_id', this.eventId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      if (!incidents || incidents.length === 0) {
        logger.info('No incidents found for pattern analysis', { eventId: this.eventId });
      return [];
      }

      // Analyze different pattern types
      const temporalPatterns = await this.analyzeTemporalPatterns(incidents);
      const spatialPatterns = await this.analyzeSpatialPatterns(incidents);
      const behavioralPatterns = await this.analyzeBehavioralPatterns(incidents);
      const correlationPatterns = await this.analyzeCorrelationPatterns(incidents);

      // Combine patterns into comprehensive analysis
      const patterns = await this.synthesizePatterns(
        temporalPatterns,
        spatialPatterns,
        behavioralPatterns,
        correlationPatterns
      );

      // Store patterns in database
      await this.storePatterns(patterns);

      this.patterns = patterns;
      return patterns;

    } catch (error) {
      logger.error('Error analyzing incident patterns', { error, eventId: this.eventId });
      throw error;
    }
  }

  private async analyzeTemporalPatterns(incidents: any[]): Promise<TemporalPattern[]> {
    const patterns: TemporalPattern[] = [];
    const timeSlots: { [key: string]: any[] } = {};

    // Group incidents by hour
    incidents.forEach(incident => {
      const hour = new Date(incident.timestamp).getHours();
      const timeSlot = `${hour}:00-${hour + 1}:00`;
      
      if (!timeSlots[timeSlot]) {
        timeSlots[timeSlot] = [];
      }
      timeSlots[timeSlot].push(incident);
    });

    // Analyze each time slot
    Object.entries(timeSlots).forEach(([timeSlot, slotIncidents]) => {
      const incidentTypes = [...new Set(slotIncidents.map(i => i.incident_type))];
      const averageSeverity = this.calculateAverageSeverity(slotIncidents);
      const frequency = slotIncidents.length;
      const confidence = this.calculateConfidence(frequency, incidents.length);

      patterns.push({
        timeSlot,
        frequency,
        incidentTypes,
        averageSeverity,
        confidence
      });
    });

    this.temporalPatterns = patterns;
    return patterns;
  }

  private async analyzeSpatialPatterns(incidents: any[]): Promise<SpatialPattern[]> {
    const patterns: SpatialPattern[] = [];
    const locations: { [key: string]: any[] } = {};

    // Group incidents by location
    incidents.forEach(incident => {
      const location = incident.location || 'Unknown';
      
      if (!locations[location]) {
        locations[location] = [];
      }
      locations[location].push(incident);
    });

    // Analyze each location
    Object.entries(locations).forEach(([location, locationIncidents]) => {
      const incidentCount = locationIncidents.length;
      const incidentTypes = [...new Set(locationIncidents.map(i => i.incident_type))];
      const riskLevel = this.calculateRiskLevel(incidentCount, locationIncidents);
      const densityCorrelation = this.calculateDensityCorrelation(location, locationIncidents);

      patterns.push({
        location,
        incidentCount,
        incidentTypes,
        riskLevel,
        densityCorrelation
      });
    });

    this.spatialPatterns = patterns;
    return patterns;
  }

  private async analyzeBehavioralPatterns(incidents: any[]): Promise<BehavioralPattern[]> {
    const patterns: BehavioralPattern[] = [];

    // Analyze response patterns
    const responsePatterns = this.analyzeResponsePatterns(incidents);
    patterns.push(...responsePatterns);

    // Analyze escalation patterns
    const escalationPatterns = this.analyzeEscalationPatterns(incidents);
    patterns.push(...escalationPatterns);

    this.behavioralPatterns = patterns;
    return patterns;
  }

  private async analyzeCorrelationPatterns(incidents: any[]): Promise<CorrelationPattern[]> {
    const patterns: CorrelationPattern[] = [];

    // Weather correlation
    const weatherCorrelation = await this.analyzeWeatherCorrelation(incidents);
    if (weatherCorrelation) patterns.push(weatherCorrelation);

    // Crowd density correlation
    const crowdCorrelation = await this.analyzeCrowdDensityCorrelation(incidents);
    if (crowdCorrelation) patterns.push(crowdCorrelation);

    // Time-weather correlation
    const timeWeatherCorrelation = await this.analyzeTimeWeatherCorrelation(incidents);
    if (timeWeatherCorrelation) patterns.push(timeWeatherCorrelation);

    this.correlationPatterns = patterns;
    return patterns;
  }

  private async synthesizePatterns(
    temporal: TemporalPattern[],
    spatial: SpatialPattern[],
    behavioral: BehavioralPattern[],
    correlations: CorrelationPattern[]
  ): Promise<IncidentPattern[]> {
    const patterns: IncidentPattern[] = [];

    // Synthesize temporal patterns
    const highFrequencyTemporal = temporal.filter(p => p.frequency > 2 && p.confidence > 0.7);
    highFrequencyTemporal.forEach(pattern => {
      patterns.push({
        id: `temporal-${Date.now()}-${Math.random()}`,
        patternType: 'temporal',
        confidence: pattern.confidence,
        description: `High incident frequency during ${pattern.timeSlot} with ${pattern.incidentTypes.join(', ')} incidents`,
        factors: [
          {
            type: 'time',
            value: pattern.timeSlot,
            weight: pattern.frequency / Math.max(...temporal.map(p => p.frequency)),
            correlation: pattern.confidence
          }
        ],
        impact: 'negative',
        recommendations: [
          'Increase security presence during peak hours',
          'Deploy additional medical staff',
          'Implement stricter monitoring during identified time slots'
        ],
        detectedAt: new Date(),
        lastUpdated: new Date()
      });
    });

    // Synthesize spatial patterns
    const highRiskSpatial = spatial.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical');
    highRiskSpatial.forEach(pattern => {
      patterns.push({
        id: `spatial-${Date.now()}-${Math.random()}`,
        patternType: 'spatial',
        confidence: pattern.densityCorrelation,
        description: `High incident concentration in ${pattern.location} with ${pattern.incidentCount} incidents`,
        factors: [
          {
            type: 'location',
            value: pattern.location,
            weight: pattern.incidentCount / Math.max(...spatial.map(p => p.incidentCount)),
            correlation: pattern.densityCorrelation
          }
        ],
        impact: 'negative',
        recommendations: [
          'Implement crowd flow management in identified areas',
          'Add additional exits and emergency routes',
          'Deploy crowd control barriers and signage'
        ],
        detectedAt: new Date(),
        lastUpdated: new Date()
      });
    });

    // Synthesize correlation patterns
    correlations.forEach(correlation => {
      patterns.push({
        id: `correlation-${Date.now()}-${Math.random()}`,
        patternType: 'correlation',
        confidence: correlation.significance,
        description: correlation.description,
        factors: [
          {
            type: 'correlation',
            value: `${correlation.factor1} vs ${correlation.factor2}`,
            weight: correlation.correlationStrength,
            correlation: correlation.significance
          }
        ],
        impact: correlation.correlationStrength > 0.7 ? 'negative' : 'neutral',
        recommendations: [
          'Monitor correlated factors more closely',
          'Implement preventive measures based on correlation',
          'Adjust resource allocation based on pattern'
        ],
        detectedAt: new Date(),
        lastUpdated: new Date()
      });
    });

    return patterns;
  }

  private calculateAverageSeverity(incidents: any[]): number {
    if (incidents.length === 0) return 0;
    
    const severityScores = incidents.map(incident => {
      switch (incident.priority?.toLowerCase()) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 1;
      }
    });

    return severityScores.reduce((sum, score) => sum + score, 0) / severityScores.length;
  }

  private calculateConfidence(frequency: number, totalIncidents: number): number {
    if (totalIncidents === 0) return 0;
    
    const proportion = frequency / totalIncidents;
    const baseConfidence = Math.min(proportion * 100, 100);
    
    // Adjust confidence based on sample size
    const sampleSizeAdjustment = Math.min(frequency / 10, 1);
    
    return Math.round(baseConfidence * sampleSizeAdjustment);
  }

  private calculateRiskLevel(incidentCount: number, incidents: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const severity = this.calculateAverageSeverity(incidents);
    const riskScore = incidentCount * severity;

    if (riskScore >= 15) return 'critical';
    if (riskScore >= 10) return 'high';
    if (riskScore >= 5) return 'medium';
    return 'low';
  }

  private calculateDensityCorrelation(location: string, incidents: any[]): number {
    // Simulate density correlation calculation
    // In a real implementation, this would use actual crowd density data
    const baseCorrelation = 0.6;
    const incidentCount = incidents.length;
    const adjustment = Math.min(incidentCount / 10, 0.4);
    
    return Math.min(baseCorrelation + adjustment, 1);
  }

  private analyzeResponsePatterns(incidents: any[]): BehavioralPattern[] {
    const patterns: BehavioralPattern[] = [];

    // Analyze response time patterns
    const responseTimes = incidents
      .filter(i => i.created_at && i.updated_at)
      .map(i => ({
        incident: i,
        responseTime: new Date(i.updated_at).getTime() - new Date(i.created_at).getTime()
      }));

    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((sum, rt) => sum + rt.responseTime, 0) / responseTimes.length;
      
      patterns.push({
        trigger: 'Incident reported',
        response: 'Response time',
        frequency: responseTimes.length,
        effectiveness: avgResponseTime < 300000 ? 0.8 : 0.4, // 5 minutes threshold
        confidence: 0.7
      });
    }

    return patterns;
  }

  private analyzeEscalationPatterns(incidents: any[]): BehavioralPattern[] {
    const patterns: BehavioralPattern[] = [];

    // Analyze escalation patterns
    const escalatedIncidents = incidents.filter(i => i.status === 'Escalated' || i.priority === 'high');
    
    if (escalatedIncidents.length > 0) {
      patterns.push({
        trigger: 'High priority incident',
        response: 'Escalation',
        frequency: escalatedIncidents.length,
        effectiveness: 0.9,
        confidence: 0.8
      });
    }

    return patterns;
  }

  private async analyzeWeatherCorrelation(incidents: any[]): Promise<CorrelationPattern | null> {
    // Simulate weather correlation analysis
    // In a real implementation, this would fetch weather data and correlate with incidents
    
    const weatherSensitiveIncidents = incidents.filter(i => 
      ['Medical', 'Slip/Fall', 'Weather'].includes(i.incident_type)
    );

    if (weatherSensitiveIncidents.length > 0) {
      return {
        factor1: 'Weather conditions',
        factor2: 'Medical incidents',
        correlationStrength: 0.75,
        significance: 0.8,
        description: 'Strong correlation between weather conditions and medical incidents'
      };
    }

    return null;
  }

  private async analyzeCrowdDensityCorrelation(incidents: any[]): Promise<CorrelationPattern | null> {
    // Simulate crowd density correlation analysis
    
    const crowdRelatedIncidents = incidents.filter(i => 
      ['Crowd Control', 'Medical', 'Security'].includes(i.incident_type)
    );

    if (crowdRelatedIncidents.length > 0) {
      return {
        factor1: 'Crowd density',
        factor2: 'Incident frequency',
        correlationStrength: 0.85,
        significance: 0.9,
        description: 'High correlation between crowd density and incident frequency'
      };
    }

    return null;
  }

  private async analyzeTimeWeatherCorrelation(incidents: any[]): Promise<CorrelationPattern | null> {
    // Simulate time-weather correlation analysis
    
    const eveningIncidents = incidents.filter(i => {
      const hour = new Date(i.timestamp).getHours();
      return hour >= 18 && hour <= 23;
    });

    if (eveningIncidents.length > incidents.length * 0.6) {
      return {
        factor1: 'Evening hours',
        factor2: 'Incident frequency',
        correlationStrength: 0.7,
        significance: 0.75,
        description: 'Higher incident frequency during evening hours'
      };
    }

    return null;
  }

  private async storePatterns(patterns: IncidentPattern[]): Promise<void> {
    try {
      const patternData = patterns.map(pattern => ({
        event_id: this.eventId,
        pattern_type: pattern.patternType,
        confidence: pattern.confidence,
        description: pattern.description,
        factors: pattern.factors,
        impact: pattern.impact,
        recommendations: pattern.recommendations,
        detected_at: pattern.detectedAt.toISOString(),
        last_updated: pattern.lastUpdated.toISOString()
      }));

      const { error } = await supabase
        .from('incident_patterns')
        .upsert(patternData, { onConflict: 'event_id,pattern_type' });

      if (error) throw error;

      logger.info('Stored incident patterns', { 
        eventId: this.eventId, 
        patternCount: patterns.length 
      });

    } catch (error) {
      logger.error('Error storing incident patterns', { error, eventId: this.eventId });
      throw error;
    }
  }

  async getPatterns(): Promise<IncidentPattern[]> {
    return this.patterns;
  }

  async getTemporalPatterns(): Promise<TemporalPattern[]> {
    return this.temporalPatterns;
  }

  async getSpatialPatterns(): Promise<SpatialPattern[]> {
    return this.spatialPatterns;
  }

  async getBehavioralPatterns(): Promise<BehavioralPattern[]> {
    return this.behavioralPatterns;
  }

  async getCorrelationPatterns(): Promise<CorrelationPattern[]> {
    return this.correlationPatterns;
  }

  async getHighConfidencePatterns(threshold: number = 0.7): Promise<IncidentPattern[]> {
    return this.patterns.filter(pattern => pattern.confidence >= threshold);
  }

  async getPatternsByType(type: IncidentPattern['patternType']): Promise<IncidentPattern[]> {
    return this.patterns.filter(pattern => pattern.patternType === type);
  }

  async updatePatternConfidence(patternId: string, newConfidence: number): Promise<void> {
    const pattern = this.patterns.find(p => p.id === patternId);
    if (pattern) {
      pattern.confidence = newConfidence;
      pattern.lastUpdated = new Date();
      
      // Update in database
      await this.storePatterns(this.patterns);
    }
  }

  async addPatternFeedback(patternId: string, feedback: 'accurate' | 'inaccurate' | 'partially_accurate'): Promise<void> {
    // In a real implementation, this would update pattern confidence based on feedback
    const pattern = this.patterns.find(p => p.id === patternId);
    if (pattern) {
      let confidenceAdjustment = 0;
      
      switch (feedback) {
        case 'accurate':
          confidenceAdjustment = 0.1;
          break;
        case 'inaccurate':
          confidenceAdjustment = -0.2;
          break;
        case 'partially_accurate':
          confidenceAdjustment = 0.05;
          break;
      }

      pattern.confidence = Math.max(0, Math.min(1, pattern.confidence + confidenceAdjustment));
      pattern.lastUpdated = new Date();
      
      await this.storePatterns(this.patterns);
    }
  }

  async analyzeCrowdFlowPatterns(): Promise<IncidentPattern[]> {
    // For now, reuse existing incident pattern analysis
    return this.analyzeIncidentPatterns();
  }

  async getHistoricalCrowdFlow(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('event_id', this.eventId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching historical crowd flow', { error, eventId: this.eventId });
      return [];
    }
  }
}
