'use client'
// Version: 3.0 - Professional Gantt Chart Timeline

import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { FaRegClock } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { FilterState } from '../utils/incidentFilters'

type IncidentRecord = {
  id: number
  log_number?: string
  timestamp: string
  incident_type: string
  occurrence?: string
  action_taken?: string
  status?: string
  priority?: string
  resolved_at?: string | null
  responded_at?: string | null
  updated_at?: string | null
}

type CombinedArtistIncident = {
  id: string
  artistName: string
  onStageTime: string
  offStageTime?: string
  onStageIncident: IncidentRecord
  offStageIncident?: IncidentRecord
  isComplete: boolean
}

type TimelineDisplayItem = IncidentRecord | CombinedArtistIncident

type IncidentTimelineProps = {
  incidents: IncidentRecord[]
  displayedIncidents?: IncidentRecord[]
  filters: FilterState
  onFiltersChange?: (filters: FilterState) => void
  currentEvent?: any
  onIncidentSelect?: (incident: IncidentRecord) => void
}

type EventSchedule = {
  event_date?: string | null
  doors_open_time?: string | null
  main_act_start_time?: string | null
  support_act_times?: { time: string; name?: string }[] | null
  showdown_time?: string | null
  event_end_time?: string | null
  curfew_time?: string | null
}

const parseTimestamp = (timestamp: string | undefined | null): number | null => {
  if (!timestamp) return null
  const date = new Date(timestamp)
  return isNaN(date.getTime()) ? null : date.getTime()
}

const ProfessionalGanttChart = ({ incidents = [] }: { incidents: IncidentRecord[] }) => {
  console.log('🎭 ProfessionalGanttChart rendering with incidents:', incidents.length);

  if (!incidents || incidents.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-white rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="text-gray-400 mb-2 text-4xl">📊</div>
          <p className="text-sm text-gray-500">No incidents to display</p>
        </div>
      </div>
    );
  }

  // Process incidents to create combined artist performances
  const processedData = useMemo(() => {
    const artistIncidents = incidents.filter(incident => 
      incident.incident_type === 'Artist On Stage' || incident.incident_type === 'Artist Off Stage'
    );
    
    const otherIncidents = incidents.filter(incident => 
      incident.incident_type !== 'Artist On Stage' && incident.incident_type !== 'Artist Off Stage'
    );
    
    // Group artist incidents by artist name
    const artistGroups = new Map<string, { onStage?: IncidentRecord, offStage?: IncidentRecord }>();
    
    artistIncidents.forEach(incident => {
      let artistName = incident.occurrence?.trim() || '';
      
      if (incident.incident_type === 'Artist On Stage' || incident.incident_type === 'Artist Off Stage') {
        if (artistName.toLowerCase().includes('on stage')) {
          artistName = artistName.replace(/\s+on\s+stage.*$/i, '').trim();
        } else if (artistName.toLowerCase().includes('off stage')) {
          artistName = artistName.replace(/\s+off\s+stage.*$/i, '').trim();
        }
        artistName = artistName.replace(/,\s*.*$/, '').trim();
      }
      
      if (!artistGroups.has(artistName)) {
        artistGroups.set(artistName, {});
      }
      
      const group = artistGroups.get(artistName)!;
      if (incident.incident_type === 'Artist On Stage') {
        group.onStage = incident;
      } else if (incident.incident_type === 'Artist Off Stage') {
        group.offStage = incident;
      }
    });
    
    // For main act, use "Showdown" incident as the off-stage cue
    const showdownIncidents = incidents.filter(incident => incident.incident_type === 'Showdown');
    if (showdownIncidents.length > 0) {
      const mainActOnStage = artistIncidents
        .filter(incident => incident.incident_type === 'Artist On Stage')
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .pop();
      
      if (mainActOnStage) {
        const mainActName = mainActOnStage.occurrence?.replace(/\s+on\s+stage.*$/i, '').trim() || 'Main Act';
        const showdownTime = showdownIncidents[0].timestamp;
        
        const virtualOffStage: IncidentRecord = {
          id: mainActOnStage.id + 10000,
          log_number: mainActOnStage.log_number,
          timestamp: showdownTime,
          incident_type: 'Artist Off Stage',
          occurrence: `${mainActName} off stage (Showdown)`,
          action_taken: mainActOnStage.action_taken,
          status: mainActOnStage.status,
          priority: mainActOnStage.priority,
          resolved_at: mainActOnStage.resolved_at,
          responded_at: mainActOnStage.responded_at,
          updated_at: mainActOnStage.updated_at
        };
        
        if (!artistGroups.has(mainActName)) {
          artistGroups.set(mainActName, {});
        }
        const mainActGroup = artistGroups.get(mainActName)!;
        mainActGroup.onStage = mainActOnStage;
        mainActGroup.offStage = virtualOffStage;
        
        console.log(`🎭 Main act "${mainActName}" paired with Showdown at ${showdownTime}`);
      }
    }
    
    // Create combined artist performance objects
    const artistPerformances: CombinedArtistIncident[] = [];
    
    artistGroups.forEach((group, artistName) => {
      if (group.onStage) {
        artistPerformances.push({
          id: `artist-${group.onStage.id}`,
          artistName,
          onStageTime: group.onStage.timestamp,
          offStageTime: group.offStage?.timestamp,
          onStageIncident: group.onStage,
          offStageIncident: group.offStage,
          isComplete: !!group.offStage
        });
      }
    });
    
    // Sort artist performances by on-stage time
    artistPerformances.sort((a, b) => {
      const aTime = new Date(a.onStageTime).getTime();
      const bTime = new Date(b.onStageTime).getTime();
      return aTime - bTime;
    });
    
    console.log('🎭 Created artist performances:', artistPerformances.length);
    
    return {
      artistPerformances,
      otherIncidents: otherIncidents || []
    };
  }, [incidents]);

  // Calculate time range
  const timeRange = useMemo(() => {
    const allTimestamps: number[] = [];
    
    processedData.artistPerformances.forEach(perf => {
      allTimestamps.push(new Date(perf.onStageTime).getTime());
      if (perf.offStageTime) {
        allTimestamps.push(new Date(perf.offStageTime).getTime());
      }
    });
    
    processedData.otherIncidents.forEach(incident => {
      allTimestamps.push(new Date(incident.timestamp).getTime());
    });
    
    if (allTimestamps.length === 0) return null;
    
    const minTime = Math.min(...allTimestamps);
    const maxTime = Math.max(...allTimestamps);
    
    // Set event timeframe (14:00 to 00:00 next day)
    const eventStart = new Date(minTime);
    eventStart.setHours(14, 0, 0, 0);
    
    const eventEnd = new Date(minTime);
    eventEnd.setDate(eventEnd.getDate() + (minTime >= eventStart.getTime() ? 1 : 0));
    eventEnd.setHours(0, 0, 0, 0);
    
    const actualMinTime = Math.min(minTime, eventStart.getTime());
    const actualMaxTime = Math.max(maxTime, eventEnd.getTime());
    
    return {
      min: new Date(actualMinTime),
      max: new Date(actualMaxTime),
      range: actualMaxTime - actualMinTime
    };
  }, [processedData]);

  if (!timeRange) {
    return (
      <div className="h-96 flex items-center justify-center bg-white rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="text-gray-400 mb-2 text-4xl">⏰</div>
          <p className="text-sm text-gray-500">No valid timestamps found</p>
        </div>
      </div>
    );
  }

  // Generate time markers
  const timeMarkers = useMemo(() => {
    const markers = [];
    const numMarkers = 12;
    for (let i = 0; i <= numMarkers; i++) {
      const time = new Date(timeRange.min.getTime() + (timeRange.range * i / numMarkers));
      markers.push(time);
    }
    return markers;
  }, [timeRange]);

  // Get position and width for timeline items
  const getPositionAndWidth = (item: TimelineDisplayItem) => {
    let startTime: number;
    let endTime: number;

    if ('onStageTime' in item) {
      startTime = new Date(item.onStageTime).getTime();
      endTime = item.offStageTime ? new Date(item.offStageTime).getTime() : startTime + (30 * 60 * 1000);
    } else {
      startTime = new Date(item.timestamp).getTime();
      endTime = startTime + (5 * 60 * 1000);
    }

    const startPosition = ((startTime - timeRange.min.getTime()) / timeRange.range) * 100;
    const endPosition = ((endTime - timeRange.min.getTime()) / timeRange.range) * 100;
    const barWidth = Math.max(0.5, endPosition - startPosition);

    return { startPosition, barWidth, startTime, endTime };
  };

  // Get unique incident types for rows
  const incidentTypes = useMemo(() => {
    const types = new Set<string>();
    
    if (processedData.artistPerformances.length > 0) {
      types.add('Artist Performance');
    }
    
    processedData.otherIncidents.forEach(incident => {
      types.add(incident.incident_type);
    });
    
    const sortedTypes = Array.from(types).sort();
    if (types.has('Artist Performance')) {
      sortedTypes.splice(sortedTypes.indexOf('Artist Performance'), 1);
      sortedTypes.unshift('Artist Performance');
    }
    
    return sortedTypes;
  }, [processedData]);

  const typeColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  const getTypeColor = (type: string) => {
    if (type === 'Artist Performance') return '#E11D48';
    const index = incidentTypes.indexOf(type);
    return typeColors[index % typeColors.length];
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center px-4">
        <div className="w-48 flex-shrink-0 text-sm font-medium text-gray-700">
          Incident Type
        </div>
        <div className="flex-1 relative">
          {timeMarkers.map((time, index) => (
            <div
              key={index}
              className="absolute top-0 h-full flex flex-col justify-center"
              style={{ left: `${(index / 12) * 100}%` }}
            >
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="text-xs text-gray-500 mt-1 transform -translate-x-1/2 whitespace-nowrap">
                {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Rows */}
      <div className="max-h-96 overflow-y-auto">
        {incidentTypes.map((type, typeIndex) => {
          const itemsInRow = type === 'Artist Performance' 
            ? processedData.artistPerformances
            : processedData.otherIncidents.filter(incident => incident.incident_type === type);

          return (
            <div key={type} className="h-16 border-b border-gray-100 flex items-center relative hover:bg-gray-50">
              {/* Row Label */}
              <div className="w-48 flex-shrink-0 px-4 text-sm font-medium text-gray-700 truncate">
                {type}
              </div>

              {/* Timeline Bar Area */}
              <div className="flex-1 relative h-full">
                {itemsInRow.map((item, itemIndex) => {
                  const { startPosition, barWidth, startTime, endTime } = getPositionAndWidth(item);
                  const color = getTypeColor(type);
                  const duration = endTime - startTime;

                  const incidentForTooltip = 'onStageTime' in item ? item.onStageIncident : item;

                  return (
                    <div
                      key={item.id}
                      className="absolute top-1/2 transform -translate-y-1/2 h-6 rounded shadow-sm border border-white cursor-pointer group"
                      style={{
                        left: `${Math.max(0, Math.min(99.5 - barWidth, startPosition))}%`,
                        width: `${barWidth}%`,
                        backgroundColor: color,
                        opacity: 0.9
                      }}
                    >
                      {/* Start marker */}
                      <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2 shadow-sm border border-gray-300"></div>
                      
                      {/* End marker */}
                      {duration > 0 && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 shadow-sm border border-gray-300"></div>
                      )}

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-gray-700">
                        <div className="font-medium">
                          {'onStageTime' in item ? `Artist: ${item.artistName}` : `Log #${incidentForTooltip.log_number}`}
                        </div>
                        <div className="text-gray-300">
                          {new Date(startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          {duration > 0 && (
                            <span> - {new Date(endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          )}
                        </div>
                        <div className="max-w-xs truncate">{incidentForTooltip.occurrence}</div>
                        {duration > 0 && (
                          <div className="text-gray-400">
                            Duration: {Math.round(duration / (60 * 1000))} minutes
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ 
  incidents = [], 
  displayedIncidents = [], 
  filters = {}, 
  onFiltersChange, 
  currentEvent, 
  onIncidentSelect 
}) => {
  console.log('🚀 IncidentTimeline component loaded - Version 3.0');
  
  const [eventDetails, setEventDetails] = useState<EventSchedule | null>(null);

  useEffect(() => {
    if (!currentEvent?.id) return;
    
    const fetchEventDetails = async () => {
      try {
        const { data } = await supabase
          .from('events')
          .select('event_date, doors_open_time, main_act_start_time, support_act_times, showdown_time, event_end_time, curfew_time')
          .eq('id', currentEvent.id)
          .maybeSingle();
          
        if (data) {
          setEventDetails({
            event_date: data.event_date,
            doors_open_time: data.doors_open_time,
            main_act_start_time: data.main_act_start_time,
            support_act_times: data.support_act_times,
            showdown_time: data.showdown_time,
            event_end_time: data.event_end_time,
            curfew_time: data.curfew_time
          });
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
      }
    };
    
    fetchEventDetails();
  }, [currentEvent?.id]);

  // Use displayedIncidents if available, otherwise use incidents
  const timelineIncidents = displayedIncidents && displayedIncidents.length > 0 ? displayedIncidents : incidents;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 bg-white/90 dark:bg-[#203a79]/70 border border-gray-200 dark:border-[#2d437a]/50 rounded-xl px-4 py-3 shadow-sm">
        <FaRegClock className="text-blue-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Incident Timeline</span>
      </div>
      
      {/* Gantt Chart */}
      <div className="bg-white/95 dark:bg-[#182447]/80 border border-gray-200 dark:border-[#2d437a]/60 rounded-3xl shadow-xl p-4 md:p-6">
        <ProfessionalGanttChart incidents={timelineIncidents} />
      </div>
    </div>
  );
};

export default IncidentTimeline;