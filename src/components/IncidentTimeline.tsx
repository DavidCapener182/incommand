'use client'

import React, { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '../lib/supabase'
import { getEnhancedChartColors } from '../utils/chartEnhancements'
import { FaCheckCircle, FaExclamationTriangle, FaFilter, FaRegClock } from 'react-icons/fa'
import { motion } from 'framer-motion'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

type IncidentRecord = {
  id: number
  log_number?: string
  timestamp: string
  incident_type: string
  occurrence?: string
  action_taken?: string
  status?: string
  priority?: string
  is_closed?: boolean
  resolved_at?: string | null
  responded_at?: string | null
  updated_at?: string | null
}

type IncidentTimelineProps = {
  incidents: IncidentRecord[]
  eventId?: string | null
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

const parseEventTime = (event: EventSchedule | null, time: string | null | undefined): number | null => {
  if (!event || !time) return null
  const hasDate = /\d{4}-\d{2}-\d{2}/.test(time)
  if (hasDate) {
    const parsed = new Date(time)
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
  }
  if (!event.event_date) return null
  const parsed = new Date(`${event.event_date}T${time}`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
}

const parseTimestamp = (value: string | null | undefined) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
}

const timeFormatter = (value: number | null) => {
  if (value === null) return '—'
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (start: number, end: number | null) => {
  if (!end) return 'In progress'
  const diffMs = Math.max(0, end - start)
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) {
    const seconds = Math.floor(diffMs / 1000)
    return `${seconds}s`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

const INCIDENT_COLOR_MAP: Record<string, string> = {
  Medical: '#ef4444',
  Security: '#f97316',
  'Hostile Act': '#f97316',
  'Counter-Terror Alert': '#f97316',
  Ejection: '#facc15',
  'Queue Build-Up': '#3b82f6',
  Attendance: '#3b82f6',
  Crowd: '#3b82f6',
  Technical: '#9ca3af',
  'Technical Issue': '#9ca3af',
  Welfare: '#22c55e',
  'Minor Incident': '#22c55e'
}

const getIncidentColor = (incident: IncidentRecord) => {
  if (incident.priority && incident.priority.toLowerCase() === 'medical') {
    return INCIDENT_COLOR_MAP.Medical
  }
  const key = Object.keys(INCIDENT_COLOR_MAP).find(type => incident.incident_type.toLowerCase().includes(type.toLowerCase()))
  if (key) return INCIDENT_COLOR_MAP[key]
  if (incident.priority) {
    const priority = incident.priority.toLowerCase()
    if (priority === 'high' || priority === 'urgent') return '#f97316'
    if (priority === 'medium') return '#facc15'
  }
  return '#6366f1'
}

const extractArtistName = (incident: IncidentRecord) => {
  const sources = [incident.occurrence, incident.action_taken, incident.status]
  for (const source of sources) {
    if (!source) continue
    const cleaned = source
      .replace(/artist (on|off) stage/gi, '')
      .replace(/performance/gi, '')
      .replace(/set/gi, '')
      .replace(/:+/g, ' ')
      .trim()
    if (cleaned) {
      const [firstPart] = cleaned.split(/[\-|,]/)
      const candidate = firstPart.trim()
      if (candidate.length) {
        return candidate.replace(/^is\s+/i, '').trim()
      }
    }
  }
  return 'Artist'
}

const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ incidents, filters, eventId }) => {
  const [eventDetails, setEventDetails] = useState<EventSchedule | null>(null)
  const [zoomLevel, setZoomLevel] = useState<'15' | '30' | '60' | 'full'>('full')
  const [xRange, setXRange] = useState<[number, number] | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  useEffect(() => {
    if (!eventId) return
    const fetchEventDetails = async () => {
      const { data } = await supabase
        .from('events')
        .select('event_date, doors_open_time, main_act_start_time, support_act_times, showdown_time, event_end_time, curfew_time')
        .eq('id', eventId)
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
    }
    fetchEventDetails()
  }, [eventId])

  const incidentTypes = useMemo(() => {
    const unique = Array.from(new Set(incidents.map(incident => incident.incident_type))).sort()
    return unique
  }, [incidents])

  useEffect(() => {
    if (!incidentTypes.length) {
      setSelectedTypes([])
      return
    }
    setSelectedTypes(prev => {
      if (!prev.length) return incidentTypes
      return prev.filter(type => incidentTypes.includes(type))
    })
  }, [incidentTypes])

  const activeTypes = selectedTypes.length ? selectedTypes : incidentTypes

  const filteredIncidents = useMemo(() => {
    if (!activeTypes.length) return []
    return incidents
      .filter(incident => activeTypes.includes(incident.incident_type))
      .sort((a, b) => {
        const aTime = parseTimestamp(a.timestamp) || 0
        const bTime = parseTimestamp(b.timestamp) || 0
        return aTime - bTime
      })
  }, [incidents, activeTypes])

  const zoomDurations: Record<'15' | '30' | '60' | 'full', number | null> = {
    '15': 15 * 60 * 1000,
    '30': 30 * 60 * 1000,
    '60': 60 * 60 * 1000,
    full: null
  }

  const timelineData = useMemo(() => {
    const incidentTimes = filteredIncidents
      .map(incident => parseTimestamp(incident.timestamp))
      .filter((time): time is number => time !== null)

    const openTimes = incidentTimes.length ? incidentTimes : incidents
      .map(incident => parseTimestamp(incident.timestamp))
      .filter((time): time is number => time !== null)

    const earliest = openTimes.length ? Math.min(...openTimes) : Date.now() - 2 * 60 * 60 * 1000
    const latest = openTimes.length ? Math.max(...openTimes) : Date.now()

    const doorTime = parseEventTime(eventDetails, eventDetails?.doors_open_time)
    const showdownTime = parseEventTime(eventDetails, eventDetails?.showdown_time)
    const eventEndTime = parseEventTime(eventDetails, eventDetails?.event_end_time)
    const curfewTime = parseEventTime(eventDetails, eventDetails?.curfew_time)

    const timelineStart = Math.min(earliest, doorTime ?? earliest) - 60 * 60 * 1000
    const timelineEnd = Math.max(latest, showdownTime ?? latest, eventEndTime ?? latest, curfewTime ?? latest) + 60 * 60 * 1000

    const getArtistBlocks = () => {
      const onStage = incidents
        .filter(incident => incident.incident_type.toLowerCase() === 'artist on stage')
        .sort((a, b) => (parseTimestamp(a.timestamp) || 0) - (parseTimestamp(b.timestamp) || 0))
      const offStage = incidents
        .filter(incident => incident.incident_type.toLowerCase() === 'artist off stage')
        .sort((a, b) => (parseTimestamp(a.timestamp) || 0) - (parseTimestamp(b.timestamp) || 0))

      const usedOffIds = new Set<number>()
      const blocks: { name: string; start: number; end: number }[] = []

      onStage.forEach(onLog => {
        const start = parseTimestamp(onLog.timestamp)
        if (!start) return
        const name = extractArtistName(onLog)
        let end = timelineEnd
        const candidate = offStage.find(offLog => {
          if (usedOffIds.has(offLog.id)) return false
          const offTime = parseTimestamp(offLog.timestamp)
          if (!offTime) return false
          if (offTime <= start) return false
          const offName = extractArtistName(offLog)
          if (offName && name && offName.toLowerCase() !== name.toLowerCase()) {
            return false
          }
          return true
        })
        if (candidate) {
          usedOffIds.add(candidate.id)
          const parsed = parseTimestamp(candidate.timestamp)
          if (parsed) {
            end = parsed
          }
        }
        blocks.push({ name: name || 'Artist', start, end })
      })

      return blocks
    }

    const artistBlocks = getArtistBlocks()
    const artistCategories = artistBlocks.map(block => `Artist · ${block.name}`)
    const yCategories = [...artistCategories, 'Incidents']

    const artistColors = getEnhancedChartColors('light', Math.max(artistBlocks.length, 3))
    const artistTraces = artistBlocks.map((block, index) => {
      const hoverText = `${block.name}<br>Start: ${timeFormatter(block.start)}<br>End: ${timeFormatter(block.end)}<br>Duration: ${formatDuration(block.start, block.end)}`
      return {
        type: 'scatter' as const,
        mode: 'lines' as const,
        x: [block.start, block.end],
        y: [`Artist · ${block.name}`, `Artist · ${block.name}`],
        line: {
          width: 14,
          color: artistColors[index % artistColors.length],
          shape: 'hv' as const
        },
        hoverinfo: 'text' as const,
        text: [hoverText, hoverText],
        name: index === 0 ? 'Artist Sets' : ' ',
        showlegend: index === 0,
        legendgroup: 'artists'
      }
    })

    const incidentMarkers = filteredIncidents.length ? [{
      type: 'scatter' as const,
      mode: 'markers' as const,
      x: filteredIncidents.map(incident => parseTimestamp(incident.timestamp)),
      y: filteredIncidents.map(() => 'Incidents'),
      marker: {
        size: 12,
        symbol: 'circle',
        line: {
          width: 1,
          color: '#0f172a'
        },
        color: filteredIncidents.map(incident => getIncidentColor(incident))
      },
      hovertemplate: filteredIncidents.map(incident => {
        const opened = timeFormatter(parseTimestamp(incident.timestamp))
        return `<b>${incident.incident_type}</b><br>Incident #${incident.log_number || incident.id}<br>Opened: ${opened}<extra></extra>`
      }),
      name: 'Incidents',
      legendgroup: 'incidents'
    }] : []

    const resolutionTraces = filteredIncidents
      .map(incident => {
        const openTime = parseTimestamp(incident.timestamp)
        if (!openTime) return null
        const closedTime = incident.is_closed ? (parseTimestamp(incident.resolved_at) || parseTimestamp(incident.updated_at)) : null
        if (!closedTime) return null
        const hover = `<b>Incident #${incident.log_number || incident.id}</b><br>Opened: ${timeFormatter(openTime)}<br>Closed: ${timeFormatter(closedTime)}<br>Duration: ${formatDuration(openTime, closedTime)}`
        return {
          type: 'scatter' as const,
          mode: 'lines' as const,
          x: [openTime, closedTime],
          y: ['Incidents', 'Incidents'],
          line: {
            width: 4,
            color: '#14b8a6'
          },
          hoverinfo: 'text' as const,
          text: [hover, hover],
          name: 'Resolution Window',
          showlegend: false,
          legendgroup: 'resolution'
        }
      })
      .filter((trace): trace is NonNullable<typeof trace> => trace !== null)

    const data = [...artistTraces, ...incidentMarkers, ...resolutionTraces]

    const layout = {
      height: 360 + artistCategories.length * 40,
      margin: { l: 140, r: 40, t: 40, b: 60 },
      plot_bgcolor: 'rgba(248, 250, 252, 0.95)',
      paper_bgcolor: 'rgba(255,255,255,0)',
      hovermode: 'closest' as const,
      showlegend: true,
      legend: {
        orientation: 'h' as const,
        y: -0.2
      },
      xaxis: {
        type: 'date' as const,
        range: xRange ? xRange : [timelineStart, timelineEnd],
        tickformat: '%H:%M',
        showgrid: true,
        zeroline: false
      },
      yaxis: {
        type: 'category' as const,
        categoryorder: 'array' as const,
        categoryarray: yCategories,
        showgrid: false,
        zeroline: false
      },
      shapes: [] as any[]
    }

    return {
      data,
      layout,
      timelineStart,
      timelineEnd,
      artistCategories
    }
  }, [filteredIncidents, incidents, eventDetails, xRange])

  useEffect(() => {
    if (!timelineData) return
    const { timelineStart, timelineEnd } = timelineData
    if (!timelineStart || !timelineEnd) return
    if (zoomLevel === 'full') {
      setXRange([timelineStart, timelineEnd])
      return
    }
    const duration = zoomDurations[zoomLevel]
    if (!duration) return
    const startRange = Math.max(timelineStart, timelineEnd - duration)
    setXRange([startRange, timelineEnd])
  }, [zoomLevel, timelineData?.timelineStart, timelineData?.timelineEnd])

  if (!incidents.length) {
    return (
      <div className="mt-8 bg-white/90 dark:bg-[#182447] rounded-2xl border border-dashed border-gray-300 dark:border-[#2d437a] p-12 text-center shadow-sm">
        <div className="text-5xl mb-4">⏱️</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No incident timeline yet</h3>
        <p className="text-gray-600 dark:text-gray-300">Log incidents or artist cues to populate the live timeline view.</p>
      </div>
    )
  }

  if (!timelineData) {
    return null
  }

  const zoomOptions: { label: string; value: '15' | '30' | '60' | 'full' }[] = [
    { label: '15 min', value: '15' },
    { label: '30 min', value: '30' },
    { label: '1 hr', value: '60' },
    { label: 'Full event', value: 'full' }
  ]

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => {
      if (!prev.length) return [type]
      if (prev.includes(type)) {
        if (prev.length === 1) {
          return prev
        }
        return prev.filter(item => item !== type)
      }
      return [...prev, type]
    })
  }

  const plotConfig = {
    responsive: true,
    displaylogo: false,
    scrollZoom: true,
    modeBarButtonsToRemove: ['select2d', 'lasso2d']
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-2 bg-white/90 dark:bg-[#203a79]/70 border border-gray-200 dark:border-[#2d437a]/50 rounded-xl px-3 py-2 shadow-sm">
          <FaRegClock className="text-blue-500" />
          {zoomOptions.map(option => (
            <motion.button
              key={option.value}
              onClick={() => setZoomLevel(option.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                zoomLevel === option.value
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-600 dark:text-blue-100 hover:bg-blue-50 dark:hover:bg-[#1b2f63]'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {option.label}
            </motion.button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-blue-100"><FaFilter /> Filter types:</span>
          {incidentTypes.map(type => {
            const active = activeTypes.includes(type)
            return (
              <button
                key={type}
                onClick={() => handleTypeToggle(type)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 dark:border-[#2d437a]/60 text-gray-600 dark:text-blue-100 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {type}
              </button>
            )
          })}
        </div>
      </div>
      <div className="bg-white/95 dark:bg-[#182447]/80 border border-gray-200 dark:border-[#2d437a]/60 rounded-3xl shadow-xl p-4 md:p-6">
        <Plot data={timelineData.data as any} layout={timelineData.layout as any} config={plotConfig} style={{ width: '100%', height: timelineData.layout.height }} />
      </div>
    </div>
  )
}

export default IncidentTimeline
