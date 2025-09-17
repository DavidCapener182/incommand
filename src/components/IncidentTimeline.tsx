'use client'
// Version: 4.0 - Interactive Gantt Timeline with Artist Performance & Issues Rows

import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { FaRegClock, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
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

type ArtistPerformance = {
  id: string
  artistName: string
  startTime: string
  endTime?: string
  onStageIncident: IncidentRecord
  offStageIncident?: IncidentRecord
  isMainAct: boolean
  color: string
}

type IssueIncident = {
  id: string
  incident: IncidentRecord
  startTime: string
  endTime?: string
  isComplete: boolean
  color: string
}

type IncidentTimelineProps = {
  incidents?: IncidentRecord[]
  displayedIncidents?: IncidentRecord[]
  filters?: FilterState
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

type ZoomLevel = '15m' | '30m' | '1h' | 'full'

const artistColors = [
  '#E11D48', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', 
  '#06B6D4', '#84CC16', '#F97316', '#D946EF', '#EF4444'
]

const issueTypeColors: Record<string, string> = {
  'Medical': '#EF4444',      // Red
  'Entry Breach': '#F97316', // Orange
  'Accessibility': '#F59E0B', // Yellow
  'Crowd': '#3B82F6',       // Blue
  'Fight': '#EF4444',       // Red
  'Welfare': '#10B981',     // Green
  'Tech': '#6B7280',        // Grey
  'Ejection': '#F59E0B',    // Yellow
  'default': '#6B7280'      // Grey
}

const TimelineChart = ({ incidents, currentEvent }: { incidents: IncidentRecord[], currentEvent?: any }) => {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('full')
  const [panOffset, setPanOffset] = useState(0)
  const [eventDetails, setEventDetails] = useState<EventSchedule | null>(null)

  useEffect(() => {
    if (!currentEvent?.id) return
    const fetchEventDetails = async () => {
      const { data } = await supabase
        .from('events')
        .select('event_date, doors_open_time, main_act_start_time, support_act_times, showdown_time, event_end_time, curfew_time')
        .eq('id', currentEvent.id)
        .maybeSingle()
      if (data) {
        setEventDetails(data)
      }
    }
    fetchEventDetails()
  }, [currentEvent?.id])

  if (!incidents || incidents.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-gray-500 mb-2">📊</div>
          <p className="text-sm text-gray-600">No incidents to display</p>
        </div>
      </div>
    )
  }

  console.log('🎭 TimelineChart rendering with incidents:', incidents.length)

  // Parse artist performances
  const artistPerformances = useMemo(() => {
    const artistIncidents = incidents.filter(incident =>
      incident.incident_type === 'Artist On Stage' || incident.incident_type === 'Artist Off Stage'
    )

    const artistGroups = new Map<string, { onStage?: IncidentRecord, offStage?: IncidentRecord }>()

    artistIncidents.forEach(incident => {
      let artistName = incident.occurrence?.trim() || ''
      
      // Extract artist name from occurrence text
      if (artistName.toLowerCase().includes('on stage')) {
        artistName = artistName.replace(/\s+on\s+stage.*$/i, '').trim()
      } else if (artistName.toLowerCase().includes('off stage')) {
        artistName = artistName.replace(/\s+off\s+stage.*$/i, '').trim()
      }
      artistName = artistName.replace(/,\s*.*$/, '').trim()

      if (!artistGroups.has(artistName)) {
        artistGroups.set(artistName, {})
      }

      const group = artistGroups.get(artistName)!
      if (incident.incident_type === 'Artist On Stage') {
        group.onStage = incident
      } else if (incident.incident_type === 'Artist Off Stage') {
        group.offStage = incident
      }
    })

    // Handle main act with Showdown time
    const showdownTime = eventDetails?.showdown_time
    if (showdownTime) {
      // Find the main act (last "Artist On Stage" before showdown)
      const mainActOnStage = artistIncidents
        .filter(incident => incident.incident_type === 'Artist On Stage')
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .pop()

      if (mainActOnStage) {
        const mainActName = mainActOnStage.occurrence?.replace(/\s+on\s+stage.*$/i, '').trim() || 'Main Act'
        
        // Create virtual off-stage incident for main act
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
        }

        // Always set the main act group, overriding any existing off-stage
        if (!artistGroups.has(mainActName)) {
          artistGroups.set(mainActName, {})
        }
        const mainActGroup = artistGroups.get(mainActName)!
        mainActGroup.onStage = mainActOnStage
        mainActGroup.offStage = virtualOffStage

        console.log(`🎭 Main act "${mainActName}" paired with Showdown at ${showdownTime}`)
      }
    }

    const performances: ArtistPerformance[] = []
    let colorIndex = 0

    artistGroups.forEach((group, artistName) => {
      if (group.onStage) {
        const isMainAct = !!group.offStage?.occurrence?.includes('Showdown')
        performances.push({
          id: `artist-${group.onStage.id}`,
          artistName,
          startTime: group.onStage.timestamp,
          endTime: group.offStage?.timestamp,
          onStageIncident: group.onStage,
          offStageIncident: group.offStage,
          isMainAct,
          color: artistColors[colorIndex % artistColors.length]
        })
        colorIndex++
      }
    })

    return performances.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
  }, [incidents, eventDetails])

  // Parse issues
  const issues = useMemo(() => {
    const issueIncidents = incidents.filter(incident =>
      incident.incident_type !== 'Artist On Stage' && 
      incident.incident_type !== 'Artist Off Stage' &&
      incident.incident_type !== 'Showdown'
    )

    return issueIncidents.map(incident => {
      const startTime = incident.timestamp
      const endTime = incident.resolved_at || incident.updated_at
      const isComplete = !!endTime
      
      // Default to 1 hour if no end time
      const effectiveEndTime = endTime || new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString()
      
      const color = issueTypeColors[incident.incident_type] || issueTypeColors.default

      return {
        id: `issue-${incident.id}`,
        incident,
        startTime,
        endTime: effectiveEndTime,
        isComplete,
        color
      }
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  }, [incidents])

  // Calculate timeline boundaries
  const timelineBoundaries = useMemo(() => {
    const allTimestamps = [
      ...artistPerformances.map(p => new Date(p.startTime).getTime()),
      ...artistPerformances.filter(p => p.endTime).map(p => new Date(p.endTime!).getTime()),
      ...issues.map(i => new Date(i.startTime).getTime()),
      ...issues.map(i => new Date(i.endTime).getTime())
    ]

    if (allTimestamps.length === 0) return null

    const firstIncidentTime = Math.min(...allTimestamps)
    const lastIncidentTime = Math.max(...allTimestamps)
    
    // Start = 1 hour before first incident
    const startTime = new Date(firstIncidentTime - 60 * 60 * 1000)
    
    // End = 1 hour after last incident (not Showdown time)
    const endTime = new Date(lastIncidentTime + 60 * 60 * 1000)

    return { startTime, endTime }
  }, [artistPerformances, issues])

  if (!timelineBoundaries) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-gray-500 mb-2">📊</div>
          <p className="text-sm text-gray-600">No timeline data available</p>
        </div>
      </div>
    )
  }

  const { startTime, endTime } = timelineBoundaries
  const totalDuration = endTime.getTime() - startTime.getTime()

  // Calculate visible time range based on zoom level
  const getVisibleDuration = () => {
    switch (zoomLevel) {
      case '15m': return 15 * 60 * 1000
      case '30m': return 30 * 60 * 1000
      case '1h': return 60 * 60 * 1000
      case 'full': return totalDuration
      default: return totalDuration
    }
  }

  const visibleDuration = getVisibleDuration()
  const visibleStartTime = new Date(startTime.getTime() + panOffset)
  const visibleEndTime = new Date(visibleStartTime.getTime() + visibleDuration)

  // Generate time markers
  const timeMarkers = useMemo(() => {
    const markers = []
    const numMarkers = zoomLevel === 'full' ? 12 : 8
    const markerInterval = visibleDuration / numMarkers

    for (let i = 0; i <= numMarkers; i++) {
      const time = new Date(visibleStartTime.getTime() + (markerInterval * i))
      markers.push(time)
    }
    return markers
  }, [visibleStartTime, visibleDuration, zoomLevel])

  // Helper functions
  const getPosition = (timestamp: string) => {
    const time = new Date(timestamp).getTime()
    const relativeTime = time - visibleStartTime.getTime()
    return Math.max(0, Math.min(100, (relativeTime / visibleDuration) * 100))
  }

  const getWidth = (startTimestamp: string, endTimestamp: string) => {
    const startPos = getPosition(startTimestamp)
    const endPos = getPosition(endTimestamp)
    return Math.max(0.5, endPos - startPos)
  }

  const handleZoom = (level: ZoomLevel) => {
    setZoomLevel(level)
    setPanOffset(0) // Reset pan when zooming
  }

  const handlePan = (direction: 'left' | 'right') => {
    const panAmount = visibleDuration * 0.2 // Pan 20% of visible duration
    const newOffset = direction === 'left' 
      ? Math.max(0, panOffset - panAmount)
      : Math.min(totalDuration - visibleDuration, panOffset + panAmount)
    setPanOffset(newOffset)
  }

  return (
    <div className="h-[600px] bg-white rounded-lg border overflow-hidden font-sans">
      {/* Timeline Controls */}
      <div className="h-12 bg-gray-50 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Timeline View</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleZoom('15m')}
              className={`px-2 py-1 text-xs rounded ${zoomLevel === '15m' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              15m
            </button>
            <button
              onClick={() => handleZoom('30m')}
              className={`px-2 py-1 text-xs rounded ${zoomLevel === '30m' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              30m
            </button>
            <button
              onClick={() => handleZoom('1h')}
              className={`px-2 py-1 text-xs rounded ${zoomLevel === '1h' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              1h
            </button>
            <button
              onClick={() => handleZoom('full')}
              className={`px-2 py-1 text-xs rounded ${zoomLevel === 'full' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Full
            </button>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <button
              onClick={() => handlePan('left')}
              className="p-1 text-gray-600 hover:text-gray-800"
              disabled={panOffset <= 0}
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={() => handlePan('right')}
              className="p-1 text-gray-600 hover:text-gray-800"
              disabled={panOffset >= totalDuration - visibleDuration}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Header with Time Markers */}
      <div className="h-12 bg-gray-50 border-b flex items-center relative">
        <div className="w-40 flex-shrink-0 px-4 text-xs font-semibold text-gray-700">
          Timeline
        </div>
        <div className="flex-1 relative h-full">
          {timeMarkers.map((time, index) => (
            <div
              key={index}
              className="absolute top-0 h-full flex flex-col justify-center items-start"
              style={{ left: `${(index / (timeMarkers.length - 1)) * 100}%` }}
            >
              <div className="w-px h-full bg-gray-200 absolute left-0"></div>
              <div className="text-xs text-gray-500 mt-1 -translate-x-1/2 whitespace-nowrap px-1">
                {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Rows */}
      <div className="overflow-y-auto" style={{ height: 'calc(100% - 6rem)' }}>
        {/* Artist Performance Row */}
        <div className="h-20 border-b border-gray-100 flex items-center relative">
          <div className="w-40 flex-shrink-0 px-4 text-sm font-medium text-gray-800">
            Artist Performance
          </div>
          <div className="flex-1 relative h-full">
            {artistPerformances.map((performance) => {
              const startPos = getPosition(performance.startTime)
              const endPos = performance.endTime ? getPosition(performance.endTime) : startPos + 5
              const width = Math.max(2, endPos - startPos)

              return (
                <div
                  key={performance.id}
                  className="absolute top-1/2 transform -translate-y-1/2 h-12 rounded-md shadow-sm border border-white cursor-pointer group flex items-center justify-center text-white text-sm font-medium overflow-hidden"
                  style={{
                    left: `${Math.max(0, Math.min(100 - width, startPos))}%`,
                    width: `${width}%`,
                    backgroundColor: performance.color,
                    opacity: 0.9,
                    zIndex: 20
                  }}
                >
                  {width > 8 && (
                    <span className="truncate px-2 text-center">
                      {performance.artistName}
                      {performance.isMainAct && <span className="text-xs opacity-75 ml-1">(Main)</span>}
                    </span>
                  )}
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-gray-700 pointer-events-none">
                    <div className="font-medium">{performance.artistName}</div>
                    <div className="text-gray-300">
                      {new Date(performance.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      {performance.endTime && (
                        <span> - {new Date(performance.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                    <div className="text-gray-400">
                      Duration: {performance.endTime ? 
                        Math.round((new Date(performance.endTime).getTime() - new Date(performance.startTime).getTime()) / (60 * 1000)) : 
                        'Ongoing'
                      } minutes
                    </div>
                    {performance.isMainAct && (
                      <div className="text-yellow-400 text-xs">Main Act (ends at Showdown)</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Issues Row */}
        <div className="h-20 border-b border-gray-100 flex items-center relative">
          <div className="w-40 flex-shrink-0 px-4 text-sm font-medium text-gray-800">
            Issues
          </div>
          <div className="flex-1 relative h-full">
            {issues.map((issue, index) => {
              const startPos = getPosition(issue.startTime)
              const endPos = getPosition(issue.endTime)
              const width = Math.max(2, endPos - startPos)
              
              // Stack issues vertically if they overlap
              const topOffset = (index % 3) * 6 // Stack up to 3 issues vertically

              return (
                <div
                  key={issue.id}
                  className={`absolute rounded shadow-sm border border-white cursor-pointer group flex items-center justify-center text-white text-xs font-medium overflow-hidden ${
                    !issue.isComplete ? 'border-dashed border-2' : ''
                  }`}
                  style={{
                    left: `${Math.max(0, Math.min(100 - width, startPos))}%`,
                    width: `${width}%`,
                    top: `${50 + topOffset - 12}%`, // Center with vertical offset
                    height: '16px',
                    backgroundColor: issue.color,
                    opacity: issue.isComplete ? 0.9 : 0.6,
                    zIndex: 15
                  }}
                >
                  {width > 6 && (
                    <span className="truncate px-1 text-center">
                      {issue.incident.incident_type}
                    </span>
                  )}
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-gray-700 pointer-events-none">
                    <div className="font-medium">Log #{issue.incident.log_number || issue.incident.id}</div>
                    <div className="text-gray-300">{issue.incident.incident_type}</div>
                    <div className="text-gray-300">
                      {new Date(issue.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      {issue.isComplete && (
                        <span> - {new Date(issue.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                    <div className="max-w-xs truncate text-gray-400">{issue.incident.occurrence}</div>
                    <div className="text-gray-400">
                      Status: {issue.isComplete ? 'Resolved' : 'Open'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ 
  incidents = [], 
  displayedIncidents = [], 
  filters = {}, 
  onFiltersChange, 
  currentEvent, 
  onIncidentSelect 
}) => {
  console.log('🚀 IncidentTimeline component loaded - Version 4.0')
  
  // Use displayedIncidents if available, otherwise use incidents
  const timelineIncidents = displayedIncidents && displayedIncidents.length > 0 ? displayedIncidents : incidents

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 bg-white/90 dark:bg-[#203a79]/70 border border-gray-200 dark:border-[#2d437a]/50 rounded-xl px-4 py-3 shadow-sm">
        <FaRegClock className="text-blue-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Interactive Timeline</span>
      </div>
      
      {/* Timeline Chart */}
      <div className="bg-white/95 dark:bg-[#182447]/80 border border-gray-200 dark:border-[#2d437a]/60 rounded-3xl shadow-xl p-4 md:p-6">
        <TimelineChart incidents={timelineIncidents} currentEvent={currentEvent} />
      </div>
    </div>
  )
}

export default IncidentTimeline