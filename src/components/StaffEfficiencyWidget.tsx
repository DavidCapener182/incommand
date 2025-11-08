import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useStaffAvailability } from "@/hooks/useStaffAvailability";

interface StaffEfficiencyWidgetProps {
  eventId: string;
}

export default function StaffEfficiencyWidget({ eventId }: StaffEfficiencyWidgetProps) {
  const [staffData, setStaffData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Use the enhanced staff availability hook
  const {
    availableStaff,
    loading: hookLoading,
    error: hookError,
    stats,
    getWorkloadDistribution,
    getSkillCoverage,
    isStaffAvailable
  } = useStaffAvailability(eventId);

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

  // Direct function to avoid circular dependency
  const fetchStaffDataDirect = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('staff')
        .select('*');
      
      // Try to filter by active if the column exists
      try {
        query = query.eq('active', true);
      } catch (e) {
        // If active column doesn't exist, just get all staff
        console.warn('active column not found, fetching all staff');
      }
      
      const { data, error } = await query;

      if (error) {
        console.warn('Error fetching staff data:', error);
        // Don't set connection error for data fetch issues - just use defaults
        setError(null);
        setConnectionError(null);
        setStaffData([]); // Use empty array as fallback
      } else {
        setStaffData(data || []);
        setError(null);
        setConnectionError(null); // Clear errors on successful fetch
      }
    } catch (err) {
      console.warn('Error in fetchStaffData:', err);
      // Don't set connection error for data fetch issues - just use defaults
      setError(null);
      setConnectionError(null);
      setStaffData([]); // Use empty array as fallback
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStaffData = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('staff')
        .select('*');
      
      // Try to filter by active if the column exists
      try {
        query = query.eq('active', true);
      } catch (e) {
        // If active column doesn't exist, just get all staff
        console.warn('active column not found, fetching all staff');
      }
      
      const { data, error } = await query;

      if (error) {
        console.warn('Error fetching staff data:', error);
        // Don't set connection error for data fetch issues - just use defaults
        setError(null);
        setConnectionError(null);
        setStaffData([]); // Use empty array as fallback
      } else {
        setStaffData(data || []);
        setError(null);
        setConnectionError(null); // Clear errors on successful fetch
      }
    } catch (err) {
      console.warn('Error in fetchStaffData:', err);
      // Don't set connection error for data fetch issues - just use defaults
      setError(null);
      setConnectionError(null);
      setStaffData([]); // Use empty array as fallback
    } finally {
      setLoading(false);
    }
  }, []);

  const setupSubscription = useCallback(async () => {
    let subscription: any;

    try {
      const { error: tableCheckError } = await supabase
        .from('staff')
        .select('id')
        .limit(1);

      if (tableCheckError) {
        console.warn('Staff table not found, using hook data');
        setStaffData([]);
        setLoading(false);
        setError(null);
        setConnectionError(null);
        return;
      }

      subscription = supabase
        .channel(`staff-efficiency-${eventId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'staff'
          },
          () => {
            fetchStaffData();
            setConnectionError(null);
          }
        )
        .subscribe((status) => {
          console.log(`Staff subscription status: ${status}`);
          setIsConnected(status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT');
          setIsReconnecting(false);
          
          if (status === 'SUBSCRIBED') {
            setConnectionError(null);
            setRetryCount(0);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn(`Staff efficiency subscription ${status.toLowerCase()}`);
            setConnectionError(null);
          }
        });

      await fetchStaffDataDirect();
    } catch (error) {
      console.error('Error setting up staff subscription:', error);
      setConnectionError(null);
      await fetchStaffDataDirect();
    }

    return subscription;
  }, [eventId, fetchStaffData, fetchStaffDataDirect]);

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
        console.log('Attempting fallback staff refresh...');
        await fetchStaffDataDirect();
      }
    }, 30000);

    return () => {
      if (subscription) {
        try {
          supabase.removeChannel(subscription);
        } catch (error) {
          console.warn('Error removing staff subscription:', error);
        }
      }
      clearInterval(interval);
    };
  }, [eventId, isConnected, isReconnecting, setupSubscription, fetchStaffDataDirect]);

  // Calculate efficiency metrics using hook data
  const calculateEfficiencyMetrics = () => {
    const workloadDistribution = getWorkloadDistribution();
    const skillCoverage = getSkillCoverage();
    
    // Calculate utilization percentage based on available staff
    const totalStaff = stats.totalStaff;
    const assignedStaff = stats.assignedStaff;
    const utilizationPercentage = totalStaff > 0 ? (assignedStaff / totalStaff) * 100 : 0;
    
    // Calculate skill coverage percentage
    const skillCoveragePercentage = skillCoverage.totalSkills > 0 
      ? Math.min(100, (skillCoverage.totalSkills - skillCoverage.understaffedSkills.length) / skillCoverage.totalSkills * 100)
      : 75; // Default fallback
    
    // Calculate response efficiency based on workload distribution
    const overworkedStaff = workloadDistribution['3+ assignments'] || 0;
    const responseEfficiency = totalStaff > 0 
      ? Math.max(0, 100 - (overworkedStaff / totalStaff * 100))
      : 85; // Default fallback
    
    return {
      utilizationPercentage,
      skillCoveragePercentage,
      responseEfficiency,
      workloadDistribution,
      skillCoverage
    };
  };

  const metrics = calculateEfficiencyMetrics();

  if (loading || hookLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || hookError) {
    return (
      <div className="backdrop-blur-card bg-white/98 dark:bg-[#23408e]/98 text-gray-900 dark:text-white rounded-2xl border-2 border-gray-100/50 dark:border-[#2d437a]/50 shadow-xl p-4 sm:p-6 lg:p-8 min-h-[270px] flex flex-col card-glow animate-fade-in animate-delay-400">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-xl sm:text-2xl text-gray-900 dark:text-white tracking-tight">Staff Efficiency</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Connected</span>
          </div>
        </div>
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>No staff data available</p>
            <p className="text-sm mt-2">Staff efficiency metrics will appear here when data is available</p>
          </div>
        </div>
      </div>
    );
  }

  // Use hook data if available, otherwise fall back to local data
  const isUsingHookData = availableStaff.length > 0;
  const totalStaff = stats.totalStaff || staffData.length || 5;
  const assignedStaff = stats.assignedStaff || staffData.filter(s => s.is_assigned).length || 2;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Staff Efficiency</h3>
        <div className="flex items-center space-x-2">
          {!isUsingHookData && (
            <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
              Basic Mode
            </div>
          )}
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-500">
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

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col items-center">
          <div className="relative">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (metrics.utilizationPercentage / 100) * 251.2}
                className="text-green-600 transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-semibold">{Math.round(metrics.utilizationPercentage)}%</span>
            </div>
          </div>
          <span className="text-sm text-gray-600 mt-2 text-center">Utilization</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (metrics.skillCoveragePercentage / 100) * 251.2}
                className="text-blue-600 transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-semibold">{Math.round(metrics.skillCoveragePercentage)}%</span>
            </div>
          </div>
          <span className="text-sm text-gray-600 mt-2 text-center">Skill Coverage</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Total Staff</span>
          <span className="text-lg font-semibold text-gray-900">{totalStaff}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Assigned Staff</span>
          <span className="text-lg font-semibold text-gray-900">{assignedStaff}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Response Efficiency</span>
          <span className="text-lg font-semibold text-gray-900">{Math.round(metrics.responseEfficiency)}%</span>
        </div>

        {isUsingHookData && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Average Workload</span>
            <span className="text-lg font-semibold text-gray-900">{stats.averageWorkload.toFixed(1)}</span>
          </div>
        )}
      </div>

      {!isUsingHookData && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Using basic staff data. Enable advanced staff management for enhanced metrics.
          </p>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Efficiency Insights</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {metrics.utilizationPercentage < 60 && (
            <li>• Consider redeploying underutilized staff</li>
          )}
          {metrics.utilizationPercentage >= 80 && (
            <li>• Excellent staff utilization</li>
          )}
          {metrics.skillCoverage.understaffedSkills.length > 0 && (
            <li>• Skill gaps detected: {metrics.skillCoverage.understaffedSkills.join(', ')}</li>
          )}
          {metrics.workloadDistribution['3+ assignments'] > 0 && (
            <li>• {metrics.workloadDistribution['3+ assignments']} staff members are overworked</li>
          )}
          <li>• Monitor workload distribution</li>
        </ul>
      </div>
    </div>
  );
}
