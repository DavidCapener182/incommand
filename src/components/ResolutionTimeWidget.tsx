'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';

interface ResolutionTimeWidgetProps {
  currentEventId?: string | null;
}

interface ResolutionStats {
  averageResolutionTime: number;
  totalClosedIncidents: number;
  fastestResolution: number;
  slowestResolution: number;
}

export default function ResolutionTimeWidget({ currentEventId }: ResolutionTimeWidgetProps) {
  const [stats, setStats] = useState<ResolutionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResolutionStats = useCallback(async () => {
    if (!currentEventId) {
      console.log('No currentEventId provided, skipping fetch');
      setLoading(false);
      setStats(null);
      return;
    }

    console.log('Fetching resolution stats for event:', currentEventId);

    try {
      setLoading(true);
      setError(null);

      // Fetch closed incidents for the current event
      const { data: incidents, error: fetchError } = await supabase
        .from('incident_logs')
        .select('timestamp, resolved_at, updated_at, incident_type')
        .eq('event_id', currentEventId)
        .eq('is_closed', true); // Get all closed incidents first

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError);
        throw new Error(`Failed to fetch incident data: ${fetchError.message}`);
      }

      // Filter out non-incident types in JavaScript
      const filteredIncidents = incidents?.filter(incident => 
        incident.incident_type && 
        !['Attendance', 'Sit Rep'].includes(incident.incident_type)
      ) || [];

      console.log('Fetched incidents for resolution time calculation:', {
        count: incidents?.length || 0,
        filteredCount: filteredIncidents.length,
        sample: filteredIncidents.slice(0, 2).map(inc => ({
          timestamp: inc.timestamp,
          resolved_at: inc.resolved_at,
          updated_at: inc.updated_at,
          incident_type: inc.incident_type
        }))
      });

      if (filteredIncidents.length === 0) {
        setStats({
          averageResolutionTime: 0,
          totalClosedIncidents: 0,
          fastestResolution: 0,
          slowestResolution: 0
        });
        setLoading(false);
        return;
      }

      // Calculate resolution times in minutes
      const resolutionTimes = filteredIncidents
        .map(incident => {
          const created = new Date(incident.timestamp);
          // Use resolved_at if available, otherwise fall back to updated_at
          const resolutionTimeValue = incident.resolved_at || incident.updated_at;
          
          if (!resolutionTimeValue) {
            console.warn('No resolution time found for incident:', incident);
            return null;
          }
          
          const resolved = new Date(resolutionTimeValue);
          
          // Validate dates
          if (isNaN(created.getTime()) || isNaN(resolved.getTime())) {
            console.warn('Invalid date found:', { timestamp: incident.timestamp, resolved_at: resolutionTimeValue });
            return null;
          }
          
          const timeDiff = Math.round((resolved.getTime() - created.getTime()) / (1000 * 60));
          return timeDiff;
        })
        .filter(time => time !== null && time >= 0) as number[]; // Filter out null and negative times

      if (resolutionTimes.length === 0) {
        console.log('No valid resolution times found, setting default stats');
        setStats({
          averageResolutionTime: 0,
          totalClosedIncidents: filteredIncidents.length, // Show filtered count
          fastestResolution: 0,
          slowestResolution: 0
        });
        setLoading(false);
        return;
      }

      console.log('Calculated resolution times:', {
        count: resolutionTimes.length,
        average: Math.round(resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length),
        fastest: Math.min(...resolutionTimes),
        slowest: Math.max(...resolutionTimes)
      });

      const totalClosedIncidents = resolutionTimes.length;
      const averageResolutionTime = Math.round(
        resolutionTimes.reduce((sum, time) => sum + time, 0) / totalClosedIncidents
      );
      const fastestResolution = Math.min(...resolutionTimes);
      const slowestResolution = Math.max(...resolutionTimes);

      setStats({
        averageResolutionTime,
        totalClosedIncidents,
        fastestResolution,
        slowestResolution
      });
    } catch (err) {
      console.error('Error fetching resolution stats:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      console.error('Full error details:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentEventId]);

  useEffect(() => {
    fetchResolutionStats();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchResolutionStats, 300000);
    return () => clearInterval(interval);
  }, [currentEventId, fetchResolutionStats]);

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    } else {
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
  };

  const getResolutionColor = (minutes: number): string => {
    if (minutes <= 30) return 'text-green-500';
    if (minutes <= 120) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="h-[130px] bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 p-3 flex flex-col justify-between animate-pulse">
        <div className="flex items-center justify-center">
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-600 rounded"></div>
          <div className="h-3 w-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[130px] bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 p-3 flex flex-col justify-between text-gray-900 dark:text-gray-100">
        <div className="flex items-center justify-center">
          <ClockIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{error}</p>
          <button
            onClick={fetchResolutionStats}
            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
          >
            Retry
          </button>
        </div>
        <div></div> {/* Spacer for consistent layout */}
      </div>
    );
  }

  if (!stats || stats.totalClosedIncidents === 0) {
    return (
      <div className="h-[130px] bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 p-3 flex flex-col justify-between text-gray-900 dark:text-gray-100">
        <div className="flex items-center justify-center">
          <ClockIcon className="w-4 h-4 text-gray-400 dark:text-gray-300" />
        </div>
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">Resolution Time</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {currentEventId ? 'No closed incidents yet' : 'No event selected'}
          </div>
        </div>
        <div></div> {/* Spacer for consistent layout */}
      </div>
    );
  }

  return (
    <div className="h-[130px] bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/50 dark:border-[#2d437a]/50 p-3 flex flex-col justify-between text-gray-900 dark:text-gray-100">
      {/* Header - Compact */}
      <div className="flex items-center justify-center">
        <ClockIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 ml-1">Resolution Time</span>
      </div>

      {/* Main Metric - Centered */}
      <div className="text-center flex-1 flex flex-col justify-center">
        <div className={`text-xl font-bold ${getResolutionColor(stats.averageResolutionTime)} leading-tight`}>
          {formatTime(stats.averageResolutionTime)}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300">Average</div>
      </div>

      {/* Bottom Row - Fastest/Slowest and Count */}
      <div className="flex justify-between items-end text-xs">
        <div className="text-center">
          <div className="text-green-600 dark:text-green-400 font-semibold text-xs leading-tight">
            {formatTime(stats.fastestResolution)}
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-xs">Fast</div>
        </div>
        
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          {stats.totalClosedIncidents} closed
        </div>
        
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 font-semibold text-xs leading-tight">
            {formatTime(stats.slowestResolution)}
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-xs">Slow</div>
        </div>
      </div>
    </div>
  );
}
