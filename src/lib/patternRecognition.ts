import { supabase } from './supabase';

export interface IncidentPattern {
  timeOfDay: string;
  dayOfWeek: string;
  weatherCondition: string;
  crowdDensity: number;
  incidentCount: number;
  incidentTypes: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RiskFactor {
  factorType: 'weather' | 'crowd' | 'time' | 'location';
  factorValue: any;
  correlation: number;
  weight: number;
}

export interface LocationHotspot {
  location: string;
  incidentCount: number;
  incidentTypes: string[];
  riskScore: number;
  lastIncident: Date;
}

export interface WeatherCorrelation {
  weatherCondition: string;
  incidentRate: number;
  affectedIncidentTypes: string[];
  confidence: number;
}

export class PatternRecognitionEngine {
  private eventId: string;

  constructor(eventId: string) {
    this.eventId = eventId;
  }

  async analyzeIncidentPatterns(): Promise<IncidentPattern[]> {
    try {
      // Fetch historical incident data for this event and similar events
      const { data: incidents, error } = await supabase
        .from('incident_logs')
        .select(`
          *,
          events!inner(organization_id)
        `)
        .eq('events.organization_id', (
          await supabase
            .from('events')
            .select('organization_id')
            .eq('id', this.eventId)
            .single()
        ).data?.organization_id);

      if (error) throw error;

      const patterns: IncidentPattern[] = [];
      
      // Group incidents by time periods
      const timeGroups = this.groupIncidentsByTime(incidents || []);
      
      // Analyze patterns for each time group
      for (const [timeSlot, timeIncidents] of Object.entries(timeGroups)) {
        const dayGroups = this.groupIncidentsByDay(timeIncidents);
        
        for (const [day, dayIncidents] of Object.entries(dayGroups)) {
          const weatherGroups = this.groupIncidentsByWeather(dayIncidents);
          
          for (const [weather, weatherIncidents] of Object.entries(weatherGroups)) {
            const crowdGroups = this.groupIncidentsByCrowdDensity(weatherIncidents);
            
            for (const [density, densityIncidents] of Object.entries(crowdGroups)) {
              const incidentTypes = Array.from(new Set(densityIncidents.map(i => i.incident_type)));
              const riskLevel = this.calculateRiskLevel(densityIncidents.length, parseFloat(density));
              
              patterns.push({
                timeOfDay: timeSlot,
                dayOfWeek: day,
                weatherCondition: weather,
                crowdDensity: parseFloat(density),
                incidentCount: densityIncidents.length,
                incidentTypes,
                riskLevel
              });
            }
          }
        }
      }

      return patterns;
    } catch (error) {
      console.error('Error analyzing incident patterns:', error);
      return [];
    }
  }

  async identifyRiskFactors(): Promise<RiskFactor[]> {
    try {
      const patterns = await this.analyzeIncidentPatterns();
      const riskFactors: RiskFactor[] = [];

      // Get weather-related risk factors
      const weatherCorrelations = await this.analyzeWeatherCorrelations();
      const weatherFactors = weatherCorrelations.map(wc => ({
        factorType: 'weather' as const,
        factorValue: wc.weatherCondition,
        correlation: wc.incidentRate,
        weight: wc.confidence
      }));
      riskFactors.push(...weatherFactors);

      // Crowd density risk factors
      const crowdFactors = this.analyzeCrowdRiskFactors(patterns);
      riskFactors.push(...crowdFactors);

      // Time-based risk factors
      const timeFactors = this.analyzeTimeRiskFactors(patterns);
      riskFactors.push(...timeFactors);

      // Location risk factors
      const locationFactors = await this.analyzeLocationRiskFactors();
      riskFactors.push(...locationFactors);

      return riskFactors.sort((a, b) => b.weight - a.weight);
    } catch (error) {
      console.error('Error identifying risk factors:', error);
      return [];
    }
  }

  calculateTimeBasedRisk(currentTime: Date, patterns: IncidentPattern[]): number {
    const currentHour = currentTime.getHours();
    const currentDay = this.getDayOfWeek(currentTime);
    
    // Find matching patterns
    const matchingPatterns = patterns.filter(p => 
      p.timeOfDay === this.getTimeSlot(currentHour) && 
      p.dayOfWeek === currentDay
    );

    if (matchingPatterns.length === 0) return 0.3; // Default moderate risk

    // Calculate weighted risk based on incident counts and crowd density
    const totalRisk = matchingPatterns.reduce((sum, pattern) => {
      const timeWeight = this.getTimeWeight(currentHour);
      const densityWeight = this.getDensityWeight(pattern.crowdDensity);
      return sum + (pattern.incidentCount * timeWeight * densityWeight);
    }, 0);

    const avgRisk = totalRisk / matchingPatterns.length;
    return Math.min(avgRisk / 10, 1); // Normalize to 0-1
  }

  async detectLocationHotspots(): Promise<LocationHotspot[]> {
    try {
      const { data: incidents, error } = await supabase
        .from('incident_logs')
        .select('*')
        .eq('event_id', this.eventId);

      if (error) throw error;

      const locationGroups = this.groupIncidentsByLocation(incidents || []);
      const hotspots: LocationHotspot[] = [];

      for (const [location, locationIncidents] of Object.entries(locationGroups)) {
        const incidentTypes = Array.from(new Set(locationIncidents.map(i => i.incident_type)));
        const riskScore = this.calculateLocationRiskScore(locationIncidents);
        const lastIncident = new Date(Math.max(...locationIncidents.map(i => new Date(i.created_at).getTime())));

        hotspots.push({
          location,
          incidentCount: locationIncidents.length,
          incidentTypes,
          riskScore,
          lastIncident
        });
      }

      return hotspots.sort((a, b) => b.riskScore - a.riskScore);
    } catch (error) {
      console.error('Error detecting location hotspots:', error);
      return [];
    }
  }

  async analyzeWeatherCorrelations(): Promise<WeatherCorrelation[]> {
    try {
      const patterns = await this.analyzeIncidentPatterns();
      const weatherCorrelations: WeatherCorrelation[] = [];

      // Group patterns by weather condition
      const weatherGroups = this.groupPatternsByWeather(patterns);

      for (const [weather, weatherPatterns] of Object.entries(weatherGroups)) {
        const totalIncidents = weatherPatterns.reduce((sum, p) => sum + p.incidentCount, 0);
        const totalPatterns = weatherPatterns.length;
        const incidentRate = totalIncidents / totalPatterns;

        const allIncidentTypes = weatherPatterns.flatMap(p => p.incidentTypes);
        const affectedTypes = Array.from(new Set(allIncidentTypes));

        const confidence = this.calculateWeatherConfidence(weatherPatterns);

        weatherCorrelations.push({
          weatherCondition: weather,
          incidentRate,
          affectedIncidentTypes: affectedTypes,
          confidence
        });
      }

      return weatherCorrelations.sort((a, b) => b.incidentRate - a.incidentRate);
    } catch (error) {
      console.error('Error analyzing weather correlations:', error);
      return [];
    }
  }

  crowdDensityRiskAnalysis(currentDensity: number, patterns: IncidentPattern[]): number {
    // Find patterns with similar crowd density
    const densityRange = 0.1; // 10% tolerance
    const matchingPatterns = patterns.filter(p => 
      Math.abs(p.crowdDensity - currentDensity) <= (currentDensity * densityRange)
    );

    if (matchingPatterns.length === 0) {
      // If no exact matches, use broader analysis
      return this.estimateDensityRisk(currentDensity, patterns);
    }

    // Calculate risk based on incident rates at similar densities
    const totalIncidents = matchingPatterns.reduce((sum, p) => sum + p.incidentCount, 0);
    const avgIncidentRate = totalIncidents / matchingPatterns.length;

    // Normalize to 0-1 scale
    return Math.min(avgIncidentRate / 5, 1);
  }

  // Private helper methods
  private groupIncidentsByTime(incidents: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    incidents.forEach(incident => {
      const hour = new Date(incident.created_at).getHours();
      const timeSlot = this.getTimeSlot(hour);
      
      if (!groups[timeSlot]) groups[timeSlot] = [];
      groups[timeSlot].push(incident);
    });

    return groups;
  }

  private groupIncidentsByDay(incidents: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    incidents.forEach(incident => {
      const day = this.getDayOfWeek(new Date(incident.created_at));
      
      if (!groups[day]) groups[day] = [];
      groups[day].push(incident);
    });

    return groups;
  }

  private groupIncidentsByWeather(incidents: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    incidents.forEach(incident => {
      const weather = incident.weather_conditions || 'unknown';
      
      if (!groups[weather]) groups[weather] = [];
      groups[weather].push(incident);
    });

    return groups;
  }

  private groupIncidentsByCrowdDensity(incidents: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    incidents.forEach(incident => {
      const density = Math.floor((incident.crowd_density || 0) * 10) / 10; // Round to 1 decimal
      
      if (!groups[density.toString()]) groups[density.toString()] = [];
      groups[density.toString()].push(incident);
    });

    return groups;
  }

  private groupIncidentsByLocation(incidents: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    incidents.forEach(incident => {
      const location = incident.location || 'unknown';
      
      if (!groups[location]) groups[location] = [];
      groups[location].push(incident);
    });

    return groups;
  }

  private groupPatternsByWeather(patterns: IncidentPattern[]): Record<string, IncidentPattern[]> {
    const groups: Record<string, IncidentPattern[]> = {};
    
    patterns.forEach(pattern => {
      if (!groups[pattern.weatherCondition]) groups[pattern.weatherCondition] = [];
      groups[pattern.weatherCondition].push(pattern);
    });

    return groups;
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 24) return 'evening';
    return 'night';
  }

  private getDayOfWeek(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  private calculateRiskLevel(incidentCount: number, crowdDensity: number): 'low' | 'medium' | 'high' {
    const densityFactor = crowdDensity / 100;
    const incidentFactor = incidentCount / 10;
    const combinedRisk = (densityFactor + incidentFactor) / 2;

    if (combinedRisk < 0.3) return 'low';
    if (combinedRisk < 0.7) return 'medium';
    return 'high';
  }

  private getTimeWeight(hour: number): number {
    // Higher weight for peak event hours
    if (hour >= 19 && hour <= 23) return 1.5;
    if (hour >= 14 && hour <= 18) return 1.2;
    return 1.0;
  }

  private getDensityWeight(density: number): number {
    // Higher weight for high density
    if (density > 80) return 1.5;
    if (density > 60) return 1.2;
    return 1.0;
  }

  private calculateLocationRiskScore(incidents: any[]): number {
    const recentIncidents = incidents.filter(i => {
      const incidentTime = new Date(i.created_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - incidentTime.getTime()) / (1000 * 60 * 60);
      return hoursDiff <= 24; // Last 24 hours
    });

    const severityWeights = {
      'medical': 3,
      'security': 2,
      'technical': 1,
      'lost_property': 0.5,
      'welfare': 1.5
    };

    const totalScore = recentIncidents.reduce((sum, incident) => {
      const weight = severityWeights[incident.incident_type as keyof typeof severityWeights] || 1;
      return sum + weight;
    }, 0);

    return Math.min(totalScore / 10, 100); // Normalize to 0-100
  }

  private calculateWeatherConfidence(patterns: IncidentPattern[]): number {
    const totalPatterns = patterns.length;
    if (totalPatterns === 0) return 0;

    const consistentPatterns = patterns.filter(p => p.incidentCount > 0);
    return consistentPatterns.length / totalPatterns;
  }

  private estimateDensityRisk(density: number, patterns: IncidentPattern[]): number {
    // Use linear interpolation between known density points
    const sortedPatterns = patterns.sort((a, b) => a.crowdDensity - b.crowdDensity);
    
    if (sortedPatterns.length === 0) return 0.3;

    // Find closest density patterns
    const lowerPattern = sortedPatterns.find(p => p.crowdDensity <= density);
    const higherPattern = sortedPatterns.find(p => p.crowdDensity >= density);

    if (!lowerPattern && !higherPattern) return 0.3;
    if (!lowerPattern) return higherPattern!.incidentCount / 10;
    if (!higherPattern) return lowerPattern.incidentCount / 10;

    // Linear interpolation
    const ratio = (density - lowerPattern.crowdDensity) / (higherPattern.crowdDensity - lowerPattern.crowdDensity);
    const interpolatedRisk = lowerPattern.incidentCount + (higherPattern.incidentCount - lowerPattern.incidentCount) * ratio;
    
    return Math.min(interpolatedRisk / 10, 1);
  }

  private async analyzeWeatherRiskFactors(patterns: IncidentPattern[]): Promise<RiskFactor[]> {
    const weatherCorrelations = await this.analyzeWeatherCorrelations();
    
    return weatherCorrelations.map(correlation => ({
      factorType: 'weather' as const,
      factorValue: {
        condition: correlation.weatherCondition,
        incidentRate: correlation.incidentRate,
        affectedTypes: correlation.affectedIncidentTypes
      },
      correlation: correlation.confidence,
      weight: correlation.incidentRate * correlation.confidence
    }));
  }

  private analyzeCrowdRiskFactors(patterns: IncidentPattern[]): RiskFactor[] {
    const densityGroups = this.groupPatternsByDensity(patterns);
    const factors: RiskFactor[] = [];

    for (const [densityRange, densityPatterns] of Object.entries(densityGroups)) {
      const avgIncidentRate = densityPatterns.reduce((sum, p) => sum + p.incidentCount, 0) / densityPatterns.length;
      const density = parseFloat(densityRange.split('-')[0]);

      factors.push({
        factorType: 'crowd' as const,
        factorValue: {
          densityRange,
          incidentRate: avgIncidentRate,
          threshold: density
        },
        correlation: avgIncidentRate / 10,
        weight: avgIncidentRate * (density / 100)
      });
    }

    return factors;
  }

  private analyzeTimeRiskFactors(patterns: IncidentPattern[]): RiskFactor[] {
    const timeGroups = this.groupPatternsByTime(patterns);
    const factors: RiskFactor[] = [];

    for (const [timeSlot, timePatterns] of Object.entries(timeGroups)) {
      const avgIncidentRate = timePatterns.reduce((sum, p) => sum + p.incidentCount, 0) / timePatterns.length;
      const timeWeight = this.getTimeWeight(this.getTimeSlotHour(timeSlot));

      factors.push({
        factorType: 'time' as const,
        factorValue: {
          timeSlot,
          incidentRate: avgIncidentRate,
          weight: timeWeight
        },
        correlation: avgIncidentRate / 10,
        weight: avgIncidentRate * timeWeight
      });
    }

    return factors;
  }

  private async analyzeLocationRiskFactors(): Promise<RiskFactor[]> {
    const hotspots = await this.detectLocationHotspots();
    
    return hotspots.map(hotspot => ({
      factorType: 'location' as const,
      factorValue: {
        location: hotspot.location,
        incidentCount: hotspot.incidentCount,
        riskScore: hotspot.riskScore,
        incidentTypes: hotspot.incidentTypes
      },
      correlation: hotspot.riskScore / 100,
      weight: hotspot.riskScore / 100
    }));
  }

  private groupPatternsByDensity(patterns: IncidentPattern[]): Record<string, IncidentPattern[]> {
    const groups: Record<string, IncidentPattern[]> = {};
    
    patterns.forEach(pattern => {
      const densityRange = this.getDensityRange(pattern.crowdDensity);
      
      if (!groups[densityRange]) groups[densityRange] = [];
      groups[densityRange].push(pattern);
    });

    return groups;
  }

  private groupPatternsByTime(patterns: IncidentPattern[]): Record<string, IncidentPattern[]> {
    const groups: Record<string, IncidentPattern[]> = {};
    
    patterns.forEach(pattern => {
      if (!groups[pattern.timeOfDay]) groups[pattern.timeOfDay] = [];
      groups[pattern.timeOfDay].push(pattern);
    });

    return groups;
  }

  private getDensityRange(density: number): string {
    if (density < 25) return '0-25';
    if (density < 50) return '25-50';
    if (density < 75) return '50-75';
    return '75-100';
  }

  private getTimeSlotHour(timeSlot: string): number {
    switch (timeSlot) {
      case 'morning': return 9;
      case 'afternoon': return 15;
      case 'evening': return 20;
      case 'night': return 2;
      default: return 12;
    }
  }

  // Additional methods for weather and crowd analysis
  async analyzeWeatherPatterns(): Promise<any[]> {
    try {
      const patterns = await this.analyzeIncidentPatterns();
      const weatherGroups = this.groupPatternsByWeather(patterns);
      
      return Object.entries(weatherGroups).map(([weather, patternList]) => ({
        weatherCondition: weather,
        incidentCount: patternList.length,
        riskScore: patternList.reduce((sum, pattern) => sum + pattern.incidentCount, 0),
        patterns: patternList
      }));
    } catch (error) {
      console.error('Error analyzing weather patterns:', error);
      return [];
    }
  }

  async getHistoricalWeatherIncidents(): Promise<any[]> {
    try {
      const { data: incidents, error } = await supabase
        .from('incident_logs')
        .select('*')
        .eq('event_id', this.eventId)
        .not('weather_conditions', 'is', null);

      if (error) throw error;

      return incidents?.map(incident => ({
        weatherCondition: incident.weather_conditions,
        incidentCount: 1,
        incidentTypes: [incident.incident_type],
        averageRiskScore: 50
      })) || [];
    } catch (error) {
      console.error('Error getting historical weather incidents:', error);
      return [];
    }
  }

  async getCurrentWeatherConditions(): Promise<any> {
    try {
      // This would typically call a weather service
      // For now, return mock data
      return {
        current: 'sunny',
        forecast: 'partly cloudy',
        change: 'no significant change'
      };
    } catch (error) {
      console.error('Error getting current weather conditions:', error);
      return {
        current: 'unknown',
        forecast: 'unknown',
        change: 'no data available'
      };
    }
  }

  async analyzeCrowdFlowPatterns(): Promise<any[]> {
    try {
      const { data: attendance, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('event_id', this.eventId)
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      if (!attendance || attendance.length === 0) {
        return [];
      }

      // Analyze crowd flow patterns
      const patterns = [];
      for (let i = 1; i < attendance.length; i++) {
        const current = attendance[i];
        const previous = attendance[i - 1];
        const flowRate = current.attendance_count - previous.attendance_count;
        
        patterns.push({
          type: flowRate > 0 ? 'inflow' : flowRate < 0 ? 'outflow' : 'stable',
          rate: Math.abs(flowRate),
          timestamp: current.recorded_at,
          location: current.location || 'main'
        });
      }

      return patterns;
    } catch (error) {
      console.error('Error analyzing crowd flow patterns:', error);
      return [];
    }
  }

  async getHistoricalCrowdFlow(): Promise<any[]> {
    try {
      const { data: attendance, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('event_id', this.eventId)
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      return attendance?.map(record => ({
        timestamp: record.recorded_at,
        entryRate: record.entry_rate || 0,
        exitRate: record.exit_rate || 0,
        occupancy: record.attendance_count
      })) || [];
    } catch (error) {
      console.error('Error getting historical crowd flow:', error);
      return [];
    }
  }
}
