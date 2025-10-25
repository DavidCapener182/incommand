import { supabase } from './supabase';
import { logger } from './logger';

export interface CrowdFlowPrediction {
  id: string;
  timestamp: Date;
  location: string;
  currentDensity: number;
  predictedDensity: number;
  predictedCount: number;
  confidence: number;
  factors: CrowdFactor[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface CrowdFactor {
  type: 'entry_rate' | 'exit_rate' | 'weather' | 'event_phase' | 'capacity' | 'staffing';
  value: number;
  weight: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface OccupancyForecast {
  timeHorizon: string;
  peakTime: Date | null;
  peakOccupancy: number;
  averageOccupancy: number;
  capacityUtilization: number;
  riskPeriods: RiskPeriod[];
  confidence: number;
  capacityWarnings?: any[];
}

export interface RiskPeriod {
  startTime: Date;
  endTime: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  recommendations: string[];
}

export interface DensityZone {
  zoneId: string;
  name: string;
  currentOccupancy: number;
  maxCapacity: number;
  densityPercentage: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: Date;
  predictedPeak: number;
  recommendations: string[];
}

export class CrowdFlowPredictionEngine {
  private eventId: string;
  private predictions: CrowdFlowPrediction[] = [];
  private forecasts: OccupancyForecast[] = [];
  private densityZones: DensityZone[] = [];

  constructor(eventId: string) {
    this.eventId = eventId;
  }

  async predictCrowdFlow(): Promise<CrowdFlowPrediction[]> {
    try {
      logger.info('Starting crowd flow prediction', { eventId: this.eventId });

      // Fetch attendance data
      const { data: attendanceRecords, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('event_id', this.eventId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      if (!attendanceRecords || attendanceRecords.length === 0) {
        logger.info('No attendance data found for crowd flow prediction', { eventId: this.eventId });
        return [];
      }

      // Get event details for capacity information
      const { data: event } = await supabase
        .from('events')
        .select('max_capacity, current_attendance')
        .eq('id', this.eventId)
        .single();

      if (!event) {
        throw new Error('Event not found');
      }

      const maxCapacity = event.max_capacity || 1000;
      const predictions: CrowdFlowPrediction[] = [];

      // Analyze entry and exit patterns
      const entryExitPatterns = this.analyzeEntryExitPatterns(attendanceRecords);
      
      // Predict density for different time periods
      const timeSlots = this.generateTimeSlots();
      
      for (const timeSlot of timeSlots) {
        const prediction = await this.predictDensityForTimeSlot(
          timeSlot,
          attendanceRecords,
          entryExitPatterns,
          maxCapacity
        );
        
        if (prediction) {
          predictions.push(prediction);
        }
      }

      // Store predictions
      await this.saveCrowdPredictions(predictions);
      
      this.predictions = predictions;
      return predictions;

    } catch (error) {
      logger.error('Error predicting crowd flow', { error, eventId: this.eventId });
      throw error;
    }
  }

  async calculateOccupancyForecast(): Promise<OccupancyForecast | null> {
    try {
      if (this.predictions.length === 0) {
        await this.predictCrowdFlow();
      }

      const currentTime = new Date();
      const timeHorizon = 'Next 4 Hours';
      
      // Find peak occupancy
      const peakPrediction = this.predictions.reduce((peak, current) => 
        current.predictedDensity > peak.predictedDensity ? current : peak
      );

      const averageOccupancy = this.predictions.reduce((sum, pred) => 
        sum + pred.predictedDensity, 0
      ) / this.predictions.length;

      const maxCapacity = 1000; // This should come from event data
      const capacityUtilization = (peakPrediction.predictedDensity / maxCapacity) * 100;

      // Identify risk periods
      const riskPeriods = this.identifyRiskPeriods(this.predictions);

      const forecast: OccupancyForecast = {
        timeHorizon,
        peakTime: peakPrediction.timestamp,
        peakOccupancy: peakPrediction.predictedDensity,
        averageOccupancy: Math.round(averageOccupancy),
        capacityUtilization: Math.round(capacityUtilization),
        riskPeriods,
        confidence: this.calculateForecastConfidence(),
        capacityWarnings: []
      };

      this.forecasts = [forecast];
      return forecast;

    } catch (error) {
      logger.error('Error calculating occupancy forecast', { error, eventId: this.eventId });
      return null;
    }
  }

  async monitorDensityZones(): Promise<DensityZone[]> {
    try {
      // Simulate density zone monitoring
      // In a real implementation, this would use IoT sensors or manual counts
      
      const zones: DensityZone[] = [
        {
          zoneId: 'main-entrance',
          name: 'Main Entrance',
          currentOccupancy: 150,
          maxCapacity: 200,
          densityPercentage: 75,
          riskLevel: 'medium',
          lastUpdated: new Date(),
          predictedPeak: 180,
          recommendations: ['Increase monitoring', 'Optimize entry flow']
        },
        {
          zoneId: 'main-bar',
          name: 'Main Bar Area',
          currentOccupancy: 180,
          maxCapacity: 150,
          densityPercentage: 120,
          riskLevel: 'critical',
          lastUpdated: new Date(),
          predictedPeak: 190,
          recommendations: ['Deploy additional staff', 'Redirect patrons']
        },
        {
          zoneId: 'dance-floor',
          name: 'Dance Floor',
          currentOccupancy: 200,
          maxCapacity: 300,
          densityPercentage: 67,
          riskLevel: 'low',
          lastUpdated: new Date(),
          predictedPeak: 220,
          recommendations: ['Monitor crowd flow']
        },
        {
          zoneId: 'seating-area',
          name: 'Seating Area',
          currentOccupancy: 80,
          maxCapacity: 120,
          densityPercentage: 67,
          riskLevel: 'low',
          lastUpdated: new Date(),
          predictedPeak: 100,
          recommendations: ['Maintain current staffing']
        },
        {
          zoneId: 'exit-area',
          name: 'Exit Area',
          currentOccupancy: 30,
          maxCapacity: 100,
          densityPercentage: 30,
          riskLevel: 'low',
          lastUpdated: new Date(),
          predictedPeak: 60,
          recommendations: ['Ensure clear pathways']
        }
      ];

      this.densityZones = zones;
      return zones;

    } catch (error) {
      logger.error('Error monitoring density zones', { error, eventId: this.eventId });
      return [];
    }
  }

  async getHighRiskZones(): Promise<DensityZone[]> {
    const zones = await this.monitorDensityZones();
    return zones.filter(zone => 
      zone.riskLevel === 'high' || zone.riskLevel === 'critical'
    );
  }

  async getDensityTrends(): Promise<{ zone: string; trend: 'increasing' | 'decreasing' | 'stable' }[]> {
    const zones = await this.monitorDensityZones();
    
    return zones.map(zone => {
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      
      if (zone.densityPercentage > 90) {
        trend = 'increasing';
      } else if (zone.densityPercentage < 30) {
        trend = 'decreasing';
      }
      
      return { zone: zone.name, trend };
    });
  }

  private analyzeEntryExitPatterns(attendanceRecords: any[]): any {
    const patterns = {
      entryRate: 0,
      exitRate: 0,
      peakEntryTime: null as Date | null,
      peakExitTime: null as Date | null
    };

    if (attendanceRecords.length < 2) return patterns;

    // Calculate entry and exit rates
    let totalEntry = 0;
    let totalExit = 0;
    let maxEntryRate = 0;
    let maxExitRate = 0;

    for (let i = 1; i < attendanceRecords.length; i++) {
      const current = attendanceRecords[i];
      const previous = attendanceRecords[i - 1];
      
      const timeDiff = new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      const attendanceChange = current.count - previous.count;
      
      if (attendanceChange > 0) {
        const entryRate = attendanceChange / minutesDiff;
        totalEntry += attendanceChange;
        
        if (entryRate > maxEntryRate) {
          maxEntryRate = entryRate;
          patterns.peakEntryTime = new Date(current.timestamp);
        }
      } else if (attendanceChange < 0) {
        const exitRate = Math.abs(attendanceChange) / minutesDiff;
        totalExit += Math.abs(attendanceChange);
        
        if (exitRate > maxExitRate) {
          maxExitRate = exitRate;
          patterns.peakExitTime = new Date(current.timestamp);
        }
      }
    }

    patterns.entryRate = maxEntryRate;
    patterns.exitRate = maxExitRate;

    return patterns;
  }

  private generateTimeSlots(): Date[] {
    const slots: Date[] = [];
    const now = new Date();
    
    // Generate time slots for the next 4 hours, every 30 minutes
    for (let i = 0; i < 8; i++) {
      const slot = new Date(now.getTime() + (i * 30 * 60 * 1000));
      slots.push(slot);
    }
    
    return slots;
  }

  private async predictDensityForTimeSlot(
    timeSlot: Date,
    attendanceRecords: any[],
    entryExitPatterns: any,
    maxCapacity: number
  ): Promise<CrowdFlowPrediction | null> {
    try {
      // Get current attendance
      const currentAttendance = attendanceRecords.length > 0 
        ? attendanceRecords[attendanceRecords.length - 1].count 
        : 0;

      // Calculate time difference from now
      const timeDiff = timeSlot.getTime() - new Date().getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // Predict density based on patterns
      let predictedDensity = currentAttendance;
      
      if (hoursDiff > 0) {
        // Predict future density
        const entryContribution = entryExitPatterns.entryRate * hoursDiff * 0.7; // Reduce rate over time
        const exitContribution = entryExitPatterns.exitRate * hoursDiff * 0.3;
        
        predictedDensity = Math.max(0, Math.min(maxCapacity, 
          currentAttendance + entryContribution - exitContribution
        ));
      }

      // Calculate factors
      const factors: CrowdFactor[] = [
        {
          type: 'entry_rate',
          value: entryExitPatterns.entryRate,
          weight: 0.4,
          trend: entryExitPatterns.entryRate > 10 ? 'increasing' : 'stable'
        },
        {
          type: 'exit_rate',
          value: entryExitPatterns.exitRate,
          weight: 0.3,
          trend: entryExitPatterns.exitRate > 5 ? 'increasing' : 'stable'
        },
        {
          type: 'capacity',
          value: maxCapacity,
          weight: 0.2,
          trend: 'stable'
        },
        {
          type: 'event_phase',
          value: this.getEventPhase(timeSlot),
          weight: 0.1,
          trend: 'stable'
        }
      ];

      // Calculate risk level
      const densityPercentage = (predictedDensity / maxCapacity) * 100;
      const riskLevel = this.calculateRiskLevel(densityPercentage);

      // Generate recommendations
      const recommendations = this.generateRecommendations(riskLevel, densityPercentage);

      // Calculate confidence
      const confidence = this.calculatePredictionConfidence(attendanceRecords.length, hoursDiff);

      return {
        id: `crowd-${timeSlot.getTime()}`,
        timestamp: timeSlot,
        location: 'Overall Venue',
        currentDensity: currentAttendance,
        predictedDensity: Math.round(predictedDensity),
        predictedCount: Math.round(predictedDensity),
        confidence,
        factors,
        riskLevel,
        recommendations
      };

    } catch (error) {
      logger.error('Error predicting density for time slot', { error, timeSlot });
      return null;
    }
  }

  private getEventPhase(timeSlot: Date): number {
    // Simulate event phase (0-100%)
    const hour = timeSlot.getHours();
    
    if (hour < 18) return 25; // Early
    if (hour < 20) return 50; // Building
    if (hour < 22) return 75; // Peak
    if (hour < 24) return 90; // Late peak
    return 100; // Ending
  }

  private calculateRiskLevel(densityPercentage: number): 'low' | 'medium' | 'high' | 'critical' {
    if (densityPercentage >= 95) return 'critical';
    if (densityPercentage >= 85) return 'high';
    if (densityPercentage >= 70) return 'medium';
    return 'low';
  }

  private generateRecommendations(
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
    densityPercentage: number
  ): string[] {
    const recommendations: string[] = [];

    switch (riskLevel) {
      case 'critical':
        recommendations.push(
          'Immediately activate emergency crowd control measures',
          'Deploy maximum security and medical staff',
          'Consider temporary venue closure',
          'Implement one-way flow systems',
          'Monitor all exits and emergency routes'
        );
        break;
      case 'high':
        recommendations.push(
          'Increase security presence',
          'Deploy additional medical staff',
          'Implement crowd flow management',
          'Monitor high-density areas closely',
          'Prepare for potential incidents'
        );
        break;
      case 'medium':
        recommendations.push(
          'Maintain current staffing levels',
          'Monitor crowd flow',
          'Prepare for potential increases',
          'Ensure adequate signage'
        );
        break;
      case 'low':
        recommendations.push(
          'Continue normal operations',
          'Monitor for changes in patterns',
          'Maintain standard safety protocols'
        );
        break;
    }

    return recommendations;
  }

  private calculatePredictionConfidence(attendanceRecordsCount: number, hoursAhead: number): number {
    let baseConfidence = 0.8;
    
    // Reduce confidence based on data availability
    if (attendanceRecordsCount < 10) {
      baseConfidence -= 0.2;
    } else if (attendanceRecordsCount < 20) {
      baseConfidence -= 0.1;
    }
    
    // Reduce confidence based on prediction distance
    if (hoursAhead > 2) {
      baseConfidence -= 0.1;
    }
    if (hoursAhead > 4) {
      baseConfidence -= 0.2;
    }
    
    return Math.max(0.3, Math.min(1, baseConfidence));
  }

  private calculateForecastConfidence(): number {
    if (this.predictions.length === 0) return 0.5;
    
    const avgConfidence = this.predictions.reduce((sum, pred) => 
      sum + pred.confidence, 0
    ) / this.predictions.length;
    
    return Math.round(avgConfidence * 100);
  }

  private identifyRiskPeriods(predictions: CrowdFlowPrediction[]): RiskPeriod[] {
    const riskPeriods: RiskPeriod[] = [];
    
    for (let i = 0; i < predictions.length - 1; i++) {
      const current = predictions[i];
      const next = predictions[i + 1];
      
      if (current.riskLevel === 'high' || current.riskLevel === 'critical') {
        const startTime = current.timestamp;
        const endTime = next.timestamp;
        
        riskPeriods.push({
          startTime,
          endTime,
          riskLevel: current.riskLevel,
          reason: `Predicted density: ${current.predictedDensity} (${Math.round((current.predictedDensity / 1000) * 100)}% capacity)`,
          recommendations: current.recommendations
        });
      }
    }
    
    return riskPeriods;
  }

  private async saveCrowdPredictions(predictions: CrowdFlowPrediction[]): Promise<void> {
    try {
      const predictionData = predictions.map(prediction => ({
        event_id: this.eventId,
        timestamp: prediction.timestamp.toISOString(),
        location: prediction.location,
        current_density: prediction.currentDensity,
        predicted_density: prediction.predictedDensity,
        confidence: prediction.confidence,
        factors: prediction.factors,
        risk_level: prediction.riskLevel,
        recommendations: prediction.recommendations
      }));

      const { error } = await supabase
        .from('crowd_predictions')
        .upsert(predictionData as any);

      if (error) throw error;

      logger.info('Stored crowd predictions', { 
        eventId: this.eventId, 
        predictionCount: predictions.length 
      });

    } catch (error) {
      logger.error('Error storing crowd predictions', { error, eventId: this.eventId });
      throw error;
    }
  }

  async storeCrowdPredictions(predictions: CrowdFlowPrediction[]): Promise<void> {
    return this.saveCrowdPredictions(predictions);
  }

  async getPredictions(): Promise<CrowdFlowPrediction[]> {
    return this.predictions;
  }

  async getForecasts(): Promise<OccupancyForecast[]> {
    return this.forecasts;
  }

  async getDensityZones(): Promise<DensityZone[]> {
    return this.densityZones;
  }

  async getCurrentOccupancy(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('current_attendance')
        .eq('id', this.eventId)
        .single();

      if (error) throw error;
      return data?.current_attendance || 0;
    } catch (error) {
      logger.error('Error getting current occupancy', { error, eventId: this.eventId });
      return 0;
    }
  }

  async getVenueZoneAnalysis(): Promise<DensityZone[]> {
    try {
      return await this.monitorDensityZones();
    } catch (error) {
      logger.error('Error getting venue zone analysis', { error, eventId: this.eventId });
      return [];
    }
  }

  async getLatestPrediction(): Promise<CrowdFlowPrediction | null> {
    if (this.predictions.length === 0) return null;
    
    return this.predictions.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    );
  }

  async getRiskAlerts(): Promise<CrowdFlowPrediction[]> {
    return this.predictions.filter(prediction => 
      prediction.riskLevel === 'high' || prediction.riskLevel === 'critical'
    );
  }
}
