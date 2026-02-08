'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { MapPinIcon } from '@heroicons/react/24/outline'
import type { Coordinates } from '../../../hooks/useGeocodeLocation'
import { CardFrame, CardHeader } from '@/components/ui/InCommandCard'

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
  
  const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"

  return (
    <CardFrame>
      <CardHeader
        icon={MapPinIcon}
        title="Location"
        titleId="location-actions-title"
        variant="teal"
      />
      <div className="space-y-4">
        
        {/* Location Input */}
        <div className="space-y-1.5">
          <label htmlFor="location" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
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
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5">
            <IncidentLocationMap
              coordinates={mapCoordinates}
              locationQuery={mapLocationQuery}
              overlays={[]}
              onLocationChange={onMapLocationChange}
            />
            <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
              <p className="flex items-center gap-1 text-[10px] text-slate-500">
                <MapPinIcon className="h-3 w-3" />
                Drag marker to pinpoint exact location
              </p>
            </div>
          </div>
        )}
      </div>
    </CardFrame>
  )
}
