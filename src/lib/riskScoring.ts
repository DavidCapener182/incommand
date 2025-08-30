import { supabase } from './supabase';
import { logger } from './logger';

export interface RiskScore {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  contributingFactors: RiskFactor[];
  lastUpdated: Date;
  confidence: number;
}

export interface RiskFactor {
  factorType: 'crowd_density' | 'weather' | 'incident_frequency' | 'staff_levels' | 'time_of_day' | 'location' | 'event_type';
  factorValue: FactorValue;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface FactorValue {
  condition?: string;
  densityRange?: string;
  timeSlot?: string;
  location?: string;
  value?: number;
  threshold?: number;
}

export interface LocationRiskScore {
  location: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  lastIncident?: Date;
  incidentCount: number;
  averageSeverity: number;
}

export interface IncidentTypeRisk {
  incidentType: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  frequency: number;
  averageSeverity: number;
  lastOccurrence?: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface RiskThresholds {
  crowdDensity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  incidentFrequency: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  responseTime: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  staffLevels: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export class RiskScoringEngine {
  private eventId: string;
  private thresholds: RiskThresholds;
  private riskScores: Map<string, RiskScore> = new Map();

  constructor(eventId: string) {
    this.eventId = eventId;
    this.thresholds = {
      crowdDensity: {
        low: 50,
        medium: 70,
        high: 85,
        critical: 95
      },
      incidentFrequency: {
        low: 2,
        medium: 5,
        high: 10,
        critical: 15
      },
      responseTime: {
        low: 2,
        medium: 5,
        high: 10,
        critical: 15
      },
      staffLevels: {
        low: 0.1,
        medium: 0.05,
        high: 0.02,
        critical: 0.01
      }
    };
  }

  async calculateOverallRiskScore(): Promise<RiskScore> {
    try {
      logger.info('Calculating overall risk score', { eventId: this.eventId });

      const factors: RiskFactor[] = [];

      // Crowd density risk
      const crowdDensityRisk = await this.calculateCrowdDensityRisk();
      factors.push(crowdDensityRisk);

      // Weather risk
      const weatherRisk = await this.calculateWeatherRisk();
      factors.push(weatherRisk);

      // Incident frequency risk
      const incidentFrequencyRisk = await this.calculateIncidentFrequencyRisk();
      factors.push(incidentFrequencyRisk);

      // Staff levels risk
      const staffLevelsRisk = await this.calculateStaffLevelsRisk();
      factors.push(staffLevelsRisk);

      // Time of day risk
      const timeOfDayRisk = this.calculateTimeOfDayRisk();
      factors.push(timeOfDayRisk);

      // Event type risk
      const eventTypeRisk = await this.calculateEventTypeRisk();
      factors.push(eventTypeRisk);

      // Calculate overall score
      const overallScore = this.calculateWeightedScore(factors);
      const riskLevel = this.determineRiskLevel(overallScore);
      const confidence = this.calculateConfidence(factors);

      const riskScore: RiskScore = {
        overallScore,
        riskLevel,
        contributingFactors: factors,
        lastUpdated: new Date(),
        confidence
      };

      // Store risk score
      await this.storeRiskScore(riskScore);

      return riskScore;

    } catch (error) {
      logger.error('Error calculating overall risk score', { error, eventId: this.eventId });
      throw error;
    }
  }

  async getLocationSpecificRiskScores(): Promise<LocationRiskScore[]> {
    try {
      const { data: incidents, error } = await supabase
        .from('incident_logs')
        .select('*')
        .eq('event_id', this.eventId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      if (!incidents || incidents.length === 0) {
        return [];
      }

      // Group incidents by location
      const locationGroups = new Map<string, any[]>();
      incidents.forEach(incident => {
        const location = incident.location || 'Unknown';
        if (!locationGroups.has(location)) {
          locationGroups.set(location, []);
        }
        locationGroups.get(location)!.push(incident);
      });

      const locationRisks: LocationRiskScore[] = [];

      for (const [location, locationIncidents] of locationGroups) {
        const riskScore = this.calculateLocationRiskScore(location, locationIncidents);
        locationRisks.push(riskScore);
      }

      return locationRisks;

    } catch (error) {
      logger.error('Error getting location-specific risk scores', { error, eventId: this.eventId });
      return [];
    }
  }

  async getIncidentTypeRiskScores(): Promise<IncidentTypeRisk[]> {
    try {
      const { data: incidents, error } = await supabase
        .from('incident_logs')
        .select('*')
        .eq('event_id', this.eventId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      if (!incidents || incidents.length === 0) {
        return [];
      }

      // Group incidents by type
      const typeGroups = new Map<string, any[]>();
      incidents.forEach(incident => {
        const incidentType = incident.incident_type;
        if (!typeGroups.has(incidentType)) {
          typeGroups.set(incidentType, []);
        }
        typeGroups.get(incidentType)!.push(incident);
      });

      const typeRisks: IncidentTypeRisk[] = [];

      for (const [incidentType, typeIncidents] of typeGroups) {
        const riskScore = this.calculateIncidentTypeRiskScore(incidentType, typeIncidents);
        typeRisks.push(riskScore);
      }

      return typeRisks;

    } catch (error) {
      logger.error('Error getting incident type risk scores', { error, eventId: this.eventId });
      return [];
    }
  }

  private async calculateCrowdDensityRisk(): Promise<RiskFactor> {
    try {
      const { data: event } = await supabase
        .from('events')
        .select('current_attendance, max_capacity')
        .eq('id', this.eventId)
        .single();

      if (!event) {
        return this.createDefaultRiskFactor('crowd_density', 'No event data available');
      }

      const currentAttendance = event.current_attendance || 0;
      const maxCapacity = event.max_capacity || 1000;
      const densityPercentage = (currentAttendance / maxCapacity) * 100;

      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      let weight: number;

      if (densityPercentage >= this.thresholds.crowdDensity.critical) {
        riskLevel = 'critical';
        weight = 0.4;
      } else if (densityPercentage >= this.thresholds.crowdDensity.high) {
        riskLevel = 'high';
        weight = 0.3;
      } else if (densityPercentage >= this.thresholds.crowdDensity.medium) {
        riskLevel = 'medium';
        weight = 0.2;
      } else {
        riskLevel = 'low';
        weight = 0.1;
      }

      return {
        factorType: 'crowd_density',
        factorValue: {
          densityRange: `${densityPercentage.toFixed(1)}%`,
          value: densityPercentage,
          threshold: this.thresholds.crowdDensity[riskLevel]
        },
        weight,
        impact: 'negative',
        description: `Current crowd density is ${densityPercentage.toFixed(1)}% of capacity`
      };

    } catch (error) {
      logger.error('Error calculating crowd density risk', { error });
      return this.createDefaultRiskFactor('crowd_density', 'Error calculating crowd density');
    }
  }

  private async calculateWeatherRisk(): Promise<RiskFactor> {
    try {
      // Simulate weather data - in a real implementation, this would fetch from a weather API
      const weatherConditions = {
        temperature: 22,
        humidity: 65,
        precipitation: 0,
        windSpeed: 15,
        condition: 'Partly Cloudy'
      };

      let riskScore = 0;
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let weight = 0.15;

      // Temperature risk
      if (weatherConditions.temperature > 30 || weatherConditions.temperature < 5) {
        riskScore += 0.3;
        riskLevel = 'medium';
      }

      // Precipitation risk
      if (weatherConditions.precipitation > 0) {
        riskScore += 0.4;
        riskLevel = 'high';
      }

      // Wind risk
      if (weatherConditions.windSpeed > 25) {
        riskScore += 0.2;
        if (riskLevel === 'low') riskLevel = 'medium';
      }

      return {
        factorType: 'weather',
        factorValue: {
          condition: weatherConditions.condition,
          value: riskScore
        },
        weight,
        impact: 'negative',
        description: `Weather conditions: ${weatherConditions.condition}, ${weatherConditions.temperature}°C`
      };

    } catch (error) {
      logger.error('Error calculating weather risk', { error });
      return this.createDefaultRiskFactor('weather', 'Error calculating weather risk');
    }
  }

  private async calculateIncidentFrequencyRisk(): Promise<RiskFactor> {
    try {
      const { data: incidents, error } = await supabase
        .from('incident_logs')
        .select('*')
        .eq('event_id', this.eventId)
        .gte('timestamp', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()); // Last 2 hours

      if (error) throw error;

      const incidentCount = incidents?.length || 0;
      const hoursElapsed = 2;
      const incidentsPerHour = incidentCount / hoursElapsed;

      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      let weight: number;

      if (incidentsPerHour >= this.thresholds.incidentFrequency.critical) {
        riskLevel = 'critical';
        weight = 0.35;
      } else if (incidentsPerHour >= this.thresholds.incidentFrequency.high) {
        riskLevel = 'high';
        weight = 0.25;
      } else if (incidentsPerHour >= this.thresholds.incidentFrequency.medium) {
        riskLevel = 'medium';
        weight = 0.15;
      } else {
        riskLevel = 'low';
        weight = 0.1;
      }

      return {
        factorType: 'incident_frequency',
        factorValue: {
          value: incidentsPerHour,
          threshold: this.thresholds.incidentFrequency[riskLevel]
        },
        weight,
        impact: 'negative',
        description: `${incidentCount} incidents in the last ${hoursElapsed} hours (${incidentsPerHour.toFixed(1)} per hour)`
      };

    } catch (error) {
      logger.error('Error calculating incident frequency risk', { error });
      return this.createDefaultRiskFactor('incident_frequency', 'Error calculating incident frequency');
    }
  }

  private async calculateStaffLevelsRisk(): Promise<RiskFactor> {
    try {
      // Simulate staff level data - in a real implementation, this would come from staff management system
      const totalStaff = 25;
      const currentAttendance = 800;
      const staffToAttendeeRatio = totalStaff / currentAttendance;

      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      let weight: number;

      if (staffToAttendeeRatio <= this.thresholds.staffLevels.critical) {
        riskLevel = 'critical';
        weight = 0.3;
      } else if (staffToAttendeeRatio <= this.thresholds.staffLevels.high) {
        riskLevel = 'high';
        weight = 0.25;
      } else if (staffToAttendeeRatio <= this.thresholds.staffLevels.medium) {
        riskLevel = 'medium';
        weight = 0.2;
      } else {
        riskLevel = 'low';
        weight = 0.15;
      }

      return {
        factorType: 'staff_levels',
        factorValue: {
          value: staffToAttendeeRatio,
          threshold: this.thresholds.staffLevels[riskLevel]
        },
        weight,
        impact: 'negative',
        description: `Staff ratio: 1 staff per ${(1 / staffToAttendeeRatio).toFixed(0)} attendees`
      };

    } catch (error) {
      logger.error('Error calculating staff levels risk', { error });
      return this.createDefaultRiskFactor('staff_levels', 'Error calculating staff levels');
    }
  }

  private calculateTimeOfDayRisk(): RiskFactor {
    const currentHour = new Date().getHours();
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let weight = 0.1;

    // Higher risk during evening hours when alcohol consumption and crowd fatigue increase
    if (currentHour >= 22 || currentHour <= 2) {
      riskLevel = 'high';
      weight = 0.2;
    } else if (currentHour >= 20 || currentHour <= 4) {
      riskLevel = 'medium';
      weight = 0.15;
    }

    return {
      factorType: 'time_of_day',
      factorValue: {
        timeSlot: `${currentHour}:00`,
        value: currentHour
      },
      weight,
      impact: 'negative',
      description: `Current time: ${currentHour}:00`
    };
  }

  private async calculateEventTypeRisk(): Promise<RiskFactor> {
    try {
      const { data: event } = await supabase
        .from('events')
        .select('event_type')
        .eq('id', this.eventId)
        .single();

      if (!event?.event_type) {
        return this.createDefaultRiskFactor('event_type', 'Unknown event type');
      }

      // Different event types have different inherent risk levels
      const eventTypeRisks: { [key: string]: { riskLevel: 'low' | 'medium' | 'high' | 'critical'; weight: number } } = {
        'concert': { riskLevel: 'high', weight: 0.25 },
        'sports': { riskLevel: 'medium', weight: 0.2 },
        'festival': { riskLevel: 'high', weight: 0.3 },
        'conference': { riskLevel: 'low', weight: 0.1 },
        'exhibition': { riskLevel: 'low', weight: 0.1 },
        'party': { riskLevel: 'high', weight: 0.25 },
        'wedding': { riskLevel: 'low', weight: 0.1 }
      };

      const eventRisk = eventTypeRisks[event.event_type] || { riskLevel: 'medium', weight: 0.15 };

      return {
        factorType: 'event_type',
        factorValue: {
          condition: event.event_type
        },
        weight: eventRisk.weight,
        impact: 'negative',
        description: `Event type: ${event.event_type}`
      };

    } catch (error) {
      logger.error('Error calculating event type risk', { error });
      return this.createDefaultRiskFactor('event_type', 'Error calculating event type risk');
    }
  }

  private calculateLocationRiskScore(location: string, incidents: any[]): LocationRiskScore {
    const incidentCount = incidents.length;
    const lastIncident = incidents.length > 0 ? new Date(incidents[0].timestamp) : undefined;
    
    // Calculate average severity
    const severityScores = incidents.map(incident => {
      switch (incident.priority?.toLowerCase()) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 1;
      }
    });
    
    const averageSeverity = severityScores.length > 0 
      ? severityScores.reduce((sum, score) => sum + score, 0) / severityScores.length 
      : 0;

    // Calculate risk score based on incident count and severity
    const riskScore = Math.min(100, (incidentCount * averageSeverity * 10));
    const riskLevel = this.determineRiskLevel(riskScore);

    // Generate risk factors
    const factors: RiskFactor[] = [
      {
        factorType: 'location',
        factorValue: { location },
        weight: 0.3,
        impact: 'negative',
        description: `${incidentCount} incidents at this location`
      }
    ];

    return {
      location,
      riskScore,
      riskLevel,
      factors,
      lastIncident,
      incidentCount,
      averageSeverity
    };
  }

  private calculateIncidentTypeRiskScore(incidentType: string, incidents: any[]): IncidentTypeRisk {
    const frequency = incidents.length;
    const lastOccurrence = incidents.length > 0 ? new Date(incidents[0].timestamp) : undefined;
    
    // Calculate average severity
    const severityScores = incidents.map(incident => {
      switch (incident.priority?.toLowerCase()) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 1;
      }
    });
    
    const averageSeverity = severityScores.length > 0 
      ? severityScores.reduce((sum, score) => sum + score, 0) / severityScores.length 
      : 0;

    // Calculate risk score
    const riskScore = Math.min(100, (frequency * averageSeverity * 8));
    const riskLevel = this.determineRiskLevel(riskScore);

    // Determine trend (simplified - in real implementation, this would analyze historical data)
    const trend: 'increasing' | 'decreasing' | 'stable' = 
      frequency > 5 ? 'increasing' : frequency > 2 ? 'stable' : 'decreasing';

    return {
      incidentType,
      riskScore,
      riskLevel,
      frequency,
      averageSeverity,
      lastOccurrence,
      trend
    };
  }

  private calculateWeightedScore(factors: RiskFactor[]): number {
    let totalScore = 0;
    let totalWeight = 0;

    factors.forEach(factor => {
      const factorScore = this.calculateFactorScore(factor);
      totalScore += factorScore * factor.weight;
      totalWeight += factor.weight;
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private calculateFactorScore(factor: RiskFactor): number {
    const factorValue = factor.factorValue.value || 0;
    
    switch (factor.factorType) {
      case 'crowd_density':
        return Math.min(100, factorValue);
      case 'weather':
        return Math.min(100, factorValue * 100);
      case 'incident_frequency':
        return Math.min(100, factorValue * 10);
      case 'staff_levels':
        return Math.min(100, (1 - factorValue) * 100);
      case 'time_of_day':
        return factorValue >= 22 || factorValue <= 2 ? 80 : factorValue >= 20 || factorValue <= 4 ? 50 : 20;
      case 'event_type':
        return 50; // Default score for event type
      default:
        return 50;
    }
  }

  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private calculateConfidence(factors: RiskFactor[]): number {
    // Calculate confidence based on data availability and quality
    let confidence = 0.8;
    
    factors.forEach(factor => {
      if (factor.factorValue.value === undefined || factor.factorValue.value === null) {
        confidence -= 0.1;
      }
    });

    return Math.max(0.3, Math.min(1, confidence));
  }

  private createDefaultRiskFactor(
    factorType: RiskFactor['factorType'], 
    description: string
  ): RiskFactor {
    return {
      factorType,
      factorValue: {},
      weight: 0.1,
      impact: 'neutral',
      description
    };
  }

  private async storeRiskScore(riskScore: RiskScore): Promise<void> {
    try {
      const riskData = {
        event_id: this.eventId,
        overall_score: riskScore.overallScore,
        risk_level: riskScore.riskLevel,
        contributing_factors: riskScore.contributingFactors,
        confidence: riskScore.confidence,
        last_updated: riskScore.lastUpdated.toISOString()
      };

      const { error } = await supabase
        .from('risk_scores')
        .upsert(riskData, { onConflict: 'event_id' });

      if (error) throw error;

      logger.info('Stored risk score', { 
        eventId: this.eventId, 
        score: riskScore.overallScore,
        level: riskScore.riskLevel
      });

    } catch (error) {
      logger.error('Error storing risk score', { error, eventId: this.eventId });
      throw error;
    }
  }

  async getRiskHistory(): Promise<RiskScore[]> {
    try {
      const { data: riskHistory, error } = await supabase
        .from('risk_scores')
        .select('*')
        .eq('event_id', this.eventId)
        .order('last_updated', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (riskHistory || []).map(record => ({
        overallScore: record.overall_score,
        riskLevel: record.risk_level,
        contributingFactors: record.contributing_factors || [],
        lastUpdated: new Date(record.last_updated),
        confidence: record.confidence
      }));

    } catch (error) {
      logger.error('Error getting risk history', { error, eventId: this.eventId });
      return [];
    }
  }

  async updateThresholds(newThresholds: Partial<RiskThresholds>): Promise<void> {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Updated risk thresholds', { eventId: this.eventId, thresholds: this.thresholds });
  }

  getCurrentThresholds(): RiskThresholds {
    return this.thresholds;
  }
}
