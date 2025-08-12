import { supabase } from './supabase';
import { PatternRecognitionEngine } from './patternRecognition';
import { getWeatherData } from '../services/weatherService';

export interface CrowdFlowPrediction {
  timestamp: Date;
  predictedCount: number;
  confidence: number;
  factors: {
    weather: number;
    eventSchedule: number;
    historicalPattern: number;
    currentTrend: number;
  };
}

export interface EntryPattern {
  timeSlot: string;
  averageEntryRate: number;
  peakEntryRate: number;
  weatherImpact: number;
  eventTypeImpact: number;
}

export interface OccupancyForecast {
  timeIntervals: CrowdFlowPrediction[];
  peakTime: Date;
  peakOccupancy: number;
  capacityWarnings: string[];
  confidence: number;
}

export interface CrowdMovementPattern {
  fromLocation: string;
  toLocation: string;
  movementRate: number;
  timeOfDay: string;
  eventPhase: string;
}

export class CrowdFlowPredictionEngine {
  private eventId: string;
  private patternEngine: PatternRecognitionEngine;

  constructor(eventId: string) {
    this.eventId = eventId;
    this.patternEngine = new PatternRecognitionEngine(eventId);
  }

  async predictCrowdFlow(): Promise<CrowdFlowPrediction[]> {
    try {
      const predictions: CrowdFlowPrediction[] = [];
      const currentTime = new Date();
      
      // Generate predictions for next 4 hours in 30-minute intervals
      for (let i = 1; i <= 8; i++) {
        const predictionTime = new Date(currentTime.getTime() + i * 30 * 60 * 1000);
        const prediction = await this.calculatePrediction(predictionTime);
        predictions.push(prediction);
      }

      return predictions;
    } catch (error) {
      console.error('Error predicting crowd flow:', error);
      return [];
    }
  }

  async analyzeEntryPatterns(): Promise<EntryPattern[]> {
    try {
      const { data: attendanceHistory } = await supabase
        .from('attendance_records')
        .select('attendance_count, recorded_at, weather_conditions')
        .eq('event_id', this.eventId)
        .gte('recorded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('recorded_at', { ascending: true });

      if (!attendanceHistory || attendanceHistory.length === 0) {
        return this.getDefaultEntryPatterns();
      }

      const entryPatterns: EntryPattern[] = [];
      const timeSlots = ['morning', 'afternoon', 'evening', 'night'];

      for (const timeSlot of timeSlots) {
        const slotRecords = attendanceHistory.filter(record => {
          const hour = new Date(record.recorded_at).getHours();
          return this.getTimeSlot(hour) === timeSlot;
        });

        if (slotRecords.length === 0) continue;

        // Calculate entry rates
        const entryRates = this.calculateEntryRates(slotRecords);
        const averageEntryRate = entryRates.reduce((sum, rate) => sum + rate, 0) / entryRates.length;
        const peakEntryRate = Math.max(...entryRates);

        // Analyze weather impact
        const weatherImpact = this.calculateWeatherImpact(slotRecords);

        // Analyze event type impact
        const eventTypeImpact = await this.calculateEventTypeImpact();

        entryPatterns.push({
          timeSlot,
          averageEntryRate,
          peakEntryRate,
          weatherImpact,
          eventTypeImpact
        });
      }

      return entryPatterns;
    } catch (error) {
      console.error('Error analyzing entry patterns:', error);
      return this.getDefaultEntryPatterns();
    }
  }

  async calculateOccupancyForecast(): Promise<OccupancyForecast> {
    try {
      const predictions = await this.predictCrowdFlow();
      const { data: event } = await supabase
        .from('events')
        .select('max_capacity, current_attendance')
        .eq('id', this.eventId)
        .single();

      if (!event) {
        throw new Error('Event not found');
      }

      const maxCapacity = event.max_capacity || 1000;
      const currentAttendance = event.current_attendance || 0;

      // Find peak time and occupancy
      const peakPrediction = predictions.reduce((max, pred) => 
        pred.predictedCount > max.predictedCount ? pred : max
      );

      // Generate capacity warnings
      const capacityWarnings: string[] = [];
      const highOccupancyThreshold = maxCapacity * 0.85;
      const criticalOccupancyThreshold = maxCapacity * 0.95;

      for (const prediction of predictions) {
        if (prediction.predictedCount >= criticalOccupancyThreshold) {
          capacityWarnings.push(`Critical occupancy predicted at ${prediction.timestamp.toLocaleTimeString()}: ${Math.round(prediction.predictedCount / maxCapacity * 100)}%`);
        } else if (prediction.predictedCount >= highOccupancyThreshold) {
          capacityWarnings.push(`High occupancy predicted at ${prediction.timestamp.toLocaleTimeString()}: ${Math.round(prediction.predictedCount / maxCapacity * 100)}%`);
        }
      }

      // Calculate overall confidence
      const confidence = predictions.reduce((sum, pred) => sum + pred.confidence, 0) / predictions.length;

      return {
        timeIntervals: predictions,
        peakTime: peakPrediction.timestamp,
        peakOccupancy: peakPrediction.predictedCount,
        capacityWarnings,
        confidence
      };
    } catch (error) {
      console.error('Error calculating occupancy forecast:', error);
      return this.getDefaultOccupancyForecast();
    }
  }

  async identifyPeakTimes(): Promise<Date[]> {
    try {
      const predictions = await this.predictCrowdFlow();
      const peakTimes: Date[] = [];
      
      // Find local maxima in predictions
      for (let i = 1; i < predictions.length - 1; i++) {
        const current = predictions[i].predictedCount;
        const previous = predictions[i - 1].predictedCount;
        const next = predictions[i + 1].predictedCount;

        if (current > previous && current > next) {
          peakTimes.push(predictions[i].timestamp);
        }
      }

      return peakTimes;
    } catch (error) {
      console.error('Error identifying peak times:', error);
      return [];
    }
  }

  async detectCrowdMovementPatterns(): Promise<CrowdMovementPattern[]> {
    try {
      const { data: incidents } = await supabase
        .from('incident_logs')
        .select('location, created_at')
        .eq('event_id', this.eventId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: true });

      if (!incidents || incidents.length === 0) {
        return [];
      }

      const movementPatterns: CrowdMovementPattern[] = [];
      const locations = [...new Set(incidents.map(i => i.location))];

      // Analyze movement between locations
      for (let i = 0; i < locations.length; i++) {
        for (let j = i + 1; j < locations.length; j++) {
          const fromLocation = locations[i];
          const toLocation = locations[j];

          const pattern = this.analyzeLocationMovement(incidents, fromLocation, toLocation);
          if (pattern) {
            movementPatterns.push(pattern);
          }
        }
      }

      return movementPatterns;
    } catch (error) {
      console.error('Error detecting crowd movement patterns:', error);
      return [];
    }
  }

  async weatherImpactOnCrowd(): Promise<{ impact: number; factors: string[] }> {
    try {
      const weatherData = await getWeatherData();
      if (!weatherData || !weatherData.current) {
        return { impact: 0, factors: [] };
      }

      const currentWeather = weatherData.current;
      let impact = 0;
      const factors: string[] = [];

      // Temperature impact
      if (currentWeather.temp > 30) {
        impact -= 0.2; // High temperature reduces crowd duration
        factors.push('High temperature may cause early departures');
      } else if (currentWeather.temp < 5) {
        impact -= 0.15; // Low temperature affects comfort
        factors.push('Low temperature may affect crowd comfort');
      }

      // Precipitation impact
      if (currentWeather.precipitation > 0) {
        impact -= 0.3; // Rain significantly affects crowd behavior
        factors.push('Rain may delay entry and cause early departures');
      }

      // Wind impact
      if (currentWeather.wind_speed > 20) {
        impact -= 0.1; // High winds affect outdoor activities
        factors.push('High winds may affect outdoor activities');
      }

      // Humidity impact
      if (currentWeather.humidity > 80) {
        impact -= 0.1; // High humidity affects comfort
        factors.push('High humidity may affect crowd comfort');
      }

      return { impact, factors };
    } catch (error) {
      console.error('Error calculating weather impact on crowd:', error);
      return { impact: 0, factors: [] };
    }
  }

  async storeCrowdPredictions(predictions: CrowdFlowPrediction[]): Promise<void> {
    try {
      const predictionData = predictions.map(prediction => ({
        event_id: this.eventId,
        predicted_time: prediction.timestamp.toISOString(),
        predicted_count: prediction.predictedCount,
        confidence_score: prediction.confidence,
        factors: prediction.factors
      }));

      const { error } = await supabase
        .from('crowd_predictions')
        .insert(predictionData);

      if (error) throw error;
    } catch (error) {
      console.error('Error storing crowd predictions:', error);
    }
  }

  // Private helper methods
  private async calculatePrediction(timestamp: Date): Promise<CrowdFlowPrediction> {
    try {
      const currentAttendance = await this.getCurrentAttendance();
      const basePrediction = await this.getBasePrediction(timestamp);
      const weatherImpact = await this.getWeatherImpact(timestamp);
      const eventScheduleImpact = await this.getEventScheduleImpact(timestamp);
      const historicalPatternImpact = await this.getHistoricalPatternImpact(timestamp);
      const currentTrendImpact = await this.getCurrentTrendImpact();

      // Combine all factors
      const predictedCount = Math.max(0, Math.min(
        currentAttendance + basePrediction + weatherImpact + eventScheduleImpact + historicalPatternImpact + currentTrendImpact,
        10000 // Reasonable maximum
      ));

      // Calculate confidence based on data availability
      const confidence = this.calculatePredictionConfidence(timestamp);

      return {
        timestamp,
        predictedCount: Math.round(predictedCount),
        confidence,
        factors: {
          weather: weatherImpact,
          eventSchedule: eventScheduleImpact,
          historicalPattern: historicalPatternImpact,
          currentTrend: currentTrendImpact
        }
      };
    } catch (error) {
      console.error('Error calculating prediction:', error);
      return this.getDefaultPrediction(timestamp);
    }
  }

  private async getCurrentAttendance(): Promise<number> {
    try {
      const { data: event } = await supabase
        .from('events')
        .select('current_attendance')
        .eq('id', this.eventId)
        .single();

      return event?.current_attendance || 0;
    } catch (error) {
      console.error('Error getting current attendance:', error);
      return 0;
    }
  }

  private async getBasePrediction(timestamp: Date): Promise<number> {
    try {
      // Simple linear growth model
      const timeFromNow = (timestamp.getTime() - Date.now()) / (1000 * 60 * 60); // hours
      const baseGrowthRate = 50; // people per hour
      
      return timeFromNow * baseGrowthRate;
    } catch (error) {
      console.error('Error getting base prediction:', error);
      return 0;
    }
  }

  private async getWeatherImpact(timestamp: Date): Promise<number> {
    try {
      const weatherData = await getWeatherData();
      if (!weatherData || !weatherData.hourly) return 0;

      // Find weather data for the prediction time
      const predictionHour = timestamp.getHours();
      const weatherForecast = weatherData.hourly.find(h => 
        new Date(h.time).getHours() === predictionHour
      );

      if (!weatherForecast) return 0;

      let impact = 0;

      // Temperature impact
      if (weatherForecast.temp > 30) {
        impact -= 20; // High temperature reduces attendance
      } else if (weatherForecast.temp < 5) {
        impact -= 15; // Low temperature affects attendance
      }

      // Precipitation impact
      if (weatherForecast.precipitation > 0) {
        impact -= 30; // Rain significantly reduces attendance
      }

      // Wind impact
      if (weatherForecast.wind_speed > 20) {
        impact -= 10; // High winds affect attendance
      }

      return impact;
    } catch (error) {
      console.error('Error getting weather impact:', error);
      return 0;
    }
  }

  private async getEventScheduleImpact(timestamp: Date): Promise<number> {
    try {
      const { data: event } = await supabase
        .from('events')
        .select('start_time, end_time, doors_open_time')
        .eq('id', this.eventId)
        .single();

      if (!event) return 0;

      const startTime = new Date(event.start_time);
      const endTime = new Date(event.end_time);
      const doorsOpenTime = event.doors_open_time ? new Date(event.doors_open_time) : null;

      const timeDiff = timestamp.getTime() - startTime.getTime();
      const eventDuration = endTime.getTime() - startTime.getTime();
      const progress = timeDiff / eventDuration;

      // Peak attendance typically occurs 30-60 minutes after start
      if (progress >= 0.1 && progress <= 0.3) {
        return 100; // Peak attendance period
      } else if (progress >= 0.8) {
        return -50; // Event winding down
      }

      return 0;
    } catch (error) {
      console.error('Error getting event schedule impact:', error);
      return 0;
    }
  }

  private async getHistoricalPatternImpact(timestamp: Date): Promise<number> {
    try {
      const patterns = await this.patternEngine.analyzeIncidentPatterns();
      const hour = timestamp.getHours();
      const timeSlot = this.getTimeSlot(hour);

      const matchingPatterns = patterns.filter(p => p.timeOfDay === timeSlot);
      
      if (matchingPatterns.length === 0) return 0;

      // Use historical patterns to adjust prediction
      const avgIncidentCount = matchingPatterns.reduce((sum, p) => sum + p.incidentCount, 0) / matchingPatterns.length;
      
      // Higher incident rates might indicate higher attendance
      return avgIncidentCount * 10;
    } catch (error) {
      console.error('Error getting historical pattern impact:', error);
      return 0;
    }
  }

  private async getCurrentTrendImpact(): Promise<number> {
    try {
      const { data: recentAttendance } = await supabase
        .from('attendance_records')
        .select('attendance_count, recorded_at')
        .eq('event_id', this.eventId)
        .gte('recorded_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Last 2 hours
        .order('recorded_at', { ascending: true });

      if (!recentAttendance || recentAttendance.length < 2) return 0;

      // Calculate trend
      const firstCount = recentAttendance[0].attendance_count;
      const lastCount = recentAttendance[recentAttendance.length - 1].attendance_count;
      const timeDiff = (recentAttendance[recentAttendance.length - 1].recorded_at - recentAttendance[0].recorded_at) / (1000 * 60 * 60); // hours

      const trendRate = (lastCount - firstCount) / timeDiff;
      
      // Project trend forward 1 hour
      return trendRate;
    } catch (error) {
      console.error('Error getting current trend impact:', error);
      return 0;
    }
  }

  private calculatePredictionConfidence(timestamp: Date): number {
    try {
      const timeFromNow = (timestamp.getTime() - Date.now()) / (1000 * 60 * 60); // hours
      
      // Confidence decreases with time
      if (timeFromNow <= 1) return 0.9;
      if (timeFromNow <= 2) return 0.8;
      if (timeFromNow <= 3) return 0.7;
      return 0.6;
    } catch (error) {
      console.error('Error calculating prediction confidence:', error);
      return 0.5;
    }
  }

  private calculateEntryRates(records: any[]): number[] {
    const rates: number[] = [];
    
    for (let i = 1; i < records.length; i++) {
      const timeDiff = (new Date(records[i].recorded_at).getTime() - new Date(records[i-1].recorded_at).getTime()) / (1000 * 60); // minutes
      const attendanceDiff = records[i].attendance_count - records[i-1].attendance_count;
      const rate = attendanceDiff / timeDiff; // people per minute
      rates.push(rate);
    }

    return rates;
  }

  private calculateWeatherImpact(records: any[]): number {
    const weatherConditions = records.map(r => r.weather_conditions).filter(Boolean);
    
    if (weatherConditions.length === 0) return 0;

    // Calculate average impact based on weather conditions
    const impacts = weatherConditions.map(condition => {
      switch (condition.toLowerCase()) {
        case 'rain': return -0.3;
        case 'snow': return -0.4;
        case 'storm': return -0.5;
        case 'sunny': return 0.1;
        default: return 0;
      }
    });

    return impacts.reduce((sum, impact) => sum + impact, 0) / impacts.length;
  }

  private async calculateEventTypeImpact(): Promise<number> {
    try {
      const { data: event } = await supabase
        .from('events')
        .select('event_type')
        .eq('id', this.eventId)
        .single();

      if (!event?.event_type) return 0;

      // Different event types have different entry patterns
      const eventTypeImpacts = {
        'concert': 0.2,
        'sports': 0.1,
        'conference': -0.1,
        'festival': 0.3,
        'exhibition': 0.0
      };

      return eventTypeImpacts[event.event_type as keyof typeof eventTypeImpacts] || 0;
    } catch (error) {
      console.error('Error calculating event type impact:', error);
      return 0;
    }
  }

  private analyzeLocationMovement(incidents: any[], fromLocation: string, toLocation: string): CrowdMovementPattern | null {
    const fromIncidents = incidents.filter(i => i.location === fromLocation);
    const toIncidents = incidents.filter(i => i.location === toLocation);

    if (fromIncidents.length === 0 || toIncidents.length === 0) return null;

    // Calculate movement rate based on incident timing
    const movementRate = this.calculateMovementRate(fromIncidents, toIncidents);
    
    if (movementRate === 0) return null;

    return {
      fromLocation,
      toLocation,
      movementRate,
      timeOfDay: this.getTimeSlot(new Date(fromIncidents[0].created_at).getHours()),
      eventPhase: this.getEventPhase(new Date(fromIncidents[0].created_at))
    };
  }

  private calculateMovementRate(fromIncidents: any[], toIncidents: any[]): number {
    // Simple heuristic: if incidents in destination location follow incidents in source location
    // within a reasonable time window, assume movement occurred
    let movementCount = 0;
    const timeWindow = 30 * 60 * 1000; // 30 minutes

    for (const fromIncident of fromIncidents) {
      const fromTime = new Date(fromIncident.created_at).getTime();
      
      for (const toIncident of toIncidents) {
        const toTime = new Date(toIncident.created_at).getTime();
        
        if (toTime > fromTime && toTime - fromTime <= timeWindow) {
          movementCount++;
          break;
        }
      }
    }

    return movementCount / fromIncidents.length;
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 24) return 'evening';
    return 'night';
  }

  private getEventPhase(timestamp: Date): string {
    // Simplified event phase detection
    const hour = timestamp.getHours();
    
    if (hour < 12) return 'early';
    if (hour < 18) return 'peak';
    return 'late';
  }

  private getDefaultEntryPatterns(): EntryPattern[] {
    return [
      { timeSlot: 'morning', averageEntryRate: 20, peakEntryRate: 40, weatherImpact: 0, eventTypeImpact: 0 },
      { timeSlot: 'afternoon', averageEntryRate: 30, peakEntryRate: 60, weatherImpact: 0, eventTypeImpact: 0 },
      { timeSlot: 'evening', averageEntryRate: 25, peakEntryRate: 50, weatherImpact: 0, eventTypeImpact: 0 },
      { timeSlot: 'night', averageEntryRate: 10, peakEntryRate: 20, weatherImpact: 0, eventTypeImpact: 0 }
    ];
  }

  private getDefaultOccupancyForecast(): OccupancyForecast {
    return {
      timeIntervals: [],
      peakTime: new Date(),
      peakOccupancy: 0,
      capacityWarnings: [],
      confidence: 0.5
    };
  }

  private getDefaultPrediction(timestamp: Date): CrowdFlowPrediction {
    return {
      timestamp,
      predictedCount: 0,
      confidence: 0.5,
      factors: {
        weather: 0,
        eventSchedule: 0,
        historicalPattern: 0,
        currentTrend: 0
      }
    };
  }

  // Additional methods for API endpoints
  async getCurrentOccupancy(): Promise<number> {
    try {
      const { data: latestRecord } = await supabase
        .from('attendance_records')
        .select('attendance_count')
        .eq('event_id', this.eventId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      return latestRecord?.attendance_count || 0;
    } catch (error) {
      console.error('Error getting current occupancy:', error);
      return 0;
    }
  }

  async getVenueZoneAnalysis(): Promise<any[]> {
    try {
      // Mock venue zones - in a real implementation, this would be based on venue layout
      const zones = [
        { name: 'Main Arena', currentOccupancy: 0, predictedPeak: 0, riskLevel: 'low' as const, recommendations: [] },
        { name: 'Food Court', currentOccupancy: 0, predictedPeak: 0, riskLevel: 'low' as const, recommendations: [] },
        { name: 'Parking Area', currentOccupancy: 0, predictedPeak: 0, riskLevel: 'low' as const, recommendations: [] },
        { name: 'Entry Gates', currentOccupancy: 0, predictedPeak: 0, riskLevel: 'low' as const, recommendations: [] }
      ];

      // Get current occupancy for each zone
      const currentOccupancy = await this.getCurrentOccupancy();
      const predictions = await this.predictCrowdFlow();

      // Update zones with real data
      zones.forEach(zone => {
        zone.currentOccupancy = Math.floor(currentOccupancy / zones.length);
        zone.predictedPeak = predictions.length > 0 ? 
          Math.floor(Math.max(...predictions.map(p => p.predictedCount)) / zones.length) : 0;
        
        // Calculate risk level based on occupancy
        const occupancyRate = zone.currentOccupancy / 100; // Assuming 100 is max per zone
        if (occupancyRate > 0.8) zone.riskLevel = 'high';
        else if (occupancyRate > 0.5) zone.riskLevel = 'medium';
        else zone.riskLevel = 'low';

        // Add recommendations based on risk level
        if (zone.riskLevel === 'high') {
          zone.recommendations.push('Increase security presence');
          zone.recommendations.push('Monitor crowd flow closely');
        } else if (zone.riskLevel === 'medium') {
          zone.recommendations.push('Regular monitoring');
        }
      });

      return zones;
    } catch (error) {
      console.error('Error getting venue zone analysis:', error);
      return [];
    }
  }
}
