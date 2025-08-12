import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { RiskScoringEngine, RiskScore, LocationRiskScore, IncidentTypeRisk } from '../lib/riskScoring';
import { PatternRecognitionEngine } from '../lib/patternRecognition';
import { PredictiveAlertSystem, PredictiveAlert } from '../lib/predictiveAlerts';
import { CrowdFlowPredictionEngine, CrowdFlowPrediction, OccupancyForecast } from '../lib/crowdFlowPrediction';

export interface PredictiveAnalyticsData {
  riskScores: {
    overall: RiskScore | null;
    locations: LocationRiskScore[];
    incidentTypes: IncidentTypeRisk[];
  };
  crowdPredictions: {
    flow: CrowdFlowPrediction[];
    forecast: OccupancyForecast | null;
  };
  alerts: PredictiveAlert[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface PredictionSummary {
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  topRiskFactors: string[];
  predictedPeakTime: Date | null;
  predictedPeakOccupancy: number;
  activeAlerts: number;
  criticalAlerts: number;
}

export const usePredictiveAnalytics = (eventId: string, refreshInterval: number = 300000) => {
  const [data, setData] = useState<PredictiveAnalyticsData>({
    riskScores: {
      overall: null,
      locations: [],
      incidentTypes: []
    },
    crowdPredictions: {
      flow: [],
      forecast: null
    },
    alerts: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  const [isSubscribed, setIsSubscribed] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const subscriptionRef = useRef<any>();

  // Initialize engines
  const riskEngine = useRef(new RiskScoringEngine(eventId));
  const patternEngine = useRef(new PatternRecognitionEngine(eventId));
  const alertSystem = useRef(new PredictiveAlertSystem(eventId));
  const crowdEngine = useRef(new CrowdFlowPredictionEngine(eventId));

  const fetchPredictiveData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch all predictive data in parallel
      const [
        overallRisk,
        locationRisks,
        incidentTypeRisks,
        crowdFlow,
        occupancyForecast,
        alerts
      ] = await Promise.all([
        riskEngine.current.calculateOverallRiskScore(),
        riskEngine.current.getLocationSpecificRiskScores(),
        riskEngine.current.getIncidentTypeRiskScores(),
        crowdEngine.current.predictCrowdFlow(),
        crowdEngine.current.calculateOccupancyForecast(),
        alertSystem.current.getActiveAlerts()
      ]);

      setData(prev => ({
        ...prev,
        riskScores: {
          overall: overallRisk,
          locations: locationRisks,
          incidentTypes: incidentTypeRisks
        },
        crowdPredictions: {
          flow: crowdFlow,
          forecast: occupancyForecast
        },
        alerts,
        loading: false,
        lastUpdated: new Date()
      }));

      // Store predictions in database
      await crowdEngine.current.storeCrowdPredictions(crowdFlow);
    } catch (error) {
      console.error('Error fetching predictive data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch predictive data'
      }));
    }
  }, [eventId]);

  const refreshPredictions = useCallback(async () => {
    await fetchPredictiveData();
  }, [fetchPredictiveData]);

  const getPredictionSummary = useCallback((): PredictionSummary => {
    const { riskScores, crowdPredictions, alerts } = data;
    
    const overallRiskScore = riskScores.overall?.overallScore || 0;
    const overallRiskLevel = overallRiskScore < 30 ? 'low' : 
                            overallRiskScore < 60 ? 'medium' : 
                            overallRiskScore < 80 ? 'high' : 'critical';

    const topRiskFactors = riskScores.overall?.contributingFactors
      .slice(0, 3)
      .map(factor => `${factor.factorType}: ${factor.factorValue.condition || factor.factorValue.densityRange || factor.factorValue.timeSlot || factor.factorValue.location}`) || [];

    const predictedPeakTime = crowdPredictions.forecast?.peakTime || null;
    const predictedPeakOccupancy = crowdPredictions.forecast?.peakOccupancy || 0;
    
    const activeAlerts = alerts.length;
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;

    return {
      overallRiskLevel,
      riskScore: overallRiskScore,
      topRiskFactors,
      predictedPeakTime,
      predictedPeakOccupancy,
      activeAlerts,
      criticalAlerts
    };
  }, [data]);

  const setupRealTimeSubscriptions = useCallback(() => {
    if (isSubscribed) return;

    try {
      // Subscribe to incident logs changes
      const incidentSubscription = supabase
        .channel('incident_logs_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'incident_logs',
            filter: `event_id=eq.${eventId}`
          },
          () => {
            // Refresh predictions when incidents change
            refreshPredictions();
          }
        )
        .subscribe();

      // Subscribe to attendance records changes
      const attendanceSubscription = supabase
        .channel('attendance_records_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance_records',
            filter: `event_id=eq.${eventId}`
          },
          () => {
            // Refresh predictions when attendance changes
            refreshPredictions();
          }
        )
        .subscribe();

      // Subscribe to predictive alerts changes
      const alertSubscription = supabase
        .channel('predictive_alerts_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'predictive_alerts',
            filter: `event_id=eq.${eventId}`
          },
          () => {
            // Refresh alerts when new ones are created
            alertSystem.current.getActiveAlerts().then(alerts => {
              setData(prev => ({ ...prev, alerts }));
            });
          }
        )
        .subscribe();

      subscriptionRef.current = {
        incident: incidentSubscription,
        attendance: attendanceSubscription,
        alert: alertSubscription
      };

      setIsSubscribed(true);
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
    }
  }, [eventId, isSubscribed, refreshPredictions]);

  const cleanupSubscriptions = useCallback(() => {
    if (subscriptionRef.current) {
      Object.values(subscriptionRef.current).forEach((subscription: any) => {
        subscription?.unsubscribe();
      });
      subscriptionRef.current = undefined;
    }
    setIsSubscribed(false);
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string, userId: string) => {
    try {
      await alertSystem.current.acknowledgeAlert(alertId, userId);
      
      // Update local state
      setData(prev => ({
        ...prev,
        alerts: prev.alerts.filter(alert => alert.id !== alertId)
      }));
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  }, []);

  const generateNewAlerts = useCallback(async () => {
    try {
      const newAlerts = await alertSystem.current.generateProactiveAlerts();
      
      if (newAlerts.length > 0) {
        setData(prev => ({
          ...prev,
          alerts: [...prev.alerts, ...newAlerts]
        }));
      }
    } catch (error) {
      console.error('Error generating new alerts:', error);
    }
  }, []);

  // Setup periodic refresh
  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        refreshPredictions();
        scheduleRefresh(); // Schedule next refresh
      }, refreshInterval);
    };

    scheduleRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [refreshPredictions, refreshInterval]);

  // Initial data fetch and subscription setup
  useEffect(() => {
    fetchPredictiveData();
    setupRealTimeSubscriptions();

    return () => {
      cleanupSubscriptions();
    };
  }, [eventId, fetchPredictiveData, setupRealTimeSubscriptions, cleanupSubscriptions]);

  // Generate alerts periodically
  useEffect(() => {
    const alertInterval = setInterval(() => {
      generateNewAlerts();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(alertInterval);
  }, [generateNewAlerts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSubscriptions();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [cleanupSubscriptions]);

  return {
    data,
    refreshPredictions,
    getPredictionSummary,
    acknowledgeAlert,
    generateNewAlerts,
    isSubscribed
  };
};

// Configuration options for the hook
export interface PredictiveAnalyticsConfig {
  refreshInterval?: number; // milliseconds
  enableRealTime?: boolean;
  alertGenerationInterval?: number; // milliseconds
  maxRetries?: number;
  retryDelay?: number; // milliseconds
}

export const usePredictiveAnalyticsWithConfig = (
  eventId: string,
  config: PredictiveAnalyticsConfig = {}
) => {
  const {
    refreshInterval = 300000, // 5 minutes
    enableRealTime = true,
    alertGenerationInterval = 300000, // 5 minutes
    maxRetries = 3,
    retryDelay = 1000
  } = config;

  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const {
    data,
    refreshPredictions,
    getPredictionSummary,
    acknowledgeAlert,
    generateNewAlerts,
    isSubscribed
  } = usePredictiveAnalytics(eventId, refreshInterval);

  const retryFetch = useCallback(async () => {
    if (retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      await refreshPredictions();
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error(`Retry ${retryCount + 1} failed:`, error);
      
      if (retryCount + 1 < maxRetries) {
        setTimeout(() => {
          retryFetch();
        }, retryDelay);
      }
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, maxRetries, retryDelay, refreshPredictions]);

  // Enhanced error handling with retry
  useEffect(() => {
    if (data.error && !isRetrying && retryCount < maxRetries) {
      retryFetch();
    }
  }, [data.error, isRetrying, retryCount, maxRetries, retryFetch]);

  return {
    data: {
      ...data,
      isRetrying
    },
    refreshPredictions,
    getPredictionSummary,
    acknowledgeAlert,
    generateNewAlerts,
    isSubscribed,
    retryFetch,
    retryCount,
    isRetrying
  };
};
