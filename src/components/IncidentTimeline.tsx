'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FilterState, getUniqueIncidentTypes } from '../utils/incidentFilters'

interface TimelineIncident {
  id: number
  log_number: string
  timestamp: string
  callsign_from: string
  callsign_to: string
  occurrence: string
  incident_type: string
  action_taken: string
  is_closed: boolean
  status: string
  priority?: string
  resolved_at?: string | null
}

interface ArtistPerformance {
  id: string
  name: string
  start: Date
  end: Date
  onIncident: TimelineIncident
  offIncident?: TimelineIncident
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  title: string
  subtitle?: string
  details: string[]
  color?: string
}

interface IncidentTimelineProps {
  incidents: TimelineIncident[]
  displayedIncidents: TimelineIncident[]
  filters: FilterState
  onFiltersChange?: (filters: FilterState) => void
  onSelectIncident?: (incident: TimelineIncident) => void
  currentEvent?: any
}

const LANE_HEIGHT = 170
const CONTAINER_HEIGHT = LANE_HEIGHT * 2
const ARTIST_BLOCK_HEIGHT = 34
const INCIDENT_MARKER_SIZE = 16
const RESOLUTION_BAR_HEIGHT = 6
const DEFAULT_PERFORMANCE_MINUTES = 45

const CATEGORY_COLOURS: Record<string, string> = {
  medical: '#ef4444',
  security: '#f97316',
  ejection: '#facc15',
  attendance: '#3b82f6',
  tech: '#6b7280',
  welfare: '#22c55e',
  default: '#6366f1'
}

function parseEventDateTime(event: any, time?: string | null): Date | null {
  if (!event || !event.event_date || !time) return null
  const isoString = `${event.event_date}T${time}`
  const parsed = new Date(isoString)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function isArtistOnStage(incident: TimelineIncident): boolean {
  const text = `${incident.incident_type} ${incident.occurrence}`.toLowerCase()
  return text.includes('artist on stage') || text.includes('main act started') || text.includes('on stage')
}

function isArtistOffStage(incident: TimelineIncident): boolean {
  const text = `${incident.incident_type} ${incident.occurrence}`.toLowerCase()
  return text.includes('artist off stage') || text.includes('main act finished') || text.includes('off stage')
}

function normaliseArtistName(incident: TimelineIncident): string {
  let source = incident.occurrence || incident.action_taken || ''
  if (!source) return 'Artist'

  source = source.replace(/artist\s+(on|off)\s+stage/gi, '')
  source = source.replace(/main act\s+(started|finished)/gi, '')
  source = source.replace(/\b(on|off)\b/gi, '')
  const separators = [':', '-', '–', '—']
  separators.forEach(sep => {
    if (source.includes(sep)) {
      source = source.split(sep).pop() || source
    }
  })
  const cleaned = source
    .replace(/\s+/g, ' ')
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .trim()
  if (!cleaned) {
    return incident.incident_type || 'Artist'
  }
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function getIncidentColour(incident: TimelineIncident): string {
  const type = (incident.incident_type || '').toLowerCase()
  const priority = (incident.priority || '').toLowerCase()

  if (type.includes('medical') || type.includes('first aid')) return CATEGORY_COLOURS.medical
  if (
    type.includes('security') ||
    type.includes('hostile') ||
    type.includes('suspicious') ||
    type.includes('fight') ||
    type.includes('weapon') ||
    type.includes('evacuation') ||
    type.includes('fire') ||
    priority === 'urgent' ||
    priority === 'high'
  ) {
    return CATEGORY_COLOURS.security
  }
  if (type.includes('ejection')) return CATEGORY_COLOURS.ejection
  if (type.includes('crowd') || type.includes('attendance') || type.includes('ingress') || type.includes('queue')) {
    return CATEGORY_COLOURS.attendance
  }
  if (type.includes('tech') || type.includes('power') || type.includes('system') || type.includes('equipment')) {
    return CATEGORY_COLOURS.tech
  }
  if (type.includes('welfare') || type.includes('minor') || type.includes('lost property')) {
    return CATEGORY_COLOURS.welfare
  }
  return CATEGORY_COLOURS.default
}

function formatTime(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(value.getTime())) return '—'
  return value.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(start: Date, end: Date): string {
  const diff = Math.max(0, end.getTime() - start.getTime())
  const minutes = Math.round(diff / 60000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder === 0 ? `${hours} hr` : `${hours} hr ${remainder} min`
}

const zoomPresets = [
  { id: '15m', label: '15m', duration: 15 * 60 * 1000 },
  { id: '30m', label: '30m', duration: 30 * 60 * 1000 },
  { id: '1h', label: '1h', duration: 60 * 60 * 1000 }
] as const

type ZoomPreset = typeof zoomPresets[number]['id'] | 'full'

const LEGEND_ITEMS = [
  { label: 'Medical', color: CATEGORY_COLOURS.medical },
  { label: 'High / Security', color: CATEGORY_COLOURS.security },
  { label: 'Ejection', color: CATEGORY_COLOURS.ejection },
  { label: 'Crowd / Attendance', color: CATEGORY_COLOURS.attendance },
  { label: 'Tech', color: CATEGORY_COLOURS.tech },
  { label: 'Welfare / Minor', color: CATEGORY_COLOURS.welfare }
]

const IncidentTimeline: React.FC<IncidentTimelineProps> = ({
  incidents,
  displayedIncidents,
  filters,
  onFiltersChange,
  onSelectIncident,
  currentEvent
}) => {
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [activeZoom, setActiveZoom] = useState<ZoomPreset>('full')
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    title: '',
    details: []
  })

  useEffect(() => {
    if (!timelineRef.current) return
    const observer = new ResizeObserver(entries => {
      if (!entries.length) return
      setContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(timelineRef.current)
    return () => observer.disconnect()
  }, [])

  const artistPerformances = useMemo<ArtistPerformance[]>(() => {
    const stageLogs = incidents
      .filter(incident => isArtistOnStage(incident) || isArtistOffStage(incident))
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    if (!stageLogs.length) return []

    const onLogs = stageLogs.filter(isArtistOnStage)
    const offLogs = stageLogs.filter(isArtistOffStage)
    const usedOff = new Set<number>()

    const showdown = parseEventDateTime(currentEvent, currentEvent?.show_down_time)
    const fallbackEnd = showdown || parseEventDateTime(currentEvent, currentEvent?.curfew_time)

    return onLogs.map(onLog => {
      const artistName = normaliseArtistName(onLog)
      const onTime = new Date(onLog.timestamp)
      const matchingOff = offLogs.find(offLog => {
        if (usedOff.has(offLog.id)) return false
        return new Date(offLog.timestamp).getTime() > onTime.getTime()
      })

      if (matchingOff) {
        usedOff.add(matchingOff.id)
      }

      const calculatedEnd = matchingOff
        ? new Date(matchingOff.timestamp)
        : fallbackEnd || new Date(onTime.getTime() + DEFAULT_PERFORMANCE_MINUTES * 60000)

      return {
        id: `artist-${onLog.id}`,
        name: artistName,
        start: onTime,
        end: calculatedEnd,
        onIncident: onLog,
        offIncident: matchingOff
      }
    })
  }, [incidents, currentEvent])

  const timelineBounds = useMemo(() => {
    const allTimestamps: number[] = []
    incidents.forEach(incident => {
      const time = new Date(incident.timestamp).getTime()
      if (!Number.isNaN(time)) {
        allTimestamps.push(time)
      }
      if (incident.resolved_at) {
        const resolved = new Date(incident.resolved_at).getTime()
        if (!Number.isNaN(resolved)) {
          allTimestamps.push(resolved)
        }
      }
    })
    artistPerformances.forEach(performance => {
      allTimestamps.push(performance.start.getTime())
      allTimestamps.push(performance.end.getTime())
    })

    if (!allTimestamps.length) {
      const now = Date.now()
      return {
        start: new Date(now - 60 * 60 * 1000),
        end: new Date(now + 60 * 60 * 1000)
      }
    }

    const earliest = Math.min(...allTimestamps)
    const latest = Math.max(...allTimestamps)
    const showdown = parseEventDateTime(currentEvent, currentEvent?.show_down_time)
    const endTarget = showdown ? showdown.getTime() : latest

    return {
      start: new Date(earliest - 60 * 60 * 1000),
      end: new Date(endTarget + 30 * 60 * 1000)
    }
  }, [incidents, artistPerformances, currentEvent])

  const [visibleRange, setVisibleRange] = useState<[Date, Date]>([timelineBounds.start, timelineBounds.end])

  useEffect(() => {
    setVisibleRange([timelineBounds.start, timelineBounds.end])
    setActiveZoom('full')
  }, [timelineBounds.start.getTime(), timelineBounds.end.getTime()])

  const visibleDuration = Math.max(visibleRange[1].getTime() - visibleRange[0].getTime(), 1)

  const clampTime = useCallback(
    (value: number) => {
      const start = visibleRange[0].getTime()
      const end = visibleRange[1].getTime()
      if (value < start) return start
      if (value > end) return end
      return value
    },
    [visibleRange]
  )

  const getPercentForTime = useCallback(
    (time: Date | string): number | null => {
      const date = typeof time === 'string' ? new Date(time) : time
      if (Number.isNaN(date.getTime())) return null
      const clamped = clampTime(date.getTime())
      return ((clamped - visibleRange[0].getTime()) / visibleDuration) * 100
    },
    [clampTime, visibleRange, visibleDuration]
  )

  const handleZoom = useCallback(
    (preset: ZoomPreset) => {
      if (preset === 'full') {
        setVisibleRange([timelineBounds.start, timelineBounds.end])
        setActiveZoom('full')
        return
      }
      const target = zoomPresets.find(item => item.id === preset)
      if (!target) return
      const { duration } = target
      const timelineEnd = timelineBounds.end.getTime()
      const rangeStart = Math.max(timelineBounds.start.getTime(), timelineEnd - duration)
      setVisibleRange([new Date(rangeStart), timelineBounds.end])
      setActiveZoom(preset)
    },
    [timelineBounds]
  )

  const timeTicks = useMemo(() => {
    const ticks: Date[] = []
    const duration = visibleRange[1].getTime() - visibleRange[0].getTime()
    let step = 60 * 60 * 1000
    if (duration <= 90 * 60 * 1000) {
      step = 15 * 60 * 1000
    } else if (duration <= 3 * 60 * 60 * 1000) {
      step = 30 * 60 * 1000
    }
    const start = visibleRange[0].getTime()
    const end = visibleRange[1].getTime()
    const alignedStart = Math.ceil(start / step) * step
    for (let current = alignedStart; current <= end; current += step) {
      ticks.push(new Date(current))
    }
    if (!ticks.length) {
      ticks.push(new Date(start))
      ticks.push(new Date(end))
    }
    return ticks
  }, [visibleRange])

  const uniqueIncidentTypes = useMemo(() => {
    return getUniqueIncidentTypes(incidents.filter(incident => !isArtistOnStage(incident) && !isArtistOffStage(incident)))
  }, [incidents])

  const timelineIncidents = useMemo(() => {
    return displayedIncidents.filter(incident => !isArtistOnStage(incident) && !isArtistOffStage(incident))
  }, [displayedIncidents])

  const hasTimelineData = timelineIncidents.length > 0 || artistPerformances.length > 0

  const showTooltip = useCallback(
    (event: React.MouseEvent, payload: Omit<TooltipState, 'visible'>) => {
      if (!timelineRef.current) return
      const rect = timelineRef.current.getBoundingClientRect()
      setTooltip({
        visible: true,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        title: payload.title,
        subtitle: payload.subtitle,
        details: payload.details,
        color: payload.color
      })
    },
    []
  )

  const hideTooltip = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }))
  }, [])

  const handleTypeToggle = useCallback(
    (type: string) => {
      if (!onFiltersChange) return
      if (filters.types.includes(type)) {
        onFiltersChange({ ...filters, types: filters.types.filter(t => t !== type) })
      } else {
        onFiltersChange({ ...filters, types: [...filters.types, type] })
      }
    },
    [filters, onFiltersChange]
  )

  if (!hasTimelineData) {
    return (
      <div className="bg-white dark:bg-[#23408e] border border-gray-200 dark:border-[#2d437a] rounded-2xl p-12 text-center shadow-xl">
        <div className="text-5xl mb-4">⏱️</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No timeline data yet</h3>
        <p className="text-gray-600 dark:text-gray-300">Artist performances and incidents will appear here once logged.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#23408e] border border-gray-200 dark:border-[#2d437a] rounded-2xl p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">⏱️</span>
            Timeline View
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-300">Compare artist sets with incident activity in real time.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {zoomPresets.map(preset => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleZoom(preset.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                activeZoom === preset.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white/80 dark:bg-transparent text-gray-700 dark:text-gray-200 border-gray-300 dark:border-[#2d437a] hover:bg-blue-50 dark:hover:bg-[#1f2c5d]'
              }`}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleZoom('full')}
            className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
              activeZoom === 'full'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white/80 dark:bg-transparent text-gray-700 dark:text-gray-200 border-gray-300 dark:border-[#2d437a] hover:bg-blue-50 dark:hover:bg-[#1f2c5d]'
            }`}
          >
            Full event
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-300 ml-2">
            Range: {formatTime(visibleRange[0])} – {formatTime(visibleRange[1])}
          </span>
        </div>
      </div>

      {onFiltersChange && uniqueIncidentTypes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => onFiltersChange({ ...filters, types: [] })}
            className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
              filters.types.length === 0
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white/80 dark:bg-transparent text-gray-700 dark:text-gray-200 border-gray-300 dark:border-[#2d437a] hover:bg-blue-50 dark:hover:bg-[#1f2c5d]'
            }`}
          >
            All incidents
          </button>
          {uniqueIncidentTypes.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeToggle(type)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                filters.types.includes(type)
                  ? 'bg-blue-100 text-blue-700 border-blue-400 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-500'
                  : 'bg-white/80 dark:bg-transparent text-gray-700 dark:text-gray-200 border-gray-300 dark:border-[#2d437a] hover:bg-blue-50 dark:hover:bg-[#1f2c5d]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-stretch gap-4">
        <div className="w-24 flex flex-col text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
          <div className="flex-1 flex items-center justify-end pr-2 border-b border-gray-200 dark:border-[#2d437a] text-gray-700 dark:text-gray-100">
            Artists
          </div>
          <div className="flex-1 flex items-center justify-end pr-2 text-gray-700 dark:text-gray-100">
            Incidents
          </div>
        </div>
        <div
          ref={timelineRef}
          className="relative flex-1 border border-gray-200 dark:border-[#2d437a] rounded-2xl bg-white dark:bg-[#1a2754] overflow-hidden"
          style={{ height: `${CONTAINER_HEIGHT}px` }}
          onMouseLeave={hideTooltip}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-blue-50/60 to-transparent dark:from-blue-900/30 dark:to-transparent border-b border-gray-200 dark:border-[#2d437a]" />
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-slate-100/70 to-transparent dark:from-slate-900/30 dark:to-transparent" />
          </div>

          {timeTicks.map(tick => {
            const left = getPercentForTime(tick)
            if (left === null) return null
            return (
              <div key={tick.getTime()} className="absolute top-0 bottom-0" style={{ left: `${left}%` }}>
                <div className="absolute top-0 bottom-0 w-px bg-gray-200 dark:bg-[#2d437a]/70" />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-medium text-gray-500 dark:text-gray-300 bg-white/80 dark:bg-[#1f2c5d] px-2 py-0.5 rounded-full shadow-sm">
                  {formatTime(tick)}
                </div>
              </div>
            )
          })}

          {artistPerformances.map(performance => {
            const startPercent = getPercentForTime(performance.start)
            const endPercent = getPercentForTime(performance.end)
            if (startPercent === null || endPercent === null) return null
            const widthPercent = Math.max(0, endPercent - startPercent)
            if (widthPercent <= 0.2) return null
            const top = (LANE_HEIGHT - ARTIST_BLOCK_HEIGHT) / 2
            const durationLabel = formatDuration(performance.start, performance.end)
            return (
              <div
                key={performance.id}
                className="absolute flex items-center px-3 text-xs font-semibold text-purple-800 dark:text-purple-100 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/40 border border-purple-200 dark:border-purple-700 rounded-xl shadow-md cursor-pointer hover:shadow-lg"
                style={{
                  left: `${startPercent}%`,
                  width: `${widthPercent}%`,
                  top,
                  height: `${ARTIST_BLOCK_HEIGHT}px`
                }}
                onMouseEnter={event =>
                  showTooltip(event, {
                    title: performance.name,
                    subtitle: `${formatTime(performance.start)} – ${formatTime(performance.end)}`,
                    details: [
                      `Log #: ${performance.onIncident.log_number}`,
                      performance.offIncident
                        ? `Completed • ${durationLabel}`
                        : `Ongoing • ${durationLabel}`
                    ],
                    color: '#a855f7'
                  })
                }
                onMouseMove={event =>
                  showTooltip(event, {
                    title: performance.name,
                    subtitle: `${formatTime(performance.start)} – ${formatTime(performance.end)}`,
                    details: [
                      `Log #: ${performance.onIncident.log_number}`,
                      performance.offIncident
                        ? `Completed • ${durationLabel}`
                        : `Ongoing • ${durationLabel}`
                    ],
                    color: '#a855f7'
                  })
                }
                onMouseLeave={hideTooltip}
                onClick={() => onSelectIncident?.(performance.onIncident)}
              >
                <span className="truncate">{performance.name}</span>
              </div>
            )
          })}

          {timelineIncidents.map(incident => {
            const left = getPercentForTime(incident.timestamp)
            if (left === null) return null
            if (left < -5 || left > 105) return null
            const color = getIncidentColour(incident)
            const top = LANE_HEIGHT + LANE_HEIGHT / 2 - INCIDENT_MARKER_SIZE / 2
            const statusText = incident.is_closed ? 'Closed' : 'Open'
            const resolutionEnd = incident.resolved_at
              ? new Date(incident.resolved_at)
              : new Date()
            const start = new Date(incident.timestamp)
            const resolutionStart = getPercentForTime(start)
            const resolutionEndPercent = getPercentForTime(resolutionEnd)
            const resolutionWidth =
              resolutionStart !== null && resolutionEndPercent !== null
                ? Math.max(0, resolutionEndPercent - resolutionStart)
                : 0

            const details = [
              `Log #: ${incident.log_number}`,
              `Status: ${statusText}`,
              `From ${incident.callsign_from || 'Unknown'} → ${incident.callsign_to || 'Unknown'}`
            ]
            if (incident.resolved_at) {
              details.push(`Resolved ${formatTime(incident.resolved_at)}`)
            } else {
              details.push('Resolution pending')
            }

            return (
              <React.Fragment key={incident.id}>
                {resolutionWidth > 0.2 && (
                  <div
                    className="absolute rounded-full bg-gradient-to-r from-blue-200/70 to-blue-500/50"
                    style={{
                      left: `${Math.max(0, resolutionStart ?? 0)}%`,
                      width: `${resolutionWidth}%`,
                      top: LANE_HEIGHT + LANE_HEIGHT * 0.3,
                      height: `${RESOLUTION_BAR_HEIGHT}px`
                    }}
                  />
                )}
                <div
                  className="absolute rounded-full shadow-md border border-white/70 dark:border-white/20 hover:shadow-lg transition-transform duration-150 cursor-pointer"
                  style={{
                    left: `${left}%`,
                    top,
                    width: INCIDENT_MARKER_SIZE,
                    height: INCIDENT_MARKER_SIZE,
                    backgroundColor: color,
                    transform: 'translate(-50%, 0)'
                  }}
                  onMouseEnter={event =>
                    showTooltip(event, {
                      title: incident.incident_type,
                      subtitle: formatTime(incident.timestamp),
                      details,
                      color
                    })
                  }
                  onMouseMove={event =>
                    showTooltip(event, {
                      title: incident.incident_type,
                      subtitle: formatTime(incident.timestamp),
                      details,
                      color
                    })
                  }
                  onMouseLeave={hideTooltip}
                  onClick={() => onSelectIncident?.(incident)}
                />
              </React.Fragment>
            )
          })}

          {tooltip.visible && (
            <div
              className="absolute z-40 max-w-xs bg-slate-900/95 text-white text-xs rounded-lg shadow-lg px-3 py-2"
              style={{
                left: Math.min(containerWidth - 180, Math.max(8, tooltip.x + 16)),
                top: Math.min(CONTAINER_HEIGHT - 80, Math.max(8, tooltip.y - 24)),
                pointerEvents: 'none'
              }}
            >
              <div className="font-semibold text-sm flex items-center gap-2">
                {tooltip.color && (
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: tooltip.color }}
                  />
                )}
                {tooltip.title}
              </div>
              {tooltip.subtitle && (
                <div className="text-[11px] text-blue-200 mt-1">{tooltip.subtitle}</div>
              )}
              {tooltip.details.map((line, index) => (
                <div key={index} className="text-[11px] text-slate-200 mt-1">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-300">
        {LEGEND_ITEMS.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="w-12 h-[6px] rounded-full bg-gradient-to-r from-blue-200/70 to-blue-500/50" />
          <span>Resolution window</span>
        </div>
      </div>
    </div>
  )
}

export default IncidentTimeline
