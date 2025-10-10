'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  MapPinIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  MapIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

interface MapMarker {
  id: string
  type: 'incident' | 'staff' | 'resource' | 'hazard' | 'checkpoint'
  latitude: number
  longitude: number
  title: string
  description?: string
  priority?: 'high' | 'medium' | 'low'
  icon: string
  color: string
  metadata?: any
}

interface TacticalMapProps {
  eventId: string
  incidents?: any[]
  staff?: any[]
  className?: string
  interactive?: boolean
  showLayers?: boolean
}

const MARKER_TYPES = {
  incident: { icon: '⚠️', color: '#EF4444', label: 'Incidents' },
  staff: { icon: '👤', color: '#3B82F6', label: 'Staff' },
  resource: { icon: '🚑', color: '#10B981', label: 'Resources' },
  hazard: { icon: '⚠️', color: '#F59E0B', label: 'Hazards' },
  checkpoint: { icon: '📍', color: '#8B5CF6', label: 'Checkpoints' }
}

export default function TacticalMap({
  eventId,
  incidents = [],
  staff = [],
  className = '',
  interactive = true,
  showLayers = true
}: TacticalMapProps) {
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null)
  const [zoom, setZoom] = useState(15)
  const [center, setCenter] = useState({ lat: 51.5074, lng: -0.1278 }) // London default
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set(Object.keys(MARKER_TYPES)))
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Convert incidents and staff to markers
    const incidentMarkers: MapMarker[] = incidents
      .filter(inc => inc.latitude && inc.longitude)
      .map(inc => ({
        id: inc.id,
        type: 'incident',
        latitude: inc.latitude,
        longitude: inc.longitude,
        title: inc.incident_type,
        description: inc.occurrence,
        priority: inc.priority,
        icon: MARKER_TYPES.incident.icon,
        color: inc.priority === 'high' ? '#EF4444' : inc.priority === 'medium' ? '#F59E0B' : '#3B82F6',
        metadata: inc
      }))

    const staffMarkers: MapMarker[] = staff
      .filter(s => s.latitude && s.longitude)
      .map(s => ({
        id: s.id,
        type: 'staff',
        latitude: s.latitude,
        longitude: s.longitude,
        title: s.callsign,
        description: `${s.role} - ${s.status}`,
        icon: MARKER_TYPES.staff.icon,
        color: MARKER_TYPES.staff.color,
        metadata: s
      }))

    setMarkers([...incidentMarkers, ...staffMarkers])
  }, [incidents, staff])

  const toggleLayer = (layer: string) => {
    const newLayers = new Set(visibleLayers)
    if (newLayers.has(layer)) {
      newLayers.delete(layer)
    } else {
      newLayers.add(layer)
    }
    setVisibleLayers(newLayers)
  }

  const handleZoomIn = () => setZoom(prev => Math.min(20, prev + 1))
  const handleZoomOut = () => setZoom(prev => Math.max(10, prev - 1))
  const handleResetView = () => {
    setZoom(15)
    setCenter({ lat: 51.5074, lng: -0.1278 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (interactive) {
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      // Pan map (simplified - would use real map library)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const filteredMarkers = markers.filter(marker => visibleLayers.has(marker.type))

  return (
    <div className={`relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Map Container */}
      <div
        ref={mapRef}
        className="relative w-full h-full min-h-[500px] bg-gray-100 dark:bg-gray-900"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Map Image Placeholder - In production, use Mapbox/Google Maps */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-950 dark:to-green-950">
          <div className="text-center">
            <MapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Interactive Tactical Map
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Zoom: {zoom}x | Markers: {filteredMarkers.length}
            </p>
          </div>
        </div>

        {/* Markers */}
        {filteredMarkers.map((marker) => (
          <motion.div
            key={marker.id}
            className="absolute cursor-pointer"
            style={{
              left: `${50 + (marker.longitude - center.lng) * 100}%`,
              top: `${50 - (marker.latitude - center.lat) * 100}%`,
              transform: 'translate(-50%, -100%)'
            }}
            onClick={() => setSelectedMarker(marker)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <div
              className="relative p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border-2"
              style={{ borderColor: marker.color }}
            >
              <span className="text-2xl">{marker.icon}</span>
              {marker.priority === 'high' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <MinusIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowsPointingOutIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Layer Controls */}
      {showLayers && (
        <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">Layers</div>
          <div className="space-y-2">
            {Object.entries(MARKER_TYPES).map(([type, config]) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleLayers.has(type)}
                  onChange={() => toggleLayer(type)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {config.icon} {config.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({markers.filter(m => m.type === type).length})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Marker Details */}
      {selectedMarker && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-4 max-w-sm"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedMarker.icon}</span>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {selectedMarker.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {selectedMarker.type}
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedMarker(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>

          {selectedMarker.description && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {selectedMarker.description}
            </p>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400">
            {selectedMarker.latitude.toFixed(6)}, {selectedMarker.longitude.toFixed(6)}
          </div>

          {selectedMarker.type === 'incident' && (
            <div className="mt-3 flex gap-2">
              <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                View Details
              </button>
              <button className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors">
                Navigate
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <div className="text-xs font-medium text-gray-900 dark:text-white mb-2">Legend</div>
        <div className="space-y-1">
          {Object.entries(MARKER_TYPES).map(([type, config]) => {
            const count = markers.filter(m => m.type === type).length
            if (count === 0) return null
            return (
              <div key={type} className="flex items-center gap-2 text-xs">
                <span>{config.icon}</span>
                <span className="text-gray-700 dark:text-gray-300">{config.label}</span>
                <span className="text-gray-500 dark:text-gray-400">({count})</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
