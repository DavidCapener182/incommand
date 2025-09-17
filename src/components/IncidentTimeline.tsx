'use client'

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import { supabase } from '../lib/supabase'
import { FaRegClock } from 'react-icons/fa'
import { FilterState } from '../utils/incidentFilters'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export type IncidentRecord = {
  id: number
  log_number?: string | null
  timestamp: string
  incident_type: string
  occurrence?: string | null
  action_taken?: string | null
  status?: string | null
  priority?: string | null
  resolved_at?: string | null
  responded_at?: string | null
  updated_at?: string | null
  is_closed?: boolean | null
}

type ArtistPerformanceBlock = {
  id: string
  artistName: string
  start: Date
  end: Date
  color: string
  onStageIncident: IncidentRecord
  offStageIncident?: IncidentRecord
  endSource: 'logged' | 'showdown' | 'estimated'
}

type IssueBlock = {
  id: number
  incident: IncidentRecord
  start: Date
  end: Date
  color: string
  isPlaceholder: boolean
  hasEnd: boolean
}

type HoverInfo = {
  title: string
  typeLabel: string
  idLabel?: string
  description?: string
  start: Date
  end?: Date | null
  endHint?: string
  leftPercent: number
}

type IncidentTimelineProps = {
  incidents?: IncidentRecord[]
  displayedIncidents?: IncidentRecord[]
  filters?: FilterState
  onFiltersChange?: (filters: FilterState) => void
  currentEvent?: any
  onIncidentSelect?: (incident: IncidentRecord) => void
  onSelectIncident?: (incident: IncidentRecord) => void
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

const ZOOM_PRESETS = {
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000
} as const

type ZoomLevel = keyof typeof ZOOM_PRESETS | 'full'

const ARTIST_COLORS = [
  '#7C3AED',
  '#2563EB',
  '#F97316',
  '#EC4899',
  '#22C55E',
  '#0EA5E9',
  '#F59E0B',
  '#14B8A6',
  '#6366F1',
  '#EF4444'
]

const ISSUE_CATEGORY_COLORS = {
  medical: '#EF4444',
  security: '#F97316',
  ejection: '#FACC15',
  crowd: '#3B82F6',
  tech: '#6B7280',
  welfare: '#22C55E',
  default: '#6B7280'
} as const

const parseTimestamp = (timestamp: string | null | undefined): number | null => {
  if (!timestamp) return null
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

const hexToRgba = (hex: string, alpha: number) => {
  const cleaned = hex.replace('#', '')
  if (cleaned.length !== 6) return hex
  const r = parseInt(cleaned.slice(0, 2), 16)
  const g = parseInt(cleaned.slice(2, 4), 16)
  const b = parseInt(cleaned.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const normaliseArtistName = (raw?: string | null) => {
  if (!raw) return 'Artist'
  let name = raw.trim()
  name = name.replace(/\b(on|off)\s+stage.*$/i, '').trim()
  name = name.replace(/[,\-–].*$/, '').trim()
  return name || 'Artist'
}

const isArtistOnStage = (incident: IncidentRecord) =>
  incident.incident_type?.toLowerCase() === 'artist on stage'

const isArtistOffStage = (incident: IncidentRecord) =>
  incident.incident_type?.toLowerCase() === 'artist off stage'

const isShowdownIncident = (incident: IncidentRecord) =>
  incident.incident_type?.toLowerCase() === 'showdown'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const formatTime = (date: Date | null | undefined) => {
  if (!date) return '—'
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatFullTime = (date: Date | null | undefined) => {
  if (!date) return '—'
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getIssueCategory = (incident: IncidentRecord): keyof typeof ISSUE_CATEGORY_COLORS => {
  const type = incident.incident_type?.toLowerCase() ?? ''
  if (type.includes('medical') || type.includes('first aid') || type.includes('medic')) {
    return 'medical'
  }
  if (
    type.includes('ejection') ||
    type.includes('removed') ||
    type.includes('refusal')
  ) {
    return 'ejection'
  }
  if (
    type.includes('crowd') ||
    type.includes('attendance') ||
    type.includes('entry') ||
    type.includes('queue') ||
    type.includes('ingress')
  ) {
    return 'crowd'
  }
  if (
    type.includes('tech') ||
    type.includes('technical') ||
    type.includes('site issue') ||
    type.includes('power') ||
    type.includes('sound') ||
    type.includes('lighting') ||
    type.includes('equipment')
  ) {
    return 'tech'
  }
  if (
    type.includes('welfare') ||
    type.includes('lost property') ||
    type.includes('missing') ||
    type.includes('accessibility') ||
    type.includes('minor') ||
    type.includes('intox')
  ) {
    return 'welfare'
  }
  if (
    type.includes('security') ||
    type.includes('breach') ||
    type.includes('fight') ||
    type.includes('hostile') ||
    type.includes('weapon') ||
    type.includes('code') ||
    type.includes('evacuation') ||
    type.includes('fire') ||
    type.includes('aggressive') ||
    type.includes('suspicious')
  ) {
    return 'security'
  }
  return 'default'
}

const getBarDimensions = (
  start: Date,
  end: Date,
  viewWindow: { start: Date; end: Date }
) => {
  const visibleStart = viewWindow.start.getTime()
  const visibleEnd = viewWindow.end.getTime()
  const startTime = start.getTime()
  const endTime = end.getTime()

  if (endTime <= visibleStart || startTime >= visibleEnd) {
    return null
  }

  const clampedStart = Math.max(startTime, visibleStart)
  const clampedEnd = Math.max(clampedStart, Math.min(endTime, visibleEnd))
  const range = visibleEnd - visibleStart
  const left = ((clampedStart - visibleStart) / range) * 100
  const width = Math.max(0.7, ((clampedEnd - clampedStart) / range) * 100)

  return {
    left,
    width,
    clampedStart,
    clampedEnd
  }
}

const IncidentTimeline: React.FC<IncidentTimelineProps> = ({
  incidents = [],
  displayedIncidents = [],
  currentEvent,
  onIncidentSelect,
  onSelectIncident
}) => {
  const [eventDetails, setEventDetails] = useState<EventSchedule | null>(null)
  const [selectedIssueTypes, setSelectedIssueTypes] = useState<string[]>([])
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('full')
  const [viewWindow, setViewWindow] = useState<{ start: Date; end: Date } | null>(null)
  const [hoveredItem, setHoveredItem] = useState<HoverInfo | null>(null)

  useEffect(() => {
    if (!currentEvent?.id) return

    const fetchEventDetails = async () => {
      try {
        const { data } = await supabase
          .from('events')
          .select(
            'event_date, doors_open_time, main_act_start_time, support_act_times, showdown_time, event_end_time, curfew_time'
          )
          .eq('id', currentEvent.id)
          .maybeSingle()

        if (data) {
          setEventDetails({
            event_date: data.event_date,
            doors_open_time: data.doors_open_time,
            main_act_start_time: data.main_act_start_time,
            support_act_times: data.support_act_times,
            showdown_time: data.showdown_time,
            event_end_time: data.event_end_time,
            curfew_time: data.curfew_time
          })
        }
      } catch (error) {
        console.error('Error fetching event details:', error)
      }
    }

    fetchEventDetails()
  }, [currentEvent?.id])

  const timelineIncidents = useMemo(() => {
    if (displayedIncidents && displayedIncidents.length > 0) {
      return displayedIncidents
    }
    return incidents
  }, [incidents, displayedIncidents])

  const showdownTime = useMemo(() => {
    const showdownIncidents = timelineIncidents
      .filter(isShowdownIncident)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    if (showdownIncidents.length > 0) {
      const lastShowdown = showdownIncidents[showdownIncidents.length - 1]
      const parsed = parseTimestamp(lastShowdown.timestamp)
      if (parsed) return new Date(parsed)
    }

    const eventShowdown = parseTimestamp(eventDetails?.showdown_time)
    if (eventShowdown) return new Date(eventShowdown)

    return null
  }, [timelineIncidents, eventDetails?.showdown_time])

  const issueTypeOptions = useMemo(() => {
    const types = new Set<string>()
    timelineIncidents.forEach(incident => {
      if (isArtistOnStage(incident) || isArtistOffStage(incident) || isShowdownIncident(incident)) {
        return
      }
      if (incident.incident_type) {
        types.add(incident.incident_type)
      }
    })
    return Array.from(types).sort((a, b) => a.localeCompare(b))
  }, [timelineIncidents])

  useEffect(() => {
    if (issueTypeOptions.length === 0) {
      setSelectedIssueTypes([])
      return
    }

    setSelectedIssueTypes(prev => {
      if (prev.length === 0) {
        return issueTypeOptions
      }
      const filtered = prev.filter(type => issueTypeOptions.includes(type))
      if (filtered.length === 0) {
        return issueTypeOptions
      }
      if (filtered.length === prev.length && filtered.every((value, index) => value === prev[index])) {
        return prev
      }
      return filtered
    })
  }, [issueTypeOptions])

  const processedData = useMemo(() => {
    if (!timelineIncidents || timelineIncidents.length === 0) {
      return {
        artistPerformances: [] as ArtistPerformanceBlock[],
        issueBlocks: [] as IssueBlock[],
        range: null as { start: Date; end: Date } | null
      }
    }

    const artistGroups = new Map<string, { on: IncidentRecord[]; off: IncidentRecord[] }>()
    const onStageIncidents: IncidentRecord[] = []

    timelineIncidents.forEach(incident => {
      if (isArtistOnStage(incident)) {
        onStageIncidents.push(incident)
        const name = normaliseArtistName(incident.occurrence)
        if (!artistGroups.has(name)) {
          artistGroups.set(name, { on: [], off: [] })
        }
        artistGroups.get(name)!.on.push(incident)
      } else if (isArtistOffStage(incident)) {
        const name = normaliseArtistName(incident.occurrence)
        if (!artistGroups.has(name)) {
          artistGroups.set(name, { on: [], off: [] })
        }
        artistGroups.get(name)!.off.push(incident)
      }
    })

    onStageIncidents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    const mainActOnStage = onStageIncidents.length > 0 ? onStageIncidents[onStageIncidents.length - 1] : null

    const performances: ArtistPerformanceBlock[] = []

    const artistNames = Array.from(artistGroups.keys())
    artistNames.forEach(name => {
      const group = artistGroups.get(name)!
      const sortedOn = group.on.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      const sortedOff = group.off.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      const usedOff = new Set<number>()

      sortedOn.forEach(onIncident => {
        const onTime = parseTimestamp(onIncident.timestamp)
        if (!onTime) return

        let matchedOff: IncidentRecord | undefined
        let endSource: ArtistPerformanceBlock['endSource'] = 'estimated'

        for (let i = 0; i < sortedOff.length; i++) {
          if (usedOff.has(i)) continue
          const offIncident = sortedOff[i]
          const offTime = parseTimestamp(offIncident.timestamp)
          if (!offTime) continue
          if (offTime >= onTime) {
            matchedOff = offIncident
            usedOff.add(i)
            endSource = 'logged'
            break
          }
        }

        if (!matchedOff && mainActOnStage && showdownTime && onIncident.id === mainActOnStage.id) {
          endSource = 'showdown'
        }

        const startDate = new Date(onTime)
        let endDate: Date
        if (endSource === 'logged' && matchedOff) {
          const offTime = parseTimestamp(matchedOff.timestamp)
          endDate = offTime ? new Date(offTime) : new Date(onTime + 30 * 60 * 1000)
        } else if (endSource === 'showdown' && showdownTime) {
          endDate = new Date(showdownTime)
        } else {
          endDate = new Date(onTime + 30 * 60 * 1000)
        }

        performances.push({
          id: `artist-${onIncident.id}`,
          artistName: name,
          start: startDate,
          end: endDate,
          color: '#7C3AED',
          onStageIncident: onIncident,
          offStageIncident: matchedOff,
          endSource
        })
      })
    })

    performances.sort((a, b) => a.start.getTime() - b.start.getTime())

    const uniqueArtists = Array.from(new Set(performances.map(perf => perf.artistName)))
    const colorMap = new Map<string, string>()
    uniqueArtists.forEach((artist, index) => {
      colorMap.set(artist, ARTIST_COLORS[index % ARTIST_COLORS.length])
    })
    performances.forEach(perf => {
      const assigned = colorMap.get(perf.artistName)
      if (assigned) {
        perf.color = assigned
      }
    })

    const issueBlocks: IssueBlock[] = []
    timelineIncidents.forEach(incident => {
      if (
        isArtistOnStage(incident) ||
        isArtistOffStage(incident) ||
        isShowdownIncident(incident)
      ) {
        return
      }

      if (selectedIssueTypes.length > 0 && !selectedIssueTypes.includes(incident.incident_type)) {
        return
      }

      const startTime = parseTimestamp(incident.timestamp)
      if (!startTime) return

      const resolvedTime = parseTimestamp(incident.resolved_at) ?? null
      const updatedTime = parseTimestamp(incident.updated_at) ?? null

      let hasEnd = Boolean(resolvedTime)
      let endTime: number

      if (resolvedTime) {
        endTime = resolvedTime
      } else if (incident.is_closed && updatedTime) {
        endTime = updatedTime
        hasEnd = true
      } else {
        endTime = startTime + 60 * 60 * 1000
      }

      const colorKey = getIssueCategory(incident)
      const color = ISSUE_CATEGORY_COLORS[colorKey]

      issueBlocks.push({
        id: incident.id,
        incident,
        start: new Date(startTime),
        end: new Date(endTime),
        color,
        isPlaceholder: !hasEnd,
        hasEnd
      })
    })

    issueBlocks.sort((a, b) => a.start.getTime() - b.start.getTime())

    const timelinePoints: number[] = []
    performances.forEach(perf => {
      timelinePoints.push(perf.start.getTime(), perf.end.getTime())
    })
    issueBlocks.forEach(block => {
      timelinePoints.push(block.start.getTime(), block.end.getTime())
    })
    const showdownPoint = showdownTime?.getTime()
    if (showdownPoint) {
      timelinePoints.push(showdownPoint)
    }

    if (timelinePoints.length === 0) {
      return {
        artistPerformances: performances,
        issueBlocks,
        range: null as { start: Date; end: Date } | null
      }
    }

    const minTime = Math.min(...timelinePoints)
    const maxTime = Math.max(...timelinePoints)
    const padding = Math.max(15 * 60 * 1000, Math.round((maxTime - minTime) * 0.05))

    return {
      artistPerformances: performances,
      issueBlocks,
      range: {
        start: new Date(minTime - padding),
        end: new Date(maxTime + padding)
      }
    }
  }, [timelineIncidents, selectedIssueTypes, showdownTime])

  const fullRange = processedData.range
  const artistPerformances = processedData.artistPerformances
  const issueBlocks = processedData.issueBlocks

  useEffect(() => {
    if (!fullRange) {
      setViewWindow(null)
      return
    }

    setViewWindow(prev => {
      if (!prev) {
        return {
          start: new Date(fullRange.start),
          end: new Date(fullRange.end)
        }
      }
      const withinRange =
        prev.start.getTime() >= fullRange.start.getTime() &&
        prev.end.getTime() <= fullRange.end.getTime()
      if (!withinRange || zoomLevel === 'full') {
        return {
          start: new Date(fullRange.start),
          end: new Date(fullRange.end)
        }
      }
      return prev
    })
  }, [fullRange?.start.getTime(), fullRange?.end.getTime(), zoomLevel])

  const handleZoomChange = useCallback(
    (level: ZoomLevel) => {
      if (!fullRange) return
      setZoomLevel(level)
      if (level === 'full') {
        setViewWindow({
          start: new Date(fullRange.start),
          end: new Date(fullRange.end)
        })
        return
      }

      const duration = ZOOM_PRESETS[level]
      setViewWindow(prev => {
        const desiredStart = prev ? prev.start.getTime() : fullRange.end.getTime() - duration
        const minStart = fullRange.start.getTime()
        const maxStart = Math.max(minStart, fullRange.end.getTime() - duration)
        const clampedStart = clamp(desiredStart, minStart, maxStart)
        const startDate = new Date(clampedStart)
        return {
          start: startDate,
          end: new Date(startDate.getTime() + duration)
        }
      })
    },
    [fullRange]
  )

  const handlePan = useCallback(
    (direction: 'back' | 'forward') => {
      if (!viewWindow || !fullRange) return
      if (zoomLevel === 'full') return

      const duration = viewWindow.end.getTime() - viewWindow.start.getTime()
      const shift = duration * 0.5 * (direction === 'back' ? -1 : 1)
      const minStart = fullRange.start.getTime()
      const maxStart = Math.max(minStart, fullRange.end.getTime() - duration)
      const nextStart = clamp(viewWindow.start.getTime() + shift, minStart, maxStart)
      const nextEnd = nextStart + duration

      setViewWindow({ start: new Date(nextStart), end: new Date(nextEnd) })
    },
    [viewWindow, fullRange, zoomLevel]
  )

  const markers = useMemo(() => {
    if (!viewWindow) return [] as Date[]
    const duration = viewWindow.end.getTime() - viewWindow.start.getTime()
    const segments = duration <= 30 * 60 * 1000 ? 4 : 6
    const values: Date[] = []
    for (let i = 0; i <= segments; i++) {
      const time = viewWindow.start.getTime() + (duration * i) / segments
      values.push(new Date(time))
    }
    return values
  }, [viewWindow])

  const handleSelect = useCallback(
    (incident: IncidentRecord) => {
      const callback = onIncidentSelect ?? onSelectIncident
      if (callback) {
        callback(incident)
      }
    },
    [onIncidentSelect, onSelectIncident]
  )

  if (!timelineIncidents || timelineIncidents.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 bg-white/90 dark:bg-[#203a79]/70 border border-gray-200 dark:border-[#2d437a]/50 rounded-xl px-4 py-3 shadow-sm">
          <FaRegClock className="text-blue-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Incident Timeline</span>
        </div>
        <div className="bg-white dark:bg-[#182447] border border-gray-200 dark:border-[#2d437a] rounded-3xl shadow-xl p-8 flex items-center justify-center text-gray-500 dark:text-gray-300">
          No incidents recorded yet. Timeline updates as logs arrive.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-white/90 dark:bg-[#203a79]/70 border border-gray-200 dark:border-[#2d437a]/50 rounded-xl px-4 py-3 shadow-sm">
        <FaRegClock className="text-blue-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Incident Timeline</span>
      </div>

      <div className="bg-white/95 dark:bg-[#182447]/80 border border-gray-200 dark:border-[#2d437a]/60 rounded-3xl shadow-xl p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Timeline View</span>
            {viewWindow && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Visible range: {formatFullTime(viewWindow.start)} – {formatFullTime(viewWindow.end)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#223266] px-2 py-1 rounded-full">
              {(['15m', '30m', '1h', 'full'] as ZoomLevel[]).map(level => (
                <button
                  key={level}
                  onClick={() => handleZoomChange(level)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    zoomLevel === level
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {level === 'full' ? 'Full Event' : `Zoom ${level}`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#223266] px-2 py-1 rounded-full">
              <button
                onClick={() => handlePan('back')}
                disabled={!viewWindow || !fullRange || zoomLevel === 'full'}
                className="p-2 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/70 dark:hover:bg-white/10"
              >
                <ChevronLeftIcon className="h-4 w-4 text-gray-600 dark:text-gray-200" />
              </button>
              <button
                onClick={() => handlePan('forward')}
                disabled={!viewWindow || !fullRange || zoomLevel === 'full'}
                className="p-2 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/70 dark:hover:bg-white/10"
              >
                <ChevronRightIcon className="h-4 w-4 text-gray-600 dark:text-gray-200" />
              </button>
            </div>
          </div>
        </div>

        {issueTypeOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Filter issues:</span>
            <button
              onClick={() => setSelectedIssueTypes(issueTypeOptions)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                selectedIssueTypes.length === issueTypeOptions.length
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
            >
              All
            </button>
            {issueTypeOptions.map(type => {
              const isActive = selectedIssueTypes.includes(type)
              return (
                <button
                  key={type}
                  onClick={() =>
                    setSelectedIssueTypes(prev => {
                      if (prev.includes(type)) {
                        const next = prev.filter(item => item !== type)
                        return next.length === 0 ? prev : next
                      }
                      return [...prev, type]
                    })
                  }
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    isActive
                      ? 'bg-blue-500/90 text-white border-blue-500'
                      : 'border-gray-300 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  {type}
                </button>
              )
            })}
          </div>
        )}

        <div className="relative">
          <div className="border border-gray-200 dark:border-[#2d437a] rounded-2xl overflow-hidden bg-white dark:bg-[#15203f]">
            <div className="relative h-10 border-b border-gray-200 dark:border-[#2d437a] bg-gray-50/70 dark:bg-[#1d2f63]">
              {markers.map((marker, index) => {
                const percent = markers.length > 1 ? (index / (markers.length - 1)) * 100 : 0
                return (
                  <div key={marker.getTime()} className="absolute bottom-0 top-0" style={{ left: `${percent}%` }}>
                    <div className="absolute top-0 bottom-0 w-px bg-gray-200/70 dark:bg-[#2d437a]/70" />
                    <div className="absolute bottom-0 transform -translate-x-1/2 translate-y-full text-[10px] font-medium text-gray-500 dark:text-gray-300 whitespace-nowrap">
                      {formatTime(marker)}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="relative divide-y divide-gray-200 dark:divide-[#223266]">
              <div className="relative h-24">
                <div className="absolute inset-0 flex">
                  <div className="w-32 flex-shrink-0 border-r border-gray-200 dark:border-[#223266] bg-gray-50/70 dark:bg-[#1d2f63] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Artist Performance</div>
                  <div className="flex-1 relative">
                    {viewWindow && artistPerformances.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
                        No artist performances logged
                      </div>
                    )}
                    {viewWindow &&
                      artistPerformances.map(performance => {
                        const dims = getBarDimensions(performance.start, performance.end, viewWindow)
                        if (!dims) return null
                        const midpoint = dims.left + dims.width / 2
                        return (
                          <div
                            key={performance.id}
                            onMouseEnter={() =>
                              setHoveredItem({
                                title: performance.artistName,
                                typeLabel: 'Artist Performance',
                                idLabel: performance.onStageIncident.log_number
                                  ? `Log #${performance.onStageIncident.log_number} · ID ${performance.onStageIncident.id}`
                                  : `ID ${performance.onStageIncident.id}`,
                                description: performance.endSource === 'showdown'
                                  ? 'Ends at Showdown'
                                  : performance.endSource === 'estimated'
                                    ? 'End time estimated'
                                    : undefined,
                                start: performance.start,
                                end: performance.end,
                                leftPercent: clamp(midpoint, 8, 92)
                              })
                            }
                            onMouseLeave={() => setHoveredItem(null)}
                            onClick={() => handleSelect(performance.onStageIncident)}
                            className="absolute top-1/2 -translate-y-1/2 h-12 rounded-xl shadow-md border border-white/40 cursor-pointer flex items-center justify-center px-3"
                            style={{
                              left: `${dims.left}%`,
                              width: `${dims.width}%`,
                              background: `linear-gradient(135deg, ${hexToRgba(performance.color, 0.85)}, ${hexToRgba(performance.color, 0.95)})`,
                              minWidth: '64px'
                            }}
                          >
                            <span className="text-sm font-semibold text-white whitespace-nowrap truncate drop-shadow">
                              {performance.artistName}
                            </span>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>

              <div className="relative h-24">
                <div className="absolute inset-0 flex">
                  <div className="w-32 flex-shrink-0 border-r border-gray-200 dark:border-[#223266] bg-gray-50/70 dark:bg-[#1d2f63] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Issues</div>
                  <div className="flex-1 relative">
                    {viewWindow && issueBlocks.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
                        No issues match the selected filters
                      </div>
                    )}
                    {viewWindow &&
                      issueBlocks.map(block => {
                        const dims = getBarDimensions(block.start, block.end, viewWindow)
                        if (!dims) return null
                        const midpoint = dims.left + dims.width / 2
                        const showLabel = dims.width > 8
                        return (
                          <div
                            key={block.id}
                            onMouseEnter={() =>
                              setHoveredItem({
                                title: block.incident.incident_type,
                                typeLabel: 'Issue',
                                idLabel: block.incident.log_number
                                  ? `Log #${block.incident.log_number} · ID ${block.incident.id}`
                                  : `ID ${block.incident.id}`,
                                description: block.incident.occurrence || undefined,
                                start: block.start,
                                end: block.hasEnd ? block.end : undefined,
                                endHint: block.isPlaceholder ? 'Duration approximate (1 hour placeholder)' : undefined,
                                leftPercent: clamp(midpoint, 8, 92)
                              })
                            }
                            onMouseLeave={() => setHoveredItem(null)}
                            onClick={() => handleSelect(block.incident)}
                            className={`absolute top-1/2 -translate-y-1/2 h-10 rounded-lg border cursor-pointer flex items-center ${
                              block.isPlaceholder ? 'border-dashed' : 'border-solid'
                            }`}
                            style={{
                              left: `${dims.left}%`,
                              width: `${dims.width}%`,
                              minWidth: '12px',
                              backgroundColor: block.isPlaceholder
                                ? hexToRgba(block.color, 0.2)
                                : hexToRgba(block.color, 0.85),
                              borderColor: block.color
                            }}
                          >
                            {showLabel && (
                              <span className="px-3 text-xs font-semibold text-white whitespace-nowrap truncate">
                                {block.incident.incident_type}
                              </span>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {hoveredItem && (
            <div
              className="absolute z-50"
              style={{ left: `${hoveredItem.leftPercent}%`, top: '-8px', transform: 'translate(-50%, -100%)' }}
            >
              <div className="bg-gray-900 text-white text-xs rounded-lg shadow-2xl px-4 py-3 max-w-xs border border-gray-700">
                <div className="font-semibold text-sm">{hoveredItem.title}</div>
                <div className="text-gray-300">{hoveredItem.typeLabel}{hoveredItem.idLabel ? ` • ${hoveredItem.idLabel}` : ''}</div>
                <div className="mt-2 space-y-1 text-[11px] text-gray-300">
                  <div>Start: {formatFullTime(hoveredItem.start)}</div>
                  {hoveredItem.end && <div>End: {formatFullTime(hoveredItem.end)}</div>}
                  {hoveredItem.endHint && <div className="text-yellow-300">{hoveredItem.endHint}</div>}
                  {hoveredItem.description && (
                    <div className="text-gray-400">
                      {hoveredItem.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ISSUE_CATEGORY_COLORS.medical }}></span>
            Medical
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ISSUE_CATEGORY_COLORS.security }}></span>
            Security / High Priority
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ISSUE_CATEGORY_COLORS.ejection }}></span>
            Ejection
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ISSUE_CATEGORY_COLORS.crowd }}></span>
            Crowd & Attendance
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ISSUE_CATEGORY_COLORS.tech }}></span>
            Technical
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ISSUE_CATEGORY_COLORS.welfare }}></span>
            Welfare / Minor
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-dashed border-gray-400"></span>
            Dotted border indicates estimated end time
          </div>
        </div>
      </div>
    </div>
  )
}

export default IncidentTimeline
