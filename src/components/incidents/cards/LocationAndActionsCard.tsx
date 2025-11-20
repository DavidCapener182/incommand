'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { MapPinIcon } from '@heroicons/react/24/outline'
import type { Coordinates } from '../../../hooks/useGeocodeLocation'

// Dynamic import for Map to avoid SSR issues
const IncidentLocationMap = dynamic(() => import('../../maps/IncidentLocationMap'), {
  ssr: false,
  loading: () => (
    <div className="h-48 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-slate-400">
        <MapPinIcon className="h-6 w-6 animate-bounce" />
        <span className="text-xs font-medium">Loading map...</span>
      </div>
    </div>
  )
})

export interface LocationAndActionsCardProps {
  location: string
  onLocationChange: (value: string) => void
  shouldRenderMap: boolean
  mapCoordinates: Coordinates | null
  mapLocationQuery: string
  onMapLocationChange: (coords: Coordinates, source: 'manual' | 'geocoded' | 'drag') => void
}

export default function LocationAndActionsCard({
  location,
  onLocationChange,
  shouldRenderMap,
  mapCoordinates,
  mapLocationQuery,
  onMapLocationChange,
}: LocationAndActionsCardProps) {
  
  const inputClass = "w-full rounded-lg border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-all h-10 px-3 shadow-sm placeholder:text-slate-400"

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <div className="bg-teal-100 p-1.5 rounded-md text-teal-600">
          <MapPinIcon className="h-4 w-4" />
        </div>
        <h3 id="location-actions-title" className="font-semibold text-slate-800 text-sm">Location</h3>
      </div>

      <div className="p-5 space-y-4">
        
        {/* Location Input */}
        <div className="space-y-1.5">
          <label htmlFor="location" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Exact Location
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="e.g., Main Stage, Gate 1, Block 102"
            className={inputClass}
          />
        </div>

        {/* Map Visualization */}
        {shouldRenderMap && (
          <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm ring-1 ring-slate-900/5">
            <IncidentLocationMap
              coordinates={mapCoordinates}
              locationQuery={mapLocationQuery}
              overlays={[]}
              onLocationChange={onMapLocationChange}
            />
            <div className="bg-slate-50 px-3 py-2 border-t border-slate-200">
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <MapPinIcon className="h-3 w-3" />
                Drag marker to pinpoint exact location
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}