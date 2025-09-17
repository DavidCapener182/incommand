'use client'
// Version: 4.0 - Interactive Gantt Timeline with Artist Performance & Issues Rows

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { FaRegClock, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { FilterState } from '../utils/incidentFilters'

type IncidentRecord = {
  id: number
  log_number: string
  timestamp: string
  incident_type: string
  occurrence: string
  action_taken: string
  is_closed: boolean
  event_id: string
  callsign_from: string
  callsign_to: string
  status: string
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
  endTime: string
  isComplete: boolean
  color: string
}

type IssueIncidentWithLayout = IssueIncident & {
  lane: number
  isEstimated: boolean
  actualEndTime?: string | null
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

const ISSUE_BLOCK_HEIGHT = 18
const ISSUE_LANE_SPACING = 8
const ISSUE_ROW_TOP_PADDING = 12
const DEFAULT_ROW_HEIGHT = 80
const QUARTER_HOUR_MS = 15 * 60 * 1000

const TimelineChart = ({ 
  incidents, 
  currentEvent,
  onIncidentSelect
}: { 
  incidents: IncidentRecord[], 
  currentEvent?: any,
  onIncidentSelect?: (incident: IncidentRecord) => void 
}) => {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('full')
  const [panOffset, setPanOffset] = useState(0)
  const [eventDetails, setEventDetails] = useState<EventSchedule | null>(null)

  useEffect(() => {
    console.log('🔍 useEffect triggered - currentEvent:', currentEvent)
    if (!currentEvent || !currentEvent.id) {
      console.log('❌ No valid currentEvent or currentEvent.id available. Resetting event details.')
      setEventDetails(null)
      return
    }

    const fetchEventDetails = async () => {
      console.log('🔍 Fetching event details for event ID:', currentEvent.id)
      try {
        const { data, error } = await supabase
          .from('events')
          .select('event_date, doors_open_time, main_act_start_time, support_act_times, showdown_time, event_end_time, curfew_time')
          .eq('id', currentEvent.id)
          .maybeSingle()
        
        if (error) {
          console.error('❌ Error fetching event details:', error)
          setEventDetails(null)
          return
        }
        
        if (data) {
          console.log('📅 Event details loaded:', data)
          setEventDetails(data)
        } else {
          console.log('❌ No event details found for ID:', currentEvent.id)
          setEventDetails(null)
        }
      } catch (err) {
        console.error('❌ Exception fetching event details:', err)
        setEventDetails(null)
      }
    }
    fetchEventDetails()
  }, [currentEvent])

  const currentEventIncidents = useMemo(() => {
    if (!incidents || incidents.length === 0) return []

    const eventId = currentEvent?.id ? String(currentEvent.id) : null
    let scopedIncidents = incidents

    if (eventId) {
      const matchesEvent = incidents.filter(incident => {
        const incidentEventId = incident.event_id ? String(incident.event_id) : null
        return incidentEventId === eventId
      })

      if (matchesEvent.length > 0) {
        scopedIncidents = matchesEvent
      }
    }

    if (eventDetails?.event_date) {
      const eventDateString = new Date(eventDetails.event_date).toDateString()
      const matchesDate = scopedIncidents.filter(incident => {
        const incidentDate = new Date(incident.timestamp).toDateString()
        return incidentDate === eventDateString
      })

      if (matchesDate.length > 0) {
        scopedIncidents = matchesDate
      }
    }

    return scopedIncidents
  }, [incidents, currentEvent?.id, eventDetails?.event_date])


  // Parse artist performances
  const showdownIncident = useMemo(() => {
    if (!currentEventIncidents || currentEventIncidents.length === 0) return null

    const showdownLogs = currentEventIncidents
      .filter(incident => (incident.incident_type || '').toLowerCase() === 'showdown')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    return showdownLogs.length > 0 ? showdownLogs[showdownLogs.length - 1] : null
  }, [currentEventIncidents])

  const artistPerformances = useMemo(() => {
    if (!currentEventIncidents || currentEventIncidents.length === 0) return []

    const artistIncidents = currentEventIncidents.filter(incident => {
      const type = (incident.incident_type || '').toLowerCase()
      return type === 'artist on stage' || type === 'artist off stage'
    })

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
      const incidentType = (incident.incident_type || '').toLowerCase()
      if (incidentType === 'artist on stage') {
        group.onStage = incident
      } else if (incidentType === 'artist off stage') {
        group.offStage = incident
      }
    })

    // Handle main act with Showdown time
    const fallbackShowdownTime = eventDetails?.showdown_time
    const showdownTimestamp = showdownIncident?.timestamp || fallbackShowdownTime || null

    if (showdownTimestamp) {
      const onStageIncidents = artistIncidents
        .filter(incident => (incident.incident_type || '').toLowerCase() === 'artist on stage')
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      const mainActOnStage = onStageIncidents[onStageIncidents.length - 1]

      if (mainActOnStage) {
        const mainActName = mainActOnStage.occurrence?.replace(/\s+on\s+stage.*$/i, '').trim() || 'Main Act'

        const virtualOffStage: IncidentRecord = {
          id: mainActOnStage.id + 10000,
          log_number: mainActOnStage.log_number,
          timestamp: showdownTimestamp,
          incident_type: 'Artist Off Stage',
          occurrence: `${mainActName} off stage (Showdown)`,
          action_taken: mainActOnStage.action_taken,
          is_closed: mainActOnStage.is_closed,
          event_id: mainActOnStage.event_id,
          callsign_from: mainActOnStage.callsign_from,
          callsign_to: mainActOnStage.callsign_to,
          status: mainActOnStage.status,
          priority: mainActOnStage.priority,
          resolved_at: mainActOnStage.resolved_at,
          responded_at: mainActOnStage.responded_at,
          updated_at: mainActOnStage.updated_at
        }

        if (!artistGroups.has(mainActName)) {
          artistGroups.set(mainActName, {})
        }
        const mainActGroup = artistGroups.get(mainActName)!
        mainActGroup.onStage = mainActOnStage
        mainActGroup.offStage = virtualOffStage
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
  }, [currentEventIncidents, eventDetails])

  const computeIssueBlocks = useCallback((incidentList: IncidentRecord[]) => {
    const mappedIssues = incidentList
      .map(incident => {
        if (!incident.timestamp) return null

        const startTime = incident.timestamp
        const actualEnd = incident.resolved_at || incident.responded_at || null
        const displayEnd = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString()

        const colorKey = incident.incident_type || 'default'
        const color = issueTypeColors[colorKey] || issueTypeColors.default

        return {
          id: `issue-${incident.id}`,
          incident,
          startTime,
          endTime: displayEnd,
          isComplete: !!actualEnd,
          color,
          isEstimated: true,
          lane: 0,
          actualEndTime: actualEnd
        }
      })
      .filter(issue => issue !== null)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

    const laneEndTimes: number[] = []

    return mappedIssues.map(issue => {
      const startMs = new Date(issue.startTime).getTime()
      const endMs = new Date(issue.endTime).getTime()

      if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
        return issue
      }

      let assignedLane = 0
      while (assignedLane < laneEndTimes.length && startMs < laneEndTimes[assignedLane]) {
        assignedLane += 1
      }

      laneEndTimes[assignedLane] = Math.max(laneEndTimes[assignedLane] || 0, endMs)

      return { ...issue, lane: assignedLane }
    })
  }, [])

  const issueRows = useMemo(() => {
    const excludedTypes = new Set(['artist on stage', 'artist off stage', 'showdown'])

    const issueIncidents = (currentEventIncidents || []).filter(incident => {
      const type = (incident.incident_type || '').toLowerCase()
      return !excludedTypes.has(type)
    })

    const buckets: Record<'sitrep' | 'medical' | 'major', IncidentRecord[]> = {
      sitrep: [],
      medical: [],
      major: []
    }

    issueIncidents.forEach(incident => {
      const type = (incident.incident_type || '').toLowerCase()
      if (type.includes('sit') && type.includes('rep')) {
        buckets.sitrep.push(incident)
      } else if (type.includes('medical')) {
        buckets.medical.push(incident)
      } else {
        buckets.major.push(incident)
      }
    })

    const rows = [
      { id: 'sitrep' as const, title: 'Sit Reps', incidents: buckets.sitrep },
      { id: 'medical' as const, title: 'Medicals', incidents: buckets.medical },
      { id: 'major' as const, title: 'Major Issues', incidents: buckets.major }
    ]

    return rows.map(row => {
      const blocks = computeIssueBlocks(row.incidents)
      const maxLane = blocks.reduce((max, issue) => Math.max(max, issue.lane), 0)
      const rowHeight = Math.max(
        DEFAULT_ROW_HEIGHT,
        ISSUE_ROW_TOP_PADDING * 2 + (maxLane + 1) * ISSUE_BLOCK_HEIGHT + maxLane * ISSUE_LANE_SPACING
      )

      return {
        id: row.id,
        title: row.title,
        issues: blocks,
        rowHeight
      }
    })
  }, [computeIssueBlocks, currentEventIncidents])

  const allIssueBlocks = useMemo(
    () => issueRows.flatMap(row => row.issues),
    [issueRows]
  )

  // Calculate timeline boundaries
  const timelineBoundaries = useMemo(() => {
    const timestamps: number[] = []

    artistPerformances.forEach(performance => {
      timestamps.push(new Date(performance.startTime).getTime())
      if (performance.endTime) {
        timestamps.push(new Date(performance.endTime).getTime())
      }
    })

    allIssueBlocks.forEach(issue => {
      timestamps.push(new Date(issue.startTime).getTime())
      timestamps.push(new Date(issue.endTime).getTime())
    })

    if (timestamps.length === 0) return null

    const firstIncidentTime = Math.min(...timestamps)
    const lastIncidentTime = Math.max(...timestamps)

    const alignedStart = Math.floor(firstIncidentTime / QUARTER_HOUR_MS) * QUARTER_HOUR_MS
    const startTime = new Date(alignedStart)
    const endTime = new Date(lastIncidentTime + 30 * 60 * 1000)

    if (endTime <= startTime) {
      endTime.setTime(startTime.getTime() + 30 * 60 * 1000)
    }

    return { startTime, endTime }
  }, [artistPerformances, allIssueBlocks])

  const hasTimelineBoundaries = Boolean(timelineBoundaries)

  const fallbackBoundaries = useMemo(() => {
    const now = new Date()
    return {
      startTime: now,
      endTime: new Date(now.getTime() + 60 * 60 * 1000)
    }
  }, [])

  const { startTime, endTime } = hasTimelineBoundaries ? timelineBoundaries! : fallbackBoundaries
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

  const formatDisplayTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
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

  if (!hasTimelineBoundaries) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-gray-500 mb-2">📊</div>
          <p className="text-sm text-gray-600">No timeline data available</p>
        </div>
      </div>
    )
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
                  role="button"
                  tabIndex={0}
                  title={`${performance.artistName} • ${formatDisplayTime(performance.startTime)}${performance.endTime ? ` – ${formatDisplayTime(performance.endTime)}` : ''}`}
                  onClick={() => {
                    if (onIncidentSelect) {
                      onIncidentSelect(performance.onStageIncident)
                    }
                  }}
                  onKeyDown={(event) => {
                    if ((event.key === 'Enter' || event.key === ' ' || event.key === 'Space') && onIncidentSelect) {
                      event.preventDefault()
                      onIncidentSelect(performance.onStageIncident)
                    }
                  }}
                >
                  <span className={`truncate px-2 text-center font-semibold tracking-wide text-white ${width < 10 ? 'text-[11px]' : 'text-sm'} drop-shadow-sm`}>
                    {performance.artistName}
                    {performance.isMainAct && <span className="text-[10px] opacity-80 ml-1">(Main)</span>}
                  </span>

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

        {/* Issues Rows */}
        {issueRows.map(row => (
          <div
            key={row.id}
            className="border-b border-gray-100 flex items-stretch relative"
            style={{ minHeight: row.rowHeight }}
          >
            <div className="w-40 flex-shrink-0 px-4 text-sm font-medium text-gray-800">
              {row.title}
            </div>
            <div className="flex-1 relative h-full" style={{ minHeight: row.rowHeight }}>
              {row.issues.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 italic">
                  No {row.title.toLowerCase()} logged
                </div>
              ) : (
                row.issues.map(issue => {
                  const startPos = getPosition(issue.startTime)
                  const endPos = getPosition(issue.endTime)
                  const width = Math.max(2, endPos - startPos)
                  const laneTop = ISSUE_ROW_TOP_PADDING + issue.lane * (ISSUE_BLOCK_HEIGHT + ISSUE_LANE_SPACING)
                  const opacity = issue.isEstimated ? 0.65 : 0.9
                  const actualEndDisplay = issue.actualEndTime ? formatDisplayTime(issue.actualEndTime) : null

                  return (
                    <div
                      key={issue.id}
                      className={`absolute rounded shadow-sm cursor-pointer group flex items-center justify-center text-white text-xs font-medium overflow-hidden ${
                        issue.isEstimated ? 'border-2 border-dotted border-white/80' : 'border border-white/80'
                      }`}
                      style={{
                        left: `${Math.max(0, Math.min(100 - width, startPos))}%`,
                        width: `${width}%`,
                        top: `${laneTop}px`,
                        height: `${ISSUE_BLOCK_HEIGHT}px`,
                        backgroundColor: issue.color,
                        opacity,
                        zIndex: 15
                      }}
                      role="button"
                      tabIndex={0}
                      title={`${issue.incident.incident_type} • ${formatDisplayTime(issue.startTime)} – ${formatDisplayTime(issue.endTime)}`}
                      onClick={() => {
                        if (onIncidentSelect) {
                          onIncidentSelect(issue.incident)
                        }
                      }}
                      onKeyDown={(event) => {
                        if ((event.key === 'Enter' || event.key === ' ' || event.key === 'Space') && onIncidentSelect) {
                          event.preventDefault()
                          onIncidentSelect(issue.incident)
                        }
                      }}
                    >
                      <span className={`truncate px-2 text-center font-semibold tracking-tight text-white ${width < 8 ? 'text-[10px]' : 'text-xs'} drop-shadow-sm`}>
                        {issue.incident.incident_type}
                      </span>

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-gray-700 pointer-events-none">
                        <div className="font-medium">Log #{issue.incident.log_number || issue.incident.id}</div>
                        <div className="text-gray-300">{issue.incident.incident_type}</div>
                        <div className="text-gray-300">
                          {new Date(issue.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          <span>
                            {' '}– {new Date(issue.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {actualEndDisplay && (
                          <div className="text-gray-400">
                            Actual end: {actualEndDisplay}
                          </div>
                        )}
                        <div className="max-w-xs truncate text-gray-400">{issue.incident.occurrence}</div>
                        <div className="text-gray-400">
                          Status: {issue.isComplete ? 'Resolved' : 'Open'}
                        </div>
                        {issue.isEstimated && (
                          <div className="text-yellow-300 mt-1">1 hour display window for visibility</div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ))}
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
        <TimelineChart 
          incidents={timelineIncidents} 
          currentEvent={currentEvent} 
          onIncidentSelect={onIncidentSelect}
        />
      </div>
    </div>
  )
}

export default IncidentTimeline
