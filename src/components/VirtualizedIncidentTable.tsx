'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { List } from 'react-window'
import { motion, AnimatePresence } from 'framer-motion'
import { getIncidentTypeIcon } from '../utils/incidentIcons'
import { 
  getPriorityDisplayConfig,
  normalizePriority,
  type NormalizedPriority,
  type Priority
} from '../utils/incidentStyles'
import { SkeletonIncidentTable, LoadingSpinner } from './ui/LoadingStates'
import { ArrowUpIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline'

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
  priority?: string
  resolved_at?: string | null
  responded_at?: string | null
  updated_at?: string | null
  // Auditable logging fields
  time_of_occurrence?: string
  time_logged?: string
  entry_type?: 'contemporaneous' | 'retrospective'
  retrospective_justification?: string
  logged_by_user_id?: string
  logged_by_callsign?: string
  is_amended?: boolean
  original_entry_id?: string
}

interface VirtualizedIncidentTableProps {
  incidents: Incident[]
  loading?: boolean
  onIncidentClick?: (incident: Incident) => void
  onIncidentUpdate?: (incidentId: number, updates: Partial<Incident>) => void
  className?: string
  height?: number
  itemHeight?: number
}

// Individual incident row component
const IncidentRow = React.memo(({ 
  index, 
  style, 
  data 
}: { 
  index: number
  style: React.CSSProperties
  data: {
    incidents: Incident[]
    onIncidentClick?: (incident: Incident) => void
    onIncidentUpdate?: (incidentId: number, updates: Partial<Incident>) => void
  }
}) => {
  const { incidents, onIncidentClick, onIncidentUpdate } = data
  const incident = incidents[index]
  
  const handleClick = useCallback(() => {
    if (incident) {
      onIncidentClick?.(incident)
    }
  }, [incident, onIncidentClick])
  
  const handleStatusToggle = useCallback((e: React.MouseEvent) => {
    if (!incident) return
    e.stopPropagation()
    onIncidentUpdate?.(incident.id, { 
      is_closed: !incident.is_closed,
      status: !incident.is_closed ? 'Closed' : 'Open'
    })
  }, [incident, onIncidentUpdate])
  
  if (!incident) return null
  
  const iconConfig = getIncidentTypeIcon(incident.incident_type)
  const IconComponent = iconConfig.icon
  const priorityConfig = getPriorityDisplayConfig(incident.priority as Priority)
  
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return timestamp
    }
  }
  
  const getTimeDelta = (timestamp: string) => {
    try {
      const now = new Date()
      const incidentTime = new Date(timestamp)
      const diffMs = now.getTime() - incidentTime.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ago`
    } catch {
      return 'Unknown'
    }
  }
  
  return (
    <motion.div
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-center gap-4">
        {/* Incident Type Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <IconComponent className="w-5 h-5" />
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
              {incident.log_number}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.chipActiveClass}`}>
              {priorityConfig.label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getTimeDelta(incident.timestamp)}
            </span>
          </div>
          
          <p className="text-sm text-gray-900 dark:text-white truncate">
            {incident.occurrence}
          </p>
          
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>From: {incident.callsign_from}</span>
            <span>To: {incident.callsign_to}</span>
            <span className="flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              {formatTimestamp(incident.timestamp)}
            </span>
          </div>
        </div>
        
        {/* Status Toggle */}
        <div className="flex-shrink-0">
          <button
            onClick={handleStatusToggle}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              incident.is_closed
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {incident.is_closed ? 'Closed' : 'Open'}
          </button>
        </div>
      </div>
    </motion.div>
  )
})

IncidentRow.displayName = 'IncidentRow'

export default function VirtualizedIncidentTable({
  incidents,
  loading = false,
  onIncidentClick,
  onIncidentUpdate,
  className = '',
  height = 600,
  itemHeight = 80
}: VirtualizedIncidentTableProps) {
  const [showBackToTop, setShowBackToTop] = useState(false)
  const listRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Memoize the data object to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    incidents,
    onIncidentClick,
    onIncidentUpdate
  }), [incidents, onIncidentClick, onIncidentUpdate])
  
  // Handle scroll to show/hide back to top button
  const handleScroll = useCallback((info: any) => {
    setShowBackToTop(info.scrollOffset > 200)
  }, [])
  
  // Scroll to top function
  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToItem(0, 'start')
  }, [])
  
  // Loading state
  if (loading && incidents.length === 0) {
    return <SkeletonIncidentTable rows={8} />
  }
  
  // Empty state
  if (!loading && incidents.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center ${className}`}>
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Incidents Found</h3>
        <p className="text-gray-600 dark:text-gray-400">There are no incidents to display at the moment.</p>
      </div>
    )
  }
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Table Header */}
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm font-medium text-gray-700 dark:text-gray-300">
            <span className="w-12">Type</span>
            <span className="flex-1">Details</span>
            <span className="w-20">Status</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {incidents.length} incident{incidents.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
      
      {/* Virtual List */}
      <div className="bg-white dark:bg-gray-800 rounded-b-lg border border-gray-200 dark:border-gray-700 border-t-0">
        <List
          ref={listRef}
          height={height}
          itemCount={incidents.length}
          itemSize={itemHeight}
          itemData={itemData}
          onScroll={handleScroll}
          overscanCount={5} // Render 5 extra items above and below viewport
        >
          {({ index, style, data }: { index: number; style: any; data: any }) => <IncidentRow index={index} style={style} data={data} />}
        </List>
        
        {/* Loading indicator for bottom */}
        {loading && incidents.length > 0 && (
          <div className="flex justify-center py-4 border-t border-gray-200 dark:border-gray-700">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>
      
      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors z-50"
            title="Back to top"
          >
            <ArrowUpIcon className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

// Hook for managing virtual list state
export function useVirtualizedIncidents(
  initialIncidents: Incident[] = [],
  options: {
    pageSize?: number
    enableInfiniteScroll?: boolean
  } = {}
) {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  
  const { pageSize = 50, enableInfiniteScroll = true } = options
  
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    
    setLoading(true)
    setError(null)
    
    try {
      // This would be replaced with actual API call
      // const newIncidents = await fetchIncidents(page + 1, pageSize)
      // setIncidents(prev => [...prev, ...newIncidents])
      // setHasMore(newIncidents.length === pageSize)
      // setPage(prev => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load incidents')
    } finally {
      setLoading(false)
    }
  }, [hasMore, loading, page, pageSize])
  
  const updateIncident = useCallback((incidentId: number, updates: Partial<Incident>) => {
    setIncidents(prev => 
      prev.map(incident => 
        incident.id === incidentId ? { ...incident, ...updates } : incident
      )
    )
  }, [])
  
  const removeIncident = useCallback((incidentId: number) => {
    setIncidents(prev => prev.filter(incident => incident.id !== incidentId))
  }, [])
  
  return {
    incidents,
    loading,
    error,
    hasMore,
    loadMore,
    updateIncident,
    removeIncident,
    setIncidents
  }
}
