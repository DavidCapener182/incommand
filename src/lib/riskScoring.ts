import { supabase } from './supabase';
import { PatternRecognitionEngine, IncidentPattern, RiskFactor } from './patternRecognition';
import { getWeatherData } from '../services/weatherService';

export interface RiskScore {
  overallScore: number;
  weatherScore: number;
  crowdScore: number;
  timeScore: number;
  locationScore: number;
  eventPhaseScore: number;
  contributingFactors: RiskFactor[];
  validUntil: Date;
  confidence: number;
}

export interface LocationRiskScore {
  location: string;
  riskScore: number;
  incidentTypes: string[];
  contributingFactors: string[];
  lastIncident?: Date;
}

export interface IncidentTypeRisk {
  incidentType: string;
  riskScore: number;
  probability: number;
  contributingFactors: string[];
}

export interface RiskWeights {
  weather: number;
  crowd: number;
  time: number;
  location: number;
  eventPhase: number;
}

export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  weather: 0.25,
  crowd: 0.30,
  time: 0.20,
  location: 0.15,
  eventPhase: 0.10
};

export class RiskScoringEngine {
  private eventId: string;
  private patternEngine: PatternRecognitionEngine;
  private customWeights: RiskWeights | null;

  constructor(eventId: string, customWeights?: RiskWeights) {
    this.eventId = eventId;
    this.patternEngine = new PatternRecognitionEngine(eventId);
    this.customWeights = customWeights || null;
  }

  async calculateOverallRiskScore(): Promise<RiskScore> {
    try {
      // Get current conditions
      const currentTime = new Date();
      const patterns = await this.patternEngine.analyzeIncidentPatterns();
      const riskFactors = await this.patternEngine.identifyRiskFactors();
      
      // Calculate individual risk scores
      const weatherScore = await this.getWeatherRiskScore();
      const crowdScore = await this.getCrowdDensityRiskScore();
      const timeScore = this.getTimeBasedRiskScore(currentTime, patterns);
      const locationScore = await this.getLocationRiskScore();
      const eventPhaseScore = await this.getEventPhaseRiskScore(currentTime);

      // Get weights (custom or default)
      const weights = await this.getRiskWeights();

      const overallScore = (
        weatherScore * weights.weather +
        crowdScore * weights.crowd +
        timeScore * weights.time +
        locationScore * weights.location +
        eventPhaseScore * weights.eventPhase
      );

      // Calculate confidence based on data availability
      const confidence = this.calculateConfidence(patterns, riskFactors);

      const riskScore: RiskScore = {
        overallScore: Math.min(overallScore * 100, 100), // Convert to 0-100 scale
        weatherScore: weatherScore * 100,
        crowdScore: crowdScore * 100,
        timeScore: timeScore * 100,
        locationScore: locationScore * 100,
        eventPhaseScore: eventPhaseScore * 100,
        contributingFactors: riskFactors.slice(0, 5), // Top 5 factors
        validUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        confidence
      };

      // Store the risk score
      await this.storeRiskScore(riskScore);

      return riskScore;
    } catch (error) {
      console.error('Error calculating overall risk score:', error);
      return this.getDefaultRiskScore();
    }
  }

  async getWeatherRiskScore(): Promise<number> {
    try {
      const weatherData = await getWeatherData(51.5074, -0.1278); // Default to London coordinates
      if (!weatherData) {
        return 0;
      }

      const currentWeather = weatherData;
      let weatherScore = 0;

      // Temperature risk
      if (currentWeather.temperature > 30) {
        weatherScore += 0.4; // High temperature increases medical incidents
      } else if (currentWeather.temperature < 5) {
        weatherScore += 0.3; // Low temperature affects crowd behavior
      }

      // Precipitation risk
      if (currentWeather.rain && currentWeather.rain > 0) {
        weatherScore += 0.5; // Rain increases slip/fall incidents
      }

      // Wind risk
      if (currentWeather.windSpeed > 20) {
        weatherScore += 0.3; // High winds increase technical issues
      }

      // Humidity risk
      if (currentWeather.humidity > 80) {
        weatherScore += 0.2; // High humidity affects comfort
      }

      // Apply historical correlations
      const weatherCorrelations = await this.patternEngine.analyzeWeatherCorrelations();
      const matchingCorrelation = weatherCorrelations.find(c => 
        c.weatherCondition === currentWeather.description?.toLowerCase()
      );

      if (matchingCorrelation) {
        weatherScore *= matchingCorrelation.confidence;
      }

      return Math.min(weatherScore, 1);
    } catch (error) {
      console.error('Error calculating weather risk score:', error);
      return 0.3;
    }
  }

  async getCrowdDensityRiskScore(): Promise<number> {
    try {
      // Get current crowd density
      const { data: currentEvent } = await supabase
        .from('events')
        .select('current_attendance, max_capacity')
        .eq('id', this.eventId)
        .single();

      if (!currentEvent) return 0.3;

      const currentDensity = (currentEvent.current_attendance || 0) / (currentEvent.max_capacity || 1);
      const patterns = await this.patternEngine.analyzeIncidentPatterns();

      // Use pattern recognition to analyze crowd density risk
      return this.patternEngine.crowdDensityRiskAnalysis(currentDensity * 100, patterns);
    } catch (error) {
      console.error('Error calculating crowd density risk score:', error);
      return 0.3;
    }
  }

  getTimeBasedRiskScore(currentTime: Date, patterns: IncidentPattern[]): number {
    return this.patternEngine.calculateTimeBasedRisk(currentTime, patterns);
  }

  async getLocationRiskScore(): Promise<number> {
    try {
      const hotspots = await this.patternEngine.detectLocationHotspots();
      
      if (hotspots.length === 0) return 0.3;

      // Calculate average risk score across all locations
      const totalRisk = hotspots.reduce((sum, hotspot) => sum + hotspot.riskScore, 0);
      const avgRisk = totalRisk / hotspots.length;

      return Math.min(avgRisk / 100, 1);
    } catch (error) {
      console.error('Error calculating location risk score:', error);
      return 0.3;
    }
  }

  async getEventPhaseRiskScore(currentTime: Date): Promise<number> {
    try {
      const { data: event } = await supabase
        .from('events')
        .select('start_time, end_time, doors_open_time')
        .eq('id', this.eventId)
        .single();

      if (!event) return 0.3;

      const startTime = new Date(event.start_time);
      const endTime = new Date(event.end_time);
      const doorsOpenTime = event.doors_open_time ? new Date(event.doors_open_time) : null;

      // Determine event phase
      const phase = this.getEventPhase(currentTime, startTime, endTime, doorsOpenTime);
      
      // Risk scores for different phases
      const phaseRisks = {
        'pre-event': 0.2,
        'doors-open': 0.4,
        'main-event': 0.6,
        'peak': 0.8,
        'winding-down': 0.5,
        'post-event': 0.3
      };

      return phaseRisks[phase as keyof typeof phaseRisks] || 0.3;
    } catch (error) {
      console.error('Error calculating event phase risk score:', error);
      return 0.3;
    }
  }

  async getLocationSpecificRiskScores(): Promise<LocationRiskScore[]> {
    try {
      const hotspots = await this.patternEngine.detectLocationHotspots();
      
      return hotspots.map(hotspot => ({
        location: hotspot.location,
        riskScore: hotspot.riskScore,
        incidentTypes: hotspot.incidentTypes,
        contributingFactors: this.getContributingFactors(hotspot),
        lastIncident: hotspot.lastIncident
      }));
    } catch (error) {
      console.error('Error getting location-specific risk scores:', error);
      return [];
    }
  }

  async getIncidentTypeRiskScores(): Promise<IncidentTypeRisk[]> {
    try {
      const patterns = await this.patternEngine.analyzeIncidentPatterns();
      const riskFactors = await this.patternEngine.identifyRiskFactors();
      
      // Get all incident types from patterns
      const allIncidentTypes = Array.from(new Set(patterns.flatMap(p => p.incidentTypes)));
      
      const incidentTypeRisks: IncidentTypeRisk[] = [];

      for (const incidentType of allIncidentTypes) {
        const typePatterns = patterns.filter(p => p.incidentTypes.includes(incidentType));
        const riskScore = this.calculateIncidentTypeRisk(incidentType, typePatterns, riskFactors);
        const probability = this.calculateIncidentProbability(incidentType, typePatterns);
        const contributingFactors = this.getIncidentTypeContributingFactors(incidentType, riskFactors);

        incidentTypeRisks.push({
          incidentType,
          riskScore,
          probability,
          contributingFactors
        });
      }

      return incidentTypeRisks.sort((a, b) => b.riskScore - a.riskScore);
    } catch (error) {
      console.error('Error getting incident type risk scores:', error);
      return [];
    }
  }

  async updateRiskScores(): Promise<void> {
    try {
      // Clear expired risk scores
      await this.clearExpiredRiskScores();

      // Calculate new risk scores
      const overallRisk = await this.calculateOverallRiskScore();
      const locationRisks = await this.getLocationSpecificRiskScores();
      const incidentTypeRisks = await this.getIncidentTypeRiskScores();

      // Store all risk scores
      await this.storeRiskScores(overallRisk, locationRisks, incidentTypeRisks);
    } catch (error) {
      console.error('Error updating risk scores:', error);
    }
  }

  private async storeRiskScore(riskScore: RiskScore): Promise<void> {
    try {
      const { error } = await supabase
        .from('risk_scores')
        .insert({
          event_id: this.eventId,
          risk_score: riskScore.overallScore,
          contributing_factors: riskScore.contributingFactors,
          valid_until: riskScore.validUntil.toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing risk score:', error);
    }
  }

  private async storeRiskScores(
    overallRisk: RiskScore,
    locationRisks: LocationRiskScore[],
    incidentTypeRisks: IncidentTypeRisk[]
  ): Promise<void> {
    try {
      const riskScoreData = [
        // Overall risk score
        {
          event_id: this.eventId,
          risk_score: overallRisk.overallScore,
          contributing_factors: overallRisk.contributingFactors,
          valid_until: overallRisk.validUntil.toISOString()
        },
        // Location-specific risk scores
        ...locationRisks.map(location => ({
          event_id: this.eventId,
          location: location.location,
          risk_score: location.riskScore,
          contributing_factors: {
            incidentTypes: location.incidentTypes,
            factors: location.contributingFactors
          },
          valid_until: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        })),
        // Incident type risk scores
        ...incidentTypeRisks.map(incident => ({
          event_id: this.eventId,
          incident_type: incident.incidentType,
          risk_score: incident.riskScore * 100,
          contributing_factors: {
            probability: incident.probability,
            factors: incident.contributingFactors
          },
          valid_until: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        }))
      ];

      const { error } = await supabase
        .from('risk_scores')
        .insert(riskScoreData);

      if (error) throw error;
    } catch (error) {
      console.error('Error storing risk scores:', error);
    }
  }

  private async clearExpiredRiskScores(): Promise<void> {
    try {
      const { error } = await supabase
        .from('risk_scores')
        .delete()
        .lt('valid_until', new Date().toISOString());

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing expired risk scores:', error);
    }
  }

  private getEventPhase(
    currentTime: Date,
    startTime: Date,
    endTime: Date,
    doorsOpenTime: Date | null
  ): string {
    const timeDiff = currentTime.getTime() - startTime.getTime();
    const eventDuration = endTime.getTime() - startTime.getTime();
    const progress = timeDiff / eventDuration;

    if (doorsOpenTime && currentTime < doorsOpenTime) {
      return 'pre-event';
    } else if (doorsOpenTime && currentTime >= doorsOpenTime && currentTime < startTime) {
      return 'doors-open';
    } else if (progress < 0.2) {
      return 'main-event';
    } else if (progress < 0.8) {
      return 'peak';
    } else if (progress < 1) {
      return 'winding-down';
    } else {
      return 'post-event';
    }
  }

  private calculateConfidence(patterns: IncidentPattern[], riskFactors: RiskFactor[]): number {
    const patternConfidence = Math.min(patterns.length / 50, 1); // More patterns = higher confidence
    const factorConfidence = Math.min(riskFactors.length / 10, 1); // More factors = higher confidence
    
    return (patternConfidence + factorConfidence) / 2;
  }

  private getContributingFactors(hotspot: any): string[] {
    const factors: string[] = [];
    
    if (hotspot.incidentCount > 5) factors.push('High incident frequency');
    if (hotspot.incidentTypes.includes('medical')) factors.push('Medical incident hotspot');
    if (hotspot.incidentTypes.includes('security')) factors.push('Security incident hotspot');
    if (hotspot.riskScore > 70) factors.push('Critical risk level');
    
    return factors;
  }

  private calculateIncidentTypeRisk(
    incidentType: string,
    patterns: IncidentPattern[],
    riskFactors: RiskFactor[]
  ): number {
    if (patterns.length === 0) return 0.3;

    const typePatterns = patterns.filter(p => p.incidentTypes.includes(incidentType));
    const avgIncidentCount = typePatterns.reduce((sum, p) => sum + p.incidentCount, 0) / typePatterns.length;
    
    // Normalize based on incident type severity
    const severityWeights = {
      'medical': 1.5,
      'security': 1.3,
      'technical': 1.0,
      'lost_property': 0.7,
      'welfare': 1.2
    };

    const weight = severityWeights[incidentType as keyof typeof severityWeights] || 1.0;
    return Math.min((avgIncidentCount * weight) / 10, 1);
  }

  private calculateIncidentProbability(incidentType: string, patterns: IncidentPattern[]): number {
    if (patterns.length === 0) return 0.1;

    const typePatterns = patterns.filter(p => p.incidentTypes.includes(incidentType));
    const totalPatterns = patterns.length;
    
    return typePatterns.length / totalPatterns;
  }

  private getIncidentTypeContributingFactors(incidentType: string, riskFactors: RiskFactor[]): string[] {
    const factors: string[] = [];
    
    // Check weather factors
    const weatherFactors = riskFactors.filter(f => f.factorType === 'weather');
    weatherFactors.forEach(factor => {
      if (factor.factorValue.affectedTypes?.includes(incidentType)) {
        factors.push(`${factor.factorValue.condition} conditions`);
      }
    });

    // Check crowd factors
    const crowdFactors = riskFactors.filter(f => f.factorType === 'crowd');
    crowdFactors.forEach(factor => {
      if (factor.weight > 0.5) {
        factors.push(`High crowd density (${factor.factorValue.densityRange})`);
      }
    });

    return factors;
  }

  private getDefaultRiskScore(): RiskScore {
    return {
      overallScore: 30,
      weatherScore: 30,
      crowdScore: 30,
      timeScore: 30,
      locationScore: 30,
      eventPhaseScore: 30,
      contributingFactors: [],
      validUntil: new Date(Date.now() + 15 * 60 * 1000),
      confidence: 0.3
    };
  }

  /**
   * Get risk weights for the event, either from custom configuration or database
   */
  private async getRiskWeights(): Promise<RiskWeights> {
    // If custom weights were provided in constructor, use them
    if (this.customWeights) {
      return this.customWeights;
    }

    try {
      // Try to get weights from database
      const { data: eventData, error } = await supabase
        .from('events')
        .select('risk_weights')
        .eq('id', this.eventId)
        .single();

      if (error || !eventData?.risk_weights) {
        return DEFAULT_RISK_WEIGHTS;
      }

      const storedWeights = eventData.risk_weights as RiskWeights;
      
      // Validate the stored weights
      if (this.validateRiskWeights(storedWeights)) {
        return storedWeights;
      } else {
        console.warn('Invalid risk weights found in database, using defaults');
        return DEFAULT_RISK_WEIGHTS;
      }
    } catch (error) {
      console.error('Error fetching risk weights:', error);
      return DEFAULT_RISK_WEIGHTS;
    }
  }

  /**
   * Validate that risk weights sum to 1.0 and are within valid ranges
   */
  private validateRiskWeights(weights: RiskWeights): boolean {
    const sum = weights.weather + weights.crowd + weights.time + weights.location + weights.eventPhase;
    
    // Check if weights sum to 1.0 (with small tolerance for floating point errors)
    if (Math.abs(sum - 1.0) > 0.01) {
      return false;
    }

    // Check if all weights are between 0 and 1
    const allWeights = [weights.weather, weights.crowd, weights.time, weights.location, weights.eventPhase];
    return allWeights.every(weight => weight >= 0 && weight <= 1);
  }

  /**
   * Set custom risk weights for the event
   */
  async setRiskWeights(weights: RiskWeights): Promise<boolean> {
    try {
      // Validate the weights
      if (!this.validateRiskWeights(weights)) {
        throw new Error('Invalid risk weights: must sum to 1.0 and be between 0 and 1');
      }

      // Store in database
      const { error } = await supabase
        .from('events')
        .update({ risk_weights: weights })
        .eq('id', this.eventId);

      if (error) {
        throw error;
      }

      // Update local custom weights
      this.customWeights = weights;

      return true;
    } catch (error) {
      console.error('Error setting risk weights:', error);
      return false;
    }
  }

  /**
   * Reset risk weights to defaults
   */
  async resetRiskWeights(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('events')
        .update({ risk_weights: null })
        .eq('id', this.eventId);

      if (error) {
        throw error;
      }

      // Clear local custom weights
      this.customWeights = null;

      return true;
    } catch (error) {
      console.error('Error resetting risk weights:', error);
      return false;
    }
  }

  /**
   * Get current risk weights (for display purposes)
   */
  async getCurrentRiskWeights(): Promise<RiskWeights> {
    return await this.getRiskWeights();
  }

  /**
   * Get weather risk factors for analysis
   */
  async getWeatherRiskFactors(): Promise<any[]> {
    try {
      const patterns = await this.patternEngine.analyzeIncidentPatterns();
      const weatherCorrelations = await this.patternEngine.analyzeWeatherCorrelations();
      
      return weatherCorrelations.map(correlation => ({
        condition: correlation.weatherCondition,
        incidentRate: correlation.incidentRate,
        affectedTypes: correlation.affectedIncidentTypes,
        confidence: correlation.confidence
      }));
    } catch (error) {
      console.error('Error getting weather risk factors:', error);
      return [];
    }
  }
}
