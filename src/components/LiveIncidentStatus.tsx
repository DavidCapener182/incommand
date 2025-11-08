import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import PriorityBadge from './PriorityBadge'
import {
  getIncidentTypeStyle,
  getPriorityBorderClass,
  normalizePriority,
  type Priority,
} from '../utils/incidentStyles'
import { getIncidentTypeIcon } from '../utils/incidentIcons'

interface LiveIncidentStatusProps {
  eventId: string;
}

interface Incident {
  id: string;
  incident_type: string;
  status: string;
  priority?: string;
  occurrence?: string;
  timestamp: string;
  created_at?: string;
  is_closed: boolean;
}

export default function LiveIncidentStatus({ eventId }: LiveIncidentStatusProps) {
  const [currentIncident, setCurrentIncident] = useState<Incident | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

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
  const fetchLatestIncidentDirect = useCallback(async () => {
    try {
      // First, let's get all incidents to see what's available
      let query = supabase
        .from('incident_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      
      // Try to filter by event_id if the column exists
      try {
        query = query.eq('event_id', eventId);
      } catch (e) {
        // If event_id column doesn't exist, just get all incidents
        console.warn('event_id column not found, fetching all incidents');
      }
      
      const { data: allIncidents, error: allError } = await query;

      if (allError) {
        console.warn('Error fetching all incidents:', allError);
        // Don't set connection error for data fetch issues - just use defaults
        setConnectionError(null);
        setCurrentIncident(null);
        return;
      }

      console.log('All incidents for event:', allIncidents);

      // Filter out attendance and sit rep incidents like the analytics page does
      const filteredIncidents = allIncidents?.filter(
        (incident) => !['Attendance', 'Sit Rep', 'Timings'].includes(incident.incident_type)
      ) || [];

      console.log('Filtered incidents:', filteredIncidents);

      // Get the latest open incident
      const latestOpen = filteredIncidents.find(incident => 
        !incident.is_closed && incident.status !== 'Logged'
      );

      console.log('Latest open incident:', latestOpen);

      if (latestOpen) {
        setCurrentIncident({
          ...latestOpen,
          id: latestOpen.id.toString(),
          status: latestOpen.status || 'open'
        });
      } else {
        setCurrentIncident(null);
      }
      
      setConnectionError(null); // Clear errors on successful fetch
    } catch (error) {
      console.warn('Error in fetchLatestIncident:', error);
      // Don't set connection error for data fetch issues - just use defaults
      setConnectionError(null);
      setCurrentIncident(null);
    }
  }, [eventId]);

  const fetchLatestIncident = useCallback(async () => {
    try {
      // First, let's get all incidents to see what's available
      let query = supabase
        .from('incident_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      
      // Try to filter by event_id if the column exists
      try {
        query = query.eq('event_id', eventId);
      } catch (e) {
        // If event_id column doesn't exist, just get all incidents
        console.warn('event_id column not found, fetching all incidents');
      }
      
      const { data: allIncidents, error: allError } = await query;

      if (allError) {
        console.warn('Error fetching all incidents:', allError);
        // Don't set connection error for data fetch issues - just use defaults
        setConnectionError(null);
        setCurrentIncident(null);
        return;
      }

      console.log('All incidents for event:', allIncidents);

      // Filter out attendance and sit rep incidents like the analytics page does
      const filteredIncidents = allIncidents?.filter(
        (incident) => !['Attendance', 'Sit Rep', 'Timings'].includes(incident.incident_type)
      ) || [];

      console.log('Filtered incidents:', filteredIncidents);

      // Get the latest open incident
      const latestOpen = filteredIncidents.find(incident => 
        !incident.is_closed && incident.status !== 'Logged'
      );

      console.log('Latest open incident:', latestOpen);

      if (latestOpen) {
        setCurrentIncident({
          ...latestOpen,
          id: latestOpen.id.toString(),
          status: latestOpen.status || 'open'
        });
      } else {
        setCurrentIncident(null);
      }
      
      setConnectionError(null); // Clear errors on successful fetch
    } catch (error) {
      console.warn('Error in fetchLatestIncident:', error);
      // Don't set connection error for data fetch issues - just use defaults
      setConnectionError(null);
      setCurrentIncident(null);
    }
  }, [eventId]);

  const setupSubscription = useCallback(async () => {
    let subscription: any;

    try {
      // Subscribe to incident_logs changes with error handling
      subscription = supabase
        .channel(`incident-logs-${eventId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'incident_logs'
          },
          (payload) => {
            console.log('Incident update received:', payload);
            fetchLatestIncident();
            setLastUpdate(new Date());
            setConnectionError(null); // Clear any previous errors on successful update
          }
        )
        .subscribe((status) => {
          console.log(`Subscription status: ${status}`);
          // Show as connected if subscription works, or if we can fetch data
          setIsConnected(status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT');
          setIsReconnecting(false);
          
          if (status === 'SUBSCRIBED') {
            setConnectionError(null);
            setRetryCount(0);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // Don't treat these as critical errors - just log them
            console.warn(`Live incident subscription ${status.toLowerCase()}`);
            setConnectionError(null);
          }
        });

      // Always try to fetch data regardless of subscription status
      await fetchLatestIncidentDirect();
    } catch (error) {
      console.error('Error setting up subscription:', error);
      // Don't treat setup errors as critical - continue with data fetching
      setConnectionError(null);
      await fetchLatestIncidentDirect();
    }

    return subscription;
  }, [eventId, fetchLatestIncident, fetchLatestIncidentDirect]);

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
        console.log('Attempting fallback refresh...');
        await fetchLatestIncidentDirect();
      }
    }, 30000);

    return () => {
      if (subscription) {
        try {
          supabase.removeChannel(subscription);
        } catch (error) {
          console.warn('Error removing subscription:', error);
        }
      }
      clearInterval(interval);
    };
  }, [eventId, isConnected, isReconnecting, setupSubscription, fetchLatestIncidentDirect]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Debug logging
  useEffect(() => {
    if (currentIncident) {
      console.log('Current incident data:', currentIncident);
    }
  }, [currentIncident]);

  const isIncidentHighlighted = (incident: Incident | null) => {
    if (!incident) return false
    const status = String(incident.status ?? '').toLowerCase()
    const normalizedPriority = normalizePriority(incident.priority as Priority)
    const isHighPriority = normalizedPriority === 'high' || normalizedPriority === 'urgent'
    const isOpenStatus = !incident.is_closed && (status === 'open' || status === 'logged' || status === '')

    return isHighPriority && isOpenStatus
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Live Incident Status</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-500">
            {isReconnecting ? 'Reconnecting...' : isConnected ? 'Connected' : 'Disconnected'}
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

      {currentIncident ? (
        <div
          className={`space-y-4 rounded-xl border p-4 transition-shadow ${
            getPriorityBorderClass(currentIncident.priority as Priority)
          } ${
            isIncidentHighlighted(currentIncident)
              ? 'ring-2 ring-red-400 border-red-300 animate-pulse-border motion-reduce:animate-none shadow-md shadow-red-300/40'
              : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <PriorityBadge priority={currentIncident.priority} />
              <span className="text-sm text-gray-500">
                {formatTime(currentIncident.timestamp)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {(() => {
              const { icon: IncidentTypeIcon } = getIncidentTypeIcon(currentIncident.incident_type);
              return (
                <span className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-full ${getIncidentTypeStyle(currentIncident.incident_type)}`}>
                  <IncidentTypeIcon size={18} aria-hidden className="shrink-0" />
                  <span>{currentIncident.incident_type || 'Incident'}</span>
                </span>
              );
            })()}
          </div>

          <div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {currentIncident.occurrence || 'No details available'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span className="font-medium">Status: {currentIncident.status || 'Unknown'}</span>
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">All Clear</h4>
          <p className="text-sm text-gray-500">No active incidents at this time</p>
        </div>
      )}
    </div>
  );
}
