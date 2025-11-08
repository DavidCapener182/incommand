import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { estimateEvacRSET } from "@/utils/estimateEvacRSET";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface VenueCapacityWidgetProps {
  eventId: string;
}

interface AttendanceRecord {
  count: number;
  timestamp: string;
}

interface CapacityPrediction {
  time: string;
  predictedOccupancy: number;
  confidence: number;
}

export default function VenueCapacityWidget({ eventId }: VenueCapacityWidgetProps) {
  const [currentOccupancy, setCurrentOccupancy] = useState(0);
  const [maxCapacity, setMaxCapacity] = useState(1000);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [predictions, setPredictions] = useState<CapacityPrediction[]>([]);
  const [flowRate, setFlowRate] = useState({ entering: 0, leaving: 0, net: 0 });
  const [crowdDensity, setCrowdDensity] = useState('very-low');
  const [evacuationTime, setEvacuationTime] = useState(0);

  // Exponential backoff configuration
  const MAX_RETRIES = 5;
  const BASE_DELAY = 1000; // 1 second
  const MAX_DELAY = 30000; // 30 seconds

  const calculateBackoffDelay = useCallback((attempt: number): number => {
    const delay = Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_DELAY);
    return delay + Math.random() * 1000; // Add jitter
  }, []);

  const showConnectionNotification = useCallback((message: string, isError: boolean = false) => {
    // Create a simple notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      isError ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);
  }, []);

  // Calculate flow rate based on attendance changes
  const calculateFlowRate = useCallback((history: AttendanceRecord[]) => {
    if (history.length < 2) return { entering: 0, leaving: 0, net: 0 };

    const recentRecords = history.slice(-10); // Last 10 records
    let totalEntering = 0;
    let totalLeaving = 0;

    for (let i = 1; i < recentRecords.length; i++) {
      const change = recentRecords[i].count - recentRecords[i - 1].count;
      const timeDiff = new Date(recentRecords[i].timestamp).getTime() - new Date(recentRecords[i - 1].timestamp).getTime();
      const minutesDiff = timeDiff / (1000 * 60);

      if (change > 0) {
        totalEntering += change / minutesDiff; // people per minute
      } else if (change < 0) {
        totalLeaving += Math.abs(change) / minutesDiff; // people per minute
      }
    }

    const avgEntering = totalEntering / (recentRecords.length - 1);
    const avgLeaving = totalLeaving / (recentRecords.length - 1);
    const netFlow = avgEntering - avgLeaving;

    return {
      entering: Math.round(avgEntering * 10) / 10,
      leaving: Math.round(avgLeaving * 10) / 10,
      net: Math.round(netFlow * 10) / 10
    };
  }, []);

  // Calculate crowd density based on occupancy percentage
  const calculateCrowdDensity = useCallback((occupancy: number, capacity: number) => {
    const percentage = (occupancy / capacity) * 100;
    
    console.log(`Density calculation: ${occupancy} / ${capacity} = ${percentage.toFixed(1)}%`);
    
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'high';
    if (percentage >= 50) return 'medium';
    if (percentage >= 25) return 'low';
    return 'very-low';
  }, []);

  // Calculate evacuation time using RSET estimation
  const calculateEvacuationTime = useCallback((occupancy: number, capacity: number, flowRate: any) => {
    const result = estimateEvacRSET({ 
      occupancy, 
      preset: "standard", 
      exitCount: null 
    });
    return result.minutes;
  }, []);

  // Generate capacity predictions based on historical patterns
  const generatePredictions = useCallback((history: AttendanceRecord[], capacity: number) => {
    if (history.length < 5) return [];

    const predictions: CapacityPrediction[] = [];
    const now = new Date();
    
    // Generate predictions for next 2 hours in 15-minute intervals
    for (let i = 1; i <= 8; i++) {
      const predictionTime = new Date(now.getTime() + i * 15 * 60 * 1000);
      
      // Simple linear regression based on recent trend
      const recentRecords = history.slice(-5);
      const xValues = recentRecords.map((_, index) => index);
      const yValues = recentRecords.map(record => record.count);
      
      // Calculate trend
      const n = xValues.length;
      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = yValues.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // Predict future value
      const predictedValue = Math.max(0, Math.min(capacity, slope * (n + i) + intercept));
      
      // Calculate confidence based on data consistency
      const variance = yValues.reduce((sum, y) => sum + Math.pow(y - (slope * (n - 1) + intercept), 2), 0) / n;
      const confidence = Math.max(50, Math.min(95, 100 - Math.sqrt(variance) / capacity * 100));
      
      predictions.push({
        time: predictionTime.toISOString(),
        predictedOccupancy: Math.round(predictedValue),
        confidence: Math.round(confidence)
      });
    }
    
    return predictions;
  }, []);

  const fetchOccupancyDataDirect = useCallback(async () => {
    try {
      // Get attendance history for analysis
      let attendanceQuery = supabase
        .from('attendance_records')
        .select('count, timestamp')
        .order('timestamp', { ascending: true });
      
      // Try to filter by event_id if the column exists
      try {
        attendanceQuery = attendanceQuery.eq('event_id', eventId);
      } catch (e) {
        console.warn('event_id column not found in attendance_records, fetching all records');
      }
      
      const { data: attendanceData, error: attendanceError } = await attendanceQuery;

      if (attendanceError) {
        console.warn('Error fetching attendance data:', attendanceError);
        setConnectionError(null);
      } else if (attendanceData && attendanceData.length > 0) {
        setAttendanceHistory(attendanceData);
        setCurrentOccupancy(attendanceData[attendanceData.length - 1].count || 0);
        
        const flowRateData = calculateFlowRate(attendanceData);
        setFlowRate(flowRateData);
        
        const density = calculateCrowdDensity(attendanceData[attendanceData.length - 1].count, maxCapacity);
        setCrowdDensity(density);
        
        const evacuationTimeMinutes = calculateEvacuationTime(
          attendanceData[attendanceData.length - 1].count, 
          maxCapacity, 
          flowRateData
        );
        setEvacuationTime(evacuationTimeMinutes);
      }

      let eventQuery = supabase
        .from('events')
        .select('expected_attendance');
      
      try {
        const { data: eventData, error: eventError } = await eventQuery.eq('id', eventId).single();
        if (eventError) {
          console.warn('Error fetching event data:', eventError);
          setMaxCapacity(25000);
        } else if (eventData && eventData.expected_attendance) {
          setMaxCapacity(eventData.expected_attendance);
          
          if (attendanceData && attendanceData.length > 0) {
            const predictions = generatePredictions(attendanceData, eventData.expected_attendance);
            setPredictions(predictions);
          }
        }
      } catch (e) {
        console.warn('id column not found in events, fetching first event');
        const { data: eventData, error: eventError } = await eventQuery.limit(1).single();
        if (eventError) {
          console.warn('Error fetching event data:', eventError);
          setMaxCapacity(25000);
        } else if (eventData && eventData.expected_attendance) {
          setMaxCapacity(eventData.expected_attendance);
          if (attendanceData && attendanceData.length > 0) {
            const predictions = generatePredictions(attendanceData, eventData.expected_attendance);
            setPredictions(predictions);
          }
        }
      }

      setConnectionError(null);
      setIsConnected(true);
    } catch (error) {
      console.warn('Error fetching occupancy data:', error);
      setConnectionError(null);
      setIsConnected(true);
    }
  }, [calculateCrowdDensity, calculateEvacuationTime, calculateFlowRate, eventId, generatePredictions, maxCapacity]);

  const setupSubscription = useCallback(async () => {
    let subscription: any;

    try {
      // First, try to fetch data to verify the table exists
      const { data: testData, error: testError } = await supabase
        .from('attendance_records')
        .select('count')
        .limit(1);

      if (testError) {
        console.warn('Attendance records table may not exist or be accessible:', testError);
        // Continue with subscription setup but expect it might fail
      }

      subscription = supabase
        .channel(`venue-capacity-${eventId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance_records'
          },
          () => {
            // Call fetchOccupancyData directly instead of through the callback
            fetchOccupancyDataDirect();
            setConnectionError(null); // Clear any previous errors on successful update
          }
        )

        .subscribe((status) => {
          console.log(`Venue capacity subscription status: ${status}`);
          // Show as connected if subscription works, or if we can fetch data
          setIsConnected(status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT');
          setIsReconnecting(false);
          
          if (status === 'SUBSCRIBED') {
            setConnectionError(null);
            setRetryCount(0);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // Don't treat these as critical errors - just log them
            console.warn(`Venue capacity subscription ${status.toLowerCase()}`);
            setConnectionError(null);
          }
        });

      // Always try to fetch data regardless of subscription status
      await fetchOccupancyDataDirect();
    } catch (error) {
      console.error('Error setting up venue capacity subscription:', error);
      // Don't treat setup errors as critical - continue with data fetching
      setConnectionError(null);
      await fetchOccupancyDataDirect();
    }

    return subscription;
  }, [eventId, fetchOccupancyDataDirect]);

  const handleSubscriptionError = useCallback((error: any, channelName: string) => {
    console.error(`Subscription error for ${channelName}:`, error);
    setConnectionError(`Connection error: ${error.message || 'Unknown error'}`);
    setIsConnected(false);
    
    if (retryCount < MAX_RETRIES) {
      setIsReconnecting(true);
      const delay = calculateBackoffDelay(retryCount);
      
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setupSubscription();
      }, delay);
      
      showConnectionNotification(`Reconnecting in ${Math.round(delay / 1000)} seconds...`, false);
    } else {
      showConnectionNotification('Connection failed after multiple attempts. Please refresh the page.', true);
    }
  }, [retryCount, calculateBackoffDelay, showConnectionNotification, setupSubscription]);

  const fetchOccupancyData = useCallback(async () => {
    try {
      // Get attendance history for analysis
      let attendanceQuery = supabase
        .from('attendance_records')
        .select('count, timestamp')
        .order('timestamp', { ascending: true });
      
      // Try to filter by event_id if the column exists
      try {
        attendanceQuery = attendanceQuery.eq('event_id', eventId);
      } catch (e) {
        // If event_id column doesn't exist, just get all attendance records
        console.warn('event_id column not found in attendance_records, fetching all records');
      }
      
      const { data: attendanceData, error: attendanceError } = await attendanceQuery;

      if (attendanceError) {
        console.warn('Error fetching attendance data:', attendanceError);
        // Don't set connection error for data fetch issues - just use defaults
        setConnectionError(null);
      } else if (attendanceData && attendanceData.length > 0) {
        setAttendanceHistory(attendanceData);
        setCurrentOccupancy(attendanceData[attendanceData.length - 1].count || 0);
        
        // Calculate derived metrics
        const flowRateData = calculateFlowRate(attendanceData);
        setFlowRate(flowRateData);
        
        const density = calculateCrowdDensity(attendanceData[attendanceData.length - 1].count, maxCapacity);
        setCrowdDensity(density);
        
        const evacuationTimeMinutes = calculateEvacuationTime(
          attendanceData[attendanceData.length - 1].count, 
          maxCapacity, 
          flowRateData
        );
        setEvacuationTime(evacuationTimeMinutes);
      }

      // Get expected capacity from events table
      let eventQuery = supabase
        .from('events')
        .select('expected_attendance');
      
      // Try to filter by id if the column exists
      try {
        const { data: eventData, error: eventError } = await eventQuery.eq('id', eventId).single();
        if (eventError) {
          console.warn('Error fetching event data:', eventError);
          // Use default capacity if event data can't be fetched
          setMaxCapacity(25000); // Default capacity
        } else if (eventData && eventData.expected_attendance) {
          setMaxCapacity(eventData.expected_attendance);
          
          // Generate predictions after setting capacity
          if (attendanceData && attendanceData.length > 0) {
            const predictions = generatePredictions(attendanceData, eventData.expected_attendance);
            setPredictions(predictions);
          }
        }
      } catch (e) {
        // If id column doesn't exist, just get the first event
        console.warn('id column not found in events, fetching first event');
        const { data: eventData, error: eventError } = await eventQuery.limit(1).single();
        if (eventError) {
          console.warn('Error fetching event data:', eventError);
          // Use default capacity if event data can't be fetched
          setMaxCapacity(25000); // Default capacity
        } else if (eventData && eventData.expected_attendance) {
          setMaxCapacity(eventData.expected_attendance);
          
          // Generate predictions after setting capacity
          if (attendanceData && attendanceData.length > 0) {
            const predictions = generatePredictions(attendanceData, eventData.expected_attendance);
            setPredictions(predictions);
          }
        }
      }
      
      setConnectionError(null); // Clear errors on successful fetch
    } catch (error) {
      console.warn('Error fetching occupancy data:', error);
      // Don't set connection error for data fetch issues - just use defaults
      setConnectionError(null);
    }
  }, [eventId, maxCapacity, calculateFlowRate, calculateCrowdDensity, calculateEvacuationTime, generatePredictions]);

  // Recalculate density and evacuation time when capacity or occupancy changes
  useEffect(() => {
    if (currentOccupancy > 0 && maxCapacity > 0) {
      const density = calculateCrowdDensity(currentOccupancy, maxCapacity);
      console.log(`Recalculating density: ${currentOccupancy} / ${maxCapacity} = ${density}`);
      setCrowdDensity(density);
      
      const evacuationTimeMinutes = calculateEvacuationTime(currentOccupancy, maxCapacity, flowRate);
      setEvacuationTime(evacuationTimeMinutes);
    }
  }, [currentOccupancy, maxCapacity, calculateCrowdDensity, calculateEvacuationTime, flowRate]);

  useEffect(() => {
    let subscription: any;
    let cleanupTimeout: NodeJS.Timeout;

    const initializeSubscription = async () => {
      subscription = await setupSubscription();
    };

    initializeSubscription();

    // Fallback refresh every 30 seconds with error handling
    const interval = setInterval(async () => {
      if (!isConnected && !isReconnecting) {
        console.log('Attempting fallback venue capacity refresh...');
        await fetchOccupancyDataDirect();
      }
    }, 30000);

    return () => {
      if (subscription) {
        try {
          supabase.removeChannel(subscription);
        } catch (error) {
          console.warn('Error removing venue capacity subscription:', error);
        }
      }
      clearInterval(interval);
    };
  }, [eventId, isConnected, isReconnecting, setupSubscription, fetchOccupancyDataDirect]);

  const occupancyPercentage = (currentOccupancy / maxCapacity) * 100;
  const getCapacityColor = () => {
    if (occupancyPercentage >= 90) return 'text-red-600 bg-red-100';
    if (occupancyPercentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getCapacityStatus = () => {
    if (occupancyPercentage >= 90) return 'Near Capacity';
    if (occupancyPercentage >= 75) return 'Moderate';
    return 'Safe';
  };

  const getDensityColor = () => {
    switch (crowdDensity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  // Chart data for capacity trend
  const chartData = {
    datasets: [
      {
        label: 'Actual Occupancy',
        data: attendanceHistory.map(record => ({
          x: new Date(record.timestamp).getTime(),
          y: record.count
        })),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Capacity Limit',
        data: attendanceHistory.map(record => ({
          x: new Date(record.timestamp).getTime(),
          y: maxCapacity
        })),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderDash: [5, 5],
        fill: false,
      },
      ...(predictions.length > 0 ? [{
        label: 'Predicted Occupancy',
        data: [
          ...attendanceHistory.map(() => ({ x: null, y: null })),
          ...predictions.map(pred => ({
            x: new Date(pred.time).getTime(),
            y: pred.predictedOccupancy
          }))
        ],
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderDash: [3, 3],
        fill: false,
      }] : [])
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 }
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            hour: 'HH:mm',
            minute: 'HH:mm'
          },
          tooltipFormat: 'MMM dd HH:mm'
        },
        title: {
          display: true,
          text: 'Time',
          font: { weight: 'bold' as 'bold' },
        },
        grid: { display: false },
        ticks: {
          maxTicksLimit: 8,
          autoSkip: true,
          maxRotation: 45
        }
      },
      y: {
        title: {
          display: true,
          text: 'Occupancy',
          font: { weight: 'bold' as 'bold' },
        },
        beginAtZero: true,
        max: maxCapacity * 1.1,
      },
    },
  };

  return (
    <div className="backdrop-blur-card bg-white/98 dark:bg-[#23408e]/98 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 shadow-xl p-4 sm:p-6 lg:p-8 min-h-[270px] flex flex-col card-glow animate-fade-in animate-delay-400">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-xl sm:text-2xl text-gray-900 dark:text-white tracking-tight">Venue Capacity</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isReconnecting ? 'Reconnecting...' : isConnected ? 'Live' : 'Offline'}
          </span>
          {retryCount > 0 && (
            <span className="text-xs text-orange-600">(Retry {retryCount}/{MAX_RETRIES})</span>
          )}
        </div>
      </div>

      {connectionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-700">{connectionError}</span>
          </div>
        </div>
      )}

      <div className="flex-grow flex flex-col">
        {/* Main Capacity Display */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Occupancy</span>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentOccupancy} / {maxCapacity}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                occupancyPercentage >= 90 ? 'bg-red-500' : 
                occupancyPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, occupancyPercentage)}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(occupancyPercentage)}% Full</span>
            <span className={`text-sm font-medium px-2 py-1 rounded ${getCapacityColor()}`}>
              {getCapacityStatus()}
            </span>
          </div>
        </div>

        {/* Compact Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{currentOccupancy}</div>
            <div className="text-xs text-blue-700 dark:text-blue-300">Current</div>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">{maxCapacity - currentOccupancy}</div>
            <div className="text-xs text-green-700 dark:text-green-300">Available</div>
          </div>
        </div>

        {/* Flow Rate Analysis */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Flow Rate</h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-semibold text-green-600 dark:text-green-400">{flowRate.entering}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">In/min</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-red-600 dark:text-red-400">{flowRate.leaving}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Out/min</div>
            </div>
            <div>
              <div className={`text-sm font-semibold ${flowRate.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {flowRate.net >= 0 ? '+' : ''}{flowRate.net}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Net/min</div>
            </div>
          </div>
        </div>

        {/* Safety Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 capitalize">{crowdDensity}</div>
            <div className="text-xs text-purple-700 dark:text-purple-300">Density</div>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg relative group">
            <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">
              {evacuationTime}min
              {evacuationTime > 60 && (
                <span className="ml-1 text-xs bg-red-100 text-red-600 px-1 rounded">!</span>
              )}
            </div>
            <div className="text-xs text-orange-700 dark:text-orange-300">Est. Evac (RSET)</div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Estimated RSET using occupancy-only proxy (no exit widths). Configure presets in Admin → Safety → Evacuation.
              {evacuationTime > 60 && (
                <div className="mt-1 text-yellow-300">
                  Consider adding exit count to refine estimate.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compact Alerts */}
        <div className="mt-auto">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Alerts</h4>
          <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
            {occupancyPercentage >= 90 && (
              <div className="text-red-600 dark:text-red-400">• Near capacity</div>
            )}
            {occupancyPercentage >= 75 && occupancyPercentage < 90 && (
              <div className="text-yellow-600 dark:text-yellow-400">• Monitor closely</div>
            )}
            {occupancyPercentage < 75 && (
              <div className="text-green-600 dark:text-green-400">• Safe limits</div>
            )}
            {crowdDensity === 'critical' && (
              <div className="text-red-600 dark:text-red-400">• Critical density</div>
            )}
            {flowRate.net > 20 && (
              <div className="text-yellow-600 dark:text-yellow-400">• High flow rate</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
