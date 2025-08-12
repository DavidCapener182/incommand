import { supabase } from './supabase';
import { RiskScoringEngine, RiskScore } from './riskScoring';
import { PatternRecognitionEngine } from './patternRecognition';
import { getWeatherData } from '../services/weatherService';

export interface PredictiveAlert {
  id: string;
  alertType: 'weather' | 'crowd' | 'risk' | 'incident';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  recommendations: string[];
  timestamp: Date;
  expiresAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  confidence: number;
}

export interface WeatherAlert {
  condition: string;
  change: string;
  impact: string;
  recommendations: string[];
  severity: 'info' | 'warning' | 'critical';
}

export interface CrowdAlert {
  currentDensity: number;
  predictedDensity: number;
  threshold: number;
  timeToThreshold: number;
  recommendations: string[];
  severity: 'info' | 'warning' | 'critical';
}

export interface RiskAlert {
  riskScore: number;
  threshold: number;
  contributingFactors: string[];
  recommendations: string[];
  severity: 'info' | 'warning' | 'critical';
}

export class PredictiveAlertSystem {
  private eventId: string;
  private riskEngine: RiskScoringEngine;
  private patternEngine: PatternRecognitionEngine;
  private alertThresholds: {
    weather: { [key: string]: number };
    crowd: { warning: number; critical: number };
    risk: { warning: number; critical: number };
  };

  constructor(eventId: string) {
    this.eventId = eventId;
    this.riskEngine = new RiskScoringEngine(eventId);
    this.patternEngine = new PatternRecognitionEngine(eventId);
    
    // Configure alert thresholds
    this.alertThresholds = {
      weather: {
        temperature_drop: 5, // °C
        temperature_rise: 8, // °C
        rain_start: 0.1, // mm
        wind_increase: 10, // km/h
        humidity_rise: 20 // %
      },
      crowd: {
        warning: 75, // % capacity
        critical: 90 // % capacity
      },
      risk: {
        warning: 60, // risk score
        critical: 80 // risk score
      }
    };
  }

  async monitorWeatherAlerts(): Promise<WeatherAlert[]> {
    try {
      const weatherData = await getWeatherData(51.5074, -0.1278); // Default to London coordinates
      if (!weatherData) {
        return [];
      }

      const currentWeather = weatherData;
      const hourlyForecast = [weatherData]; // For now, use current weather as forecast

      const alerts: WeatherAlert[] = [];

      // Check for temperature changes
      const tempAlerts = this.checkTemperatureAlerts(currentWeather, hourlyForecast);
      alerts.push(...tempAlerts);

      // Check for precipitation changes
      const precipAlerts = this.checkPrecipitationAlerts(currentWeather, hourlyForecast);
      alerts.push(...precipAlerts);

      // Check for wind changes
      const windAlerts = this.checkWindAlerts(currentWeather, hourlyForecast);
      alerts.push(...windAlerts);

      // Check for humidity changes
      const humidityAlerts = this.checkHumidityAlerts(currentWeather, hourlyForecast);
      alerts.push(...humidityAlerts);

      return alerts;
    } catch (error) {
      console.error('Error monitoring weather alerts:', error);
      return [];
    }
  }

  async monitorCrowdDensityAlerts(): Promise<CrowdAlert[]> {
    try {
      const { data: event } = await supabase
        .from('events')
        .select('current_attendance, max_capacity')
        .eq('id', this.eventId)
        .single();

      if (!event) return [];

      const currentDensity = (event.current_attendance || 0) / (event.max_capacity || 1) * 100;
      const alerts: CrowdAlert[] = [];

      // Check current density against thresholds
      if (currentDensity >= this.alertThresholds.crowd.critical) {
        alerts.push({
          currentDensity,
          predictedDensity: currentDensity,
          threshold: this.alertThresholds.crowd.critical,
          timeToThreshold: 0,
          recommendations: [
            'Immediately activate crowd control measures',
            'Deploy additional security staff',
            'Consider temporary venue closure',
            'Monitor for potential incidents'
          ],
          severity: 'critical'
        });
      } else if (currentDensity >= this.alertThresholds.crowd.warning) {
        alerts.push({
          currentDensity,
          predictedDensity: currentDensity,
          threshold: this.alertThresholds.crowd.warning,
          timeToThreshold: 0,
          recommendations: [
            'Prepare crowd control measures',
            'Increase security presence',
            'Monitor entry rates',
            'Prepare for potential capacity issues'
          ],
          severity: 'warning'
        });
      }

      // Predict future density based on entry patterns
      const predictedDensity = await this.predictCrowdDensity();
      if (predictedDensity > this.alertThresholds.crowd.warning) {
        const timeToThreshold = this.calculateTimeToThreshold(currentDensity, predictedDensity);
        
        alerts.push({
          currentDensity,
          predictedDensity,
          threshold: this.alertThresholds.crowd.warning,
          timeToThreshold,
          recommendations: [
            'Prepare for increased crowd density',
            'Deploy additional staff in advance',
            'Monitor entry patterns',
            'Consider crowd flow management'
          ],
          severity: predictedDensity > this.alertThresholds.crowd.critical ? 'critical' : 'warning'
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error monitoring crowd density alerts:', error);
      return [];
    }
  }

  async checkRiskThresholds(): Promise<RiskAlert[]> {
    try {
      const riskScore = await this.riskEngine.calculateOverallRiskScore();
      const alerts: RiskAlert[] = [];

      if (riskScore.overallScore >= this.alertThresholds.risk.critical) {
        alerts.push({
          riskScore: riskScore.overallScore,
          threshold: this.alertThresholds.risk.critical,
          contributingFactors: riskScore.contributingFactors.map(f => 
            `${f.factorType}: ${f.factorValue.condition || f.factorValue.densityRange || f.factorValue.timeSlot || f.factorValue.location}`
          ),
          recommendations: [
            'Activate emergency response protocols',
            'Deploy maximum security and medical staff',
            'Consider event modification or early closure',
            'Monitor all high-risk areas closely'
          ],
          severity: 'critical'
        });
      } else if (riskScore.overallScore >= this.alertThresholds.risk.warning) {
        alerts.push({
          riskScore: riskScore.overallScore,
          threshold: this.alertThresholds.risk.warning,
          contributingFactors: riskScore.contributingFactors.map(f => 
            `${f.factorType}: ${f.factorValue.condition || f.factorValue.densityRange || f.factorValue.timeSlot || f.factorValue.location}`
          ),
          recommendations: [
            'Increase security presence',
            'Deploy additional medical staff',
            'Monitor high-risk areas',
            'Prepare for potential incidents'
          ],
          severity: 'warning'
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error checking risk thresholds:', error);
      return [];
    }
  }

  async generateProactiveAlerts(): Promise<PredictiveAlert[]> {
    try {
      const alerts: PredictiveAlert[] = [];

      // Weather alerts
      const weatherAlerts = await this.monitorWeatherAlerts();
      for (const alert of weatherAlerts) {
        alerts.push({
          id: `weather-${Date.now()}-${Math.random()}`,
          alertType: 'weather',
          severity: alert.severity,
          message: `Weather Alert: ${alert.condition} - ${alert.change}`,
          recommendations: alert.recommendations,
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
          acknowledged: false,
          confidence: 0.8
        });
      }

      // Crowd density alerts
      const crowdAlerts = await this.monitorCrowdDensityAlerts();
      for (const alert of crowdAlerts) {
        alerts.push({
          id: `crowd-${Date.now()}-${Math.random()}`,
          alertType: 'crowd',
          severity: alert.severity,
          message: `Crowd Alert: Current density ${alert.currentDensity.toFixed(1)}%${alert.timeToThreshold > 0 ? `, predicted ${alert.predictedDensity.toFixed(1)}% in ${alert.timeToThreshold} minutes` : ''}`,
          recommendations: alert.recommendations,
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          acknowledged: false,
          confidence: 0.9
        });
      }

      // Risk alerts
      const riskAlerts = await this.checkRiskThresholds();
      for (const alert of riskAlerts) {
        alerts.push({
          id: `risk-${Date.now()}-${Math.random()}`,
          alertType: 'risk',
          severity: alert.severity,
          message: `Risk Alert: Overall risk score ${alert.riskScore.toFixed(1)}%`,
          recommendations: alert.recommendations,
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          acknowledged: false,
          confidence: 0.85
        });
      }

      // Store alerts in database
      await this.storeAlerts(alerts);

      return alerts;
    } catch (error) {
      console.error('Error generating proactive alerts:', error);
      return [];
    }
  }

  async prioritizeAlerts(alerts: PredictiveAlert[]): Promise<PredictiveAlert[]> {
    // Sort by severity, then by confidence, then by timestamp
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 3, warning: 2, info: 1 };
      const aSeverity = severityOrder[a.severity];
      const bSeverity = severityOrder[b.severity];

      if (aSeverity !== bSeverity) {
        return bSeverity - aSeverity;
      }

      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }

      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }

  async sendPredictiveNotifications(alerts: PredictiveAlert[]): Promise<void> {
    try {
      const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged);
      
      for (const alert of criticalAlerts) {
        // Send push notification
        await this.sendPushNotification(alert);
        
        // Send to notification system
        await this.sendToNotificationSystem(alert);
      }
    } catch (error) {
      console.error('Error sending predictive notifications:', error);
    }
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('predictive_alerts')
        .update({
          acknowledged: true,
          acknowledged_by: userId,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  }

  async getActiveAlerts(): Promise<PredictiveAlert[]> {
    try {
      const { data: alerts, error } = await supabase
        .from('predictive_alerts')
        .select('*')
        .eq('event_id', this.eventId)
        .eq('acknowledged', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (alerts || []).map(alert => ({
        id: alert.id,
        alertType: alert.alert_type,
        severity: alert.severity,
        message: alert.message,
        recommendations: alert.recommendations || [],
        timestamp: new Date(alert.created_at),
        expiresAt: new Date(alert.expires_at),
        acknowledged: alert.acknowledged,
        acknowledgedBy: alert.acknowledged_by,
        acknowledgedAt: alert.acknowledged_at ? new Date(alert.acknowledged_at) : undefined,
        confidence: 0.8 // Default confidence
      }));
    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  // Private helper methods
  private checkTemperatureAlerts(currentWeather: any, hourlyForecast: any[]): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const currentTemp = currentWeather.temp;

    for (const forecast of hourlyForecast) {
      const tempChange = forecast.temp - currentTemp;
      
      if (Math.abs(tempChange) >= this.alertThresholds.weather.temperature_drop) {
        const isDrop = tempChange < 0;
        alerts.push({
          condition: 'Temperature',
          change: `${isDrop ? 'Drop' : 'Rise'} of ${Math.abs(tempChange).toFixed(1)}°C`,
          impact: isDrop ? 'May affect crowd comfort and increase medical incidents' : 'May cause heat-related incidents',
          recommendations: isDrop ? [
            'Prepare for increased medical incidents',
            'Ensure warm areas are available',
            'Monitor crowd comfort levels'
          ] : [
            'Deploy additional medical staff',
            'Ensure adequate hydration stations',
            'Monitor for heat-related incidents'
          ],
          severity: Math.abs(tempChange) > 10 ? 'critical' : 'warning'
        });
        break; // Only alert for first significant change
      }
    }

    return alerts;
  }

  private checkPrecipitationAlerts(currentWeather: any, hourlyForecast: any[]): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const currentPrecip = currentWeather.precipitation || 0;

    for (const forecast of hourlyForecast) {
      const precipChange = (forecast.precipitation || 0) - currentPrecip;
      
      if (precipChange > this.alertThresholds.weather.rain_start) {
        alerts.push({
          condition: 'Precipitation',
          change: `Rain starting with ${precipChange.toFixed(1)}mm`,
          impact: 'May cause slip/fall incidents and affect crowd movement',
          recommendations: [
            'Deploy additional medical staff',
            'Ensure slip-resistant surfaces',
            'Monitor high-traffic areas',
            'Prepare for weather-related incidents'
          ],
          severity: precipChange > 5 ? 'critical' : 'warning'
        });
        break;
      }
    }

    return alerts;
  }

  private checkWindAlerts(currentWeather: any, hourlyForecast: any[]): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const currentWind = currentWeather.wind_speed || 0;

    for (const forecast of hourlyForecast) {
      const windChange = (forecast.wind_speed || 0) - currentWind;
      
      if (windChange > this.alertThresholds.weather.wind_increase) {
        alerts.push({
          condition: 'Wind',
          change: `Wind speed increasing by ${windChange.toFixed(1)} km/h`,
          impact: 'May cause technical issues and affect outdoor activities',
          recommendations: [
            'Secure loose equipment and structures',
            'Monitor technical systems',
            'Prepare for wind-related incidents',
            'Consider indoor alternatives for outdoor activities'
          ],
          severity: windChange > 20 ? 'critical' : 'warning'
        });
        break;
      }
    }

    return alerts;
  }

  private checkHumidityAlerts(currentWeather: any, hourlyForecast: any[]): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const currentHumidity = currentWeather.humidity || 0;

    for (const forecast of hourlyForecast) {
      const humidityChange = (forecast.humidity || 0) - currentHumidity;
      
      if (humidityChange > this.alertThresholds.weather.humidity_rise) {
        alerts.push({
          condition: 'Humidity',
          change: `Humidity increasing by ${humidityChange.toFixed(1)}%`,
          impact: 'May affect crowd comfort and increase medical incidents',
          recommendations: [
            'Ensure adequate ventilation',
            'Monitor crowd comfort levels',
            'Prepare for humidity-related incidents'
          ],
          severity: humidityChange > 30 ? 'critical' : 'warning'
        });
        break;
      }
    }

    return alerts;
  }

  private async predictCrowdDensity(): Promise<number> {
    try {
      // Simple prediction based on current trends
      const { data: attendanceHistory } = await supabase
        .from('attendance_records')
        .select('attendance_count, recorded_at')
        .eq('event_id', this.eventId)
        .gte('recorded_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Last 2 hours
        .order('recorded_at', { ascending: true });

      if (!attendanceHistory || attendanceHistory.length < 2) {
        return 0;
      }

      // Calculate rate of change
      const recentRecords = attendanceHistory.slice(-3);
      const rateOfChange = (recentRecords[recentRecords.length - 1].attendance_count - recentRecords[0].attendance_count) / recentRecords.length;

      // Predict next hour
      const currentAttendance = recentRecords[recentRecords.length - 1].attendance_count;
      const predictedAttendance = currentAttendance + (rateOfChange * 4); // 4 time periods ahead

      const { data: event } = await supabase
        .from('events')
        .select('max_capacity')
        .eq('id', this.eventId)
        .single();

      return (predictedAttendance / (event?.max_capacity || 1)) * 100;
    } catch (error) {
      console.error('Error predicting crowd density:', error);
      return 0;
    }
  }

  private calculateTimeToThreshold(currentDensity: number, predictedDensity: number): number {
    if (predictedDensity <= currentDensity) return 0;
    
    const densityIncrease = predictedDensity - currentDensity;
    const timeToReach = (densityIncrease / 10) * 60; // Rough estimate: 10% per hour
    
    return Math.max(0, Math.min(timeToReach, 240)); // Cap at 4 hours
  }

  private async storeAlerts(alerts: PredictiveAlert[]): Promise<void> {
    try {
      const alertData = alerts.map(alert => ({
        event_id: this.eventId,
        alert_type: alert.alertType,
        severity: alert.severity,
        message: alert.message,
        recommendations: alert.recommendations,
        expires_at: alert.expiresAt.toISOString()
      }));

      const { error } = await supabase
        .from('predictive_alerts')
        .insert(alertData);

      if (error) throw error;
    } catch (error) {
      console.error('Error storing alerts:', error);
    }
  }

  private async sendPushNotification(alert: PredictiveAlert): Promise<void> {
    try {
      // This would integrate with your existing push notification system
      console.log('Sending push notification for alert:', alert.id);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  private async sendToNotificationSystem(alert: PredictiveAlert): Promise<void> {
    try {
      // This would integrate with your existing notification system
      console.log('Sending to notification system for alert:', alert.id);
    } catch (error) {
      console.error('Error sending to notification system:', error);
    }
  }
}
