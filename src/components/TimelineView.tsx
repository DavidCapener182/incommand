'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { ClockIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { getIncidentTypeStyle } from '../utils/incidentStyles'
import { FilterState, filterIncidents } from '../utils/incidentFilters'

interface Incident {
  id: number
  log_number: string
  timestamp: string
  callsign_from: string
  callsign_to: string
  occurrence: string
  incident_type: string
  action_taken: string
  is_closed: boolean
  event_id: string
  status: string
}

interface TimelineViewProps {
  incidents: Incident[]
  filters: FilterState
  searchQuery: string
  onIncidentSelect: (incident: Incident) => void
  currentUser?: any
}

const TIMELINE_HEIGHT = 600
const INCIDENT_HEIGHT = 50 // Reduced height for better density
const TIME_MARKER_INTERVAL = 120 // minutes (2 hour intervals)
const ROW_SPACING = 20 // Reduced spacing between rows

export default function TimelineView({ 
  incidents, 
  filters, 
  searchQuery, 
  onIncidentSelect,
  currentUser 
}: TimelineViewProps) {
  const [hoveredIncident, setHoveredIncident] = useState<Incident | null>(null)

  // Filter incidents based on search and filters, excluding attendance and sit rep
  const filteredIncidents = useMemo(() => {
    const baseFiltered = filterIncidents<Incident>(incidents, { ...filters, query: searchQuery })
    return baseFiltered.filter(incident => 
      incident.incident_type !== 'Attendance' && incident.incident_type !== 'Sit Rep'
    )
  }, [incidents, filters, searchQuery])

  // Define types for combined incidents
  type CombinedArtistIncident = {
    id: string
    artistName: string
    onStageTime: string
    offStageTime?: string
    onStageIncident: Incident
    offStageIncident?: Incident
    isComplete: boolean
  }
  
  type TimelineIncident = Incident | CombinedArtistIncident
  
  // Combine Artist on Stage and Artist off Stage incidents
  const combinedIncidents = useMemo(() => {
    const artistIncidents = filteredIncidents.filter(incident => 
      incident.incident_type === 'Artist on Stage' || incident.incident_type === 'Artist off Stage'
    )
    
    const otherIncidents = filteredIncidents.filter(incident => 
      incident.incident_type !== 'Artist on Stage' && incident.incident_type !== 'Artist off Stage'
    )
    
    // Group artist incidents by artist name (from occurrence field)
    const artistGroups = new Map<string, { onStage?: Incident, offStage?: Incident }>()
    
    artistIncidents.forEach(incident => {
      // Extract artist name from occurrence field
      // Handle cases like "Qendresa on stage", "Health on Stage", etc.
      let artistName = incident.occurrence.trim()
      
      // For artist incidents, extract just the artist name
      if (incident.incident_type === 'Artist on Stage' || incident.incident_type === 'Artist off Stage') {
        // Simpler, more robust artist name extraction
        if (artistName.toLowerCase().includes('on stage')) {
          artistName = artistName.replace(/\s+on\s+stage.*$/i, '').trim()
        } else if (artistName.toLowerCase().includes('off stage')) {
          artistName = artistName.replace(/\s+off\s+stage.*$/i, '').trim()
        }
        
        // Remove any trailing commas and extra text
        artistName = artistName.replace(/,\s*.*$/, '').trim()
      }
      
      if (!artistGroups.has(artistName)) {
        artistGroups.set(artistName, {})
      }
      
      const group = artistGroups.get(artistName)!
      if (incident.incident_type === 'Artist on Stage') {
        group.onStage = incident
      } else if (incident.incident_type === 'Artist off Stage') {
        group.offStage = incident
      }
    })
    
    // Create combined artist incidents
    const combinedArtistIncidents: CombinedArtistIncident[] = []
    
    artistGroups.forEach((group, artistName) => {
      if (group.onStage) {
        combinedArtistIncidents.push({
          id: `artist-${group.onStage.id}`,
          artistName,
          onStageTime: group.onStage.timestamp,
          offStageTime: group.offStage?.timestamp,
          onStageIncident: group.onStage,
          offStageIncident: group.offStage,
          isComplete: !!group.offStage
        })
      }
    })
    

    
    // Sort combined incidents by on-stage time
    combinedArtistIncidents.sort((a, b) => 
      new Date(a.onStageTime).getTime() - new Date(b.onStageTime).getTime()
    )
    
    // Return combined incidents first, then other incidents
    return [...combinedArtistIncidents, ...otherIncidents] as TimelineIncident[]
  }, [filteredIncidents])

  // Get unique incident types (memoized to avoid recalculation)
  const uniqueIncidentTypes = useMemo(() => {
    return Array.from(new Set(
      filteredIncidents
        .filter(inc => inc.incident_type !== 'Artist on Stage' && inc.incident_type !== 'Artist off Stage')
        .map(inc => inc.incident_type)
    )).sort()
  }, [filteredIncidents])

  // Calculate dynamic timeline height based on number of incident types
  const dynamicTimelineHeight = useMemo(() => {
    // Calculate height: base height + (number of rows * (incident height + spacing)) + bottom margin
    const baseHeight = 100 // Base height for time markers and spacing
    const rowsHeight = (uniqueIncidentTypes.length + 1) * (INCIDENT_HEIGHT + ROW_SPACING) // +1 for artist row
    const bottomMargin = 50 // Bottom margin for timeline base line
    
    return Math.max(TIMELINE_HEIGHT, baseHeight + rowsHeight + bottomMargin)
  }, [uniqueIncidentTypes])

  // Calculate timeline bounds using combined incidents to include artist performance times
  const timelineBounds = useMemo(() => {
    if (filteredIncidents.length === 0) {
      const now = new Date()
      return {
        start: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        end: new Date(now.getTime() + 1 * 60 * 60 * 1000)   // 1 hour from now
      }
    }

    // Get all timestamps including artist performance start and end times
    const allTimestamps: Date[] = []
    
    filteredIncidents.forEach(incident => {
      if (incident.incident_type === 'Artist on Stage' || incident.incident_type === 'Artist off Stage') {
        // For artist incidents, we'll handle them in the combined incidents
        allTimestamps.push(new Date(incident.timestamp))
      } else {
        allTimestamps.push(new Date(incident.timestamp))
      }
    })
    
    const start = new Date(Math.min(...allTimestamps.map(t => t.getTime())))
    const end = new Date(Math.max(...allTimestamps.map(t => t.getTime())))
    
    // Start 1 hour before first incident and end 2 hours after last incident
    const oneHour = 1 * 60 * 60 * 1000 // 1 hour in milliseconds
    const twoHours = 2 * 60 * 60 * 1000 // 2 hours in milliseconds
    const forcedStart = new Date(start.getTime() - oneHour) // Start 1 hour before first incident
    
    return {
      start: forcedStart,
      end: new Date(end.getTime() + twoHours)
    }
  }, [filteredIncidents])

  // Generate time markers with consistent 2-hour intervals
  const timeMarkers = useMemo(() => {
    const markers = []
    const start = timelineBounds.start
    const end = timelineBounds.end
    
    // Round start time down to nearest 2-hour interval
    const markerStart = new Date(start)
    markerStart.setMinutes(0, 0, 0)
    markerStart.setHours(Math.floor(markerStart.getHours() / 2) * 2, 0, 0, 0)
    
    // Round end time up to nearest 2-hour interval
    const roundedEnd = new Date(end)
    roundedEnd.setMinutes(0, 0, 0)
    roundedEnd.setHours(Math.ceil(roundedEnd.getHours() / 2) * 2, 0, 0, 0)
    
    const interval = TIME_MARKER_INTERVAL * 60 * 1000 // 120 minutes (2 hours) in milliseconds
    
    for (let time = markerStart.getTime(); time <= roundedEnd.getTime(); time += interval) {
      markers.push(new Date(time))
    }
    
    return markers
  }, [timelineBounds])

  // Calculate horizontal position for a timestamp
  const getTimePosition = useCallback((timestamp: string) => {
    const time = new Date(timestamp).getTime()
    const start = timelineBounds.start.getTime()
    const end = timelineBounds.end.getTime()
    const totalWidth = end - start
    
    if (totalWidth === 0) return 0
    
    return ((time - start) / totalWidth) * 100
  }, [timelineBounds])

  // Get row number for incident type using dynamic assignment based on actual types present
  const getIncidentRow = useCallback((incident: TimelineIncident) => {
    if ('onStageTime' in incident) {
      // Artist incidents get their own row
      return 0
    } else {
      // Regular incidents get rows based on dynamic type mapping
      const regularIncident = incident as Incident
      const type = regularIncident.incident_type
      
      // Create dynamic row mapping based on actual types present
      const rowMap: { [key: string]: number } = {}
      uniqueIncidentTypes.forEach((incidentType, index) => {
        rowMap[incidentType] = index + 1 // Start from row 1 (row 0 is for artists)
      })
      
      return rowMap[type] || uniqueIncidentTypes.length + 1 // Fallback to last row + 1
    }
  }, [uniqueIncidentTypes])

  // Format time for display
  const formatTime = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  // Get incident priority indicator
  const getPriorityIndicator = useCallback((incident: Incident) => {
    const highPriorityTypes = [
      'Ejection', 'Code Green', 'Code Black', 'Code Pink', 'Aggressive Behaviour',
      'Missing Child/Person', 'Hostile Act', 'Counter-Terror Alert', 'Fire Alarm',
      'Evacuation', 'Medical', 'Suspicious Behaviour', 'Queue Build-Up'
    ]
    
    if (highPriorityTypes.includes(incident.incident_type)) {
      return <ExclamationTriangleIcon className="h-3 w-3 text-red-500" />
    }
    
    if (incident.is_closed) {
      return <CheckCircleIcon className="h-3 w-3 text-green-500" />
    }
    
    return <ClockIcon className="h-3 w-3 text-yellow-500" />
  }, [])

  // Handle incident click
  const handleIncidentClick = useCallback((incident: Incident, e: React.MouseEvent) => {
    e.stopPropagation()
    onIncidentSelect(incident)
  }, [onIncidentSelect])

  if (filteredIncidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-[#23408e] rounded-2xl border border-gray-200 dark:border-[#2d437a]">
        <ClockIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No incidents in timeline</h3>
        <p className="text-gray-600 dark:text-gray-400 text-center">
          When incidents are logged, they will appear here on a chronological timeline.
        </p>
      </div>
    )
  }

  return (
    <div className="relative bg-white dark:bg-[#23408e] rounded-2xl border border-gray-200 dark:border-[#2d437a] p-6 overflow-hidden">
      {/* Timeline Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Incident Timeline</h2>
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
            {combinedIncidents.length} incident{combinedIncidents.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {/* Time Range Display */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">Range:</span>{' '}
          {timelineBounds.start.toLocaleDateString('en-GB', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          })} - {timelineBounds.end.toLocaleDateString('en-GB', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative" style={{ height: `${dynamicTimelineHeight}px` }}>
        {/* Time Markers (2-hour intervals) */}
        <div className="absolute top-0 left-0 right-0 h-full">
          {timeMarkers.map((marker, index) => {
            const position = ((marker.getTime() - timelineBounds.start.getTime()) / 
                            (timelineBounds.end.getTime() - timelineBounds.start.getTime())) * 100
            
            return (
              <div
                key={index}
                className="absolute top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-600"
                style={{ left: `${position}%` }}
              >
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-[#23408e] px-2 py-1 text-xs text-gray-500 dark:text-gray-400 font-medium rounded shadow-sm">
                  {marker.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Individual Incidents - Organized by type in rows */}
        {combinedIncidents.map((incident, index) => {
          let position: number
          let isArtistIncident = false
          
          if ('onStageTime' in incident) {
            // Artist incident - position based on on-stage time
            position = getTimePosition(incident.onStageTime)
            isArtistIncident = true
          } else {
            // Regular incident
            position = getTimePosition(incident.timestamp)
            isArtistIncident = false
          }
          
          // Use row-based positioning for compact layout
          const row = getIncidentRow(incident)
          const verticalPosition = Math.max(30, row * (INCIDENT_HEIGHT + ROW_SPACING))
          
          // Calculate width for artist incidents based on duration
          let cardWidth = '160px'
          if ('onStageTime' in incident && incident.offStageTime) {
            const onStageTime = new Date(incident.onStageTime).getTime()
            const offStageTime = new Date(incident.offStageTime).getTime()
            const duration = offStageTime - onStageTime
            const totalTimelineWidth = timelineBounds.end.getTime() - timelineBounds.start.getTime()
            const widthPercentage = (duration / totalTimelineWidth) * 100
            
            // Calculate actual pixel width based on timeline width
            // The timeline container is roughly 800px wide, so convert percentage to pixels
            const timelineContainerWidth = 800 // Approximate timeline container width
            const calculatedWidth = Math.max(160, Math.min(300, (widthPercentage / 100) * timelineContainerWidth))
            cardWidth = `${calculatedWidth}px`
            
            // Debug: Log the width calculation
            console.log(`Artist: ${incident.artistName}, Duration: ${duration/60000}min, Width: ${calculatedWidth}px, Percentage: ${widthPercentage}%, Timeline: ${totalTimelineWidth/60000}min`)
          }
          
          return (
            <div
              key={incident.id}
              className="absolute cursor-pointer transition-all duration-200 hover:scale-105"
              style={{
                left: `${Math.max(0, Math.min(90, position))}%`,
                top: `${verticalPosition}px`,
                width: cardWidth,
                height: `${INCIDENT_HEIGHT}px`
              }}
              onMouseEnter={() => {
                if ('onStageTime' in incident) {
                  setHoveredIncident(incident.onStageIncident)
                } else {
                  setHoveredIncident(incident)
                }
              }}
              onMouseLeave={() => setHoveredIncident(null)}
              onClick={(e) => {
                if ('onStageTime' in incident) {
                  handleIncidentClick(incident.onStageIncident, e)
                } else {
                  handleIncidentClick(incident, e)
                }
              }}
            >
                            {/* Incident Card */}
              {(() => {
                if ('onStageTime' in incident) {
                  // Artist Incident Card
                  return (
                    <div className={`
                      h-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-[#2a1a57] dark:to-[#572a4a] border-2 rounded-xl shadow-lg 
                      hover:shadow-xl transition-all duration-200 overflow-hidden border-purple-300 dark:border-purple-600
                      ${hoveredIncident?.id === incident.onStageIncident.id 
                        ? 'ring-2 ring-purple-400 shadow-2xl' 
                        : ''
                      }
                    `}>
                      {/* Single-line content with left-to-right bouncing */}
                      <div className="p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-3 w-3 text-purple-500 flex-shrink-0" />
                            <span className="text-xs font-medium text-gray-800 dark:text-gray-200 overflow-hidden">
                              <span className="inline-block animate-pulse">
                                {incident.artistName}
                              </span>
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium flex-shrink-0">
                            {formatTime(incident.onStageTime)}
                            {incident.offStageTime && ` - ${formatTime(incident.offStageTime)}`}
                          </div>
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-400 mt-1 overflow-hidden">
                          <span className="inline-block animate-pulse">
                            {incident.isComplete ? 'Performance Complete' : 'Currently On Stage'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                } else {
                  // Regular Incident Card
                  return (
                    <div className={`
                      h-full bg-white dark:bg-[#182447] border-2 rounded-xl shadow-lg 
                      hover:shadow-xl transition-all duration-200 overflow-hidden
                      ${incident.is_closed 
                        ? 'border-green-300 dark:border-green-600' 
                        : 'border-yellow-300 dark:border-yellow-600'
                      }
                      ${hoveredIncident?.id === incident.id 
                        ? 'ring-2 ring-blue-400 shadow-2xl' 
                        : ''
                      }
                    `}>
                                        {/* Single-line content */}
                  <div className="p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {getPriorityIndicator(incident)}
                        <span className={`px-1 py-0.5 text-xs font-bold rounded-full ${getIncidentTypeStyle(incident.incident_type)}`}>
                          {incident.incident_type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {formatTime(incident.timestamp)}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate mt-1">
                      {incident.occurrence}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span className="truncate max-w-[50px]">{incident.callsign_from}</span>
                      <span className="text-gray-400">→</span>
                      <span className="truncate max-w-[50px]">{incident.callsign_to}</span>
                    </div>
                  </div>
                    </div>
                  )
                }
              })()}
             </div>
           )
        })}

        {/* Timeline Base Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 rounded-full" />
      </div>

      {/* Legend */}
      <div className="mt-6 space-y-4">
        {/* Priority Legend */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
            <span className="text-gray-700 dark:text-gray-300">High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-yellow-500" />
            <span className="text-gray-700 dark:text-gray-300">Open</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span className="text-gray-700 dark:text-gray-300">Closed</span>
          </div>
        </div>
        
        {/* Dynamic Row Organization Legend */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="font-medium mb-2">Timeline Rows:</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            <div><span className="font-medium">Row 0:</span> Artist Performances</div>
            {uniqueIncidentTypes.map((type, index) => (
              <div key={type}>
                <span className="font-medium">Row {index + 1}:</span> {type}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredIncident && (
        <div
          className="absolute z-50 bg-gray-900 dark:bg-gray-800 text-white p-3 rounded-lg shadow-xl max-w-xs"
          style={{
            left: `${Math.min(90, getTimePosition(hoveredIncident.timestamp) + 10)}%`,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          <div className="font-medium mb-2">{hoveredIncident.incident_type}</div>
          <div className="text-sm text-gray-300 mb-2">{hoveredIncident.occurrence}</div>
          <div className="text-xs text-gray-400">
            <div>From: {hoveredIncident.callsign_from}</div>
            <div>To: {hoveredIncident.callsign_to}</div>
            <div>Time: {formatTime(hoveredIncident.timestamp)}</div>
            <div>Status: {hoveredIncident.is_closed ? 'Closed' : 'Open'}</div>
            <div>Log #: {hoveredIncident.log_number}</div>
          </div>
        </div>
      )}
    </div>
  )
}
