'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getMapStyle, type MapStyleOption } from '@/utils/mapProvider'

const SCRIPT_URL = 'https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.js'
const CSS_URL = 'https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.css'

export interface IncidentMapIncident {
  id: number | string
  latitude: number | null
  longitude: number | null
  incident_type?: string | null
  priority?: string | null
  is_closed?: boolean | null
  occurrence?: string | null
  timestamp?: string | null
  location?: string | null
  logged_by_callsign?: string | null
}

interface IncidentMapProps {
  incidents: IncidentMapIncident[]
  mapStyle?: MapStyleOption
  onIncidentClick?: (incident: IncidentMapIncident) => void
  className?: string
}

type MaplibreGl = any

function ensureScriptLoaded(): Promise<MaplibreGl> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Map cannot be used on the server'))
  if (!document.querySelector<HTMLLinkElement>('link[data-maplibre-css]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = CSS_URL
    link.dataset.maplibreCss = 'true'
    document.head.appendChild(link)
  }
  if ((window as any).maplibregl) return Promise.resolve((window as any).maplibregl as MaplibreGl)
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-maplibre-gl]')
    if (existing) {
      existing.addEventListener('load', () => setTimeout(() => ((window as any).maplibregl ? resolve((window as any).maplibregl) : reject(new Error('Map library failed to initialise'))), 100), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.dataset.maplibreGl = 'true'
    script.onload = () => setTimeout(() => ((window as any).maplibregl ? resolve((window as any).maplibregl) : reject(new Error('Map library failed to initialise'))), 100)
    script.onerror = () => reject(new Error('Failed to load map library'))
    document.head.appendChild(script)
  })
}

function priorityToColor(priority: string | null | undefined): string {
  switch (priority?.toLowerCase()) {
    case 'urgent': return '#dc2626'
    case 'high': return '#ea580c'
    case 'medium': return '#ca8a04'
    case 'low': return '#16a34a'
    default: return '#6b7280'
  }
}

export default function IncidentMap({ incidents, mapStyle = 'street', onIncidentClick, className = '' }: IncidentMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MaplibreGl['Map'] | null>(null)
  const popupRef = useRef<MaplibreGl['Popup'] | null>(null)
  const [maplibre, setMaplibre] = useState<MaplibreGl | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const pointsWithCoords = useMemo(() =>
    incidents.filter(
      (i): i is IncidentMapIncident & { latitude: number; longitude: number } =>
        i.latitude != null && i.longitude != null && Number.isFinite(i.latitude) && Number.isFinite(i.longitude)
    ),
    [incidents]
  )

  const geojson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: pointsWithCoords.map((i) => ({
      type: 'Feature' as const,
      id: String(i.id),
      geometry: { type: 'Point' as const, coordinates: [i.longitude, i.latitude] },
      properties: {
        id: i.id,
        priority: i.priority ?? 'medium',
        color: priorityToColor(i.priority),
        incident_type: i.incident_type ?? '',
        is_closed: !!i.is_closed,
        occurrence: (i.occurrence ?? '').slice(0, 80),
        timestamp: i.timestamp ?? '',
        location: i.location ?? '',
        logged_by_callsign: i.logged_by_callsign ?? '',
      },
    })),
  }), [pointsWithCoords])

  const styleConfig = useMemo(() => getMapStyle(mapStyle), [mapStyle])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let isMounted = true
    ensureScriptLoaded()
      .then((lib) => { if (isMounted) { setMaplibre(lib); setLoadError(null) } })
      .catch(() => { if (isMounted) setLoadError('Failed to load map') })
    return () => { isMounted = false }
  }, [])

  const fitBounds = useCallback((map: MaplibreGl['Map'], points: typeof pointsWithCoords) => {
    if (points.length === 0) return
    const lngs = points.map((p) => p.longitude)
    const lats = points.map((p) => p.latitude)
    const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)]
    const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)]
    map.fitBounds([sw, ne], { padding: 40, maxZoom: 16 })
  }, [pointsWithCoords])

  useEffect(() => {
    if (!maplibre || !containerRef.current) return

    if (!mapRef.current) {
      const center: [number, number] = pointsWithCoords.length
        ? [pointsWithCoords[0].longitude, pointsWithCoords[0].latitude]
        : [-0.1276, 51.5072]
      mapRef.current = new maplibre.Map({
        container: containerRef.current,
        style: styleConfig.styleUrl,
        center,
        zoom: pointsWithCoords.length ? 14 : 3,
      })
      mapRef.current.addControl(new maplibre.NavigationControl({ visualizePitch: true }), 'top-left')

      mapRef.current.on('load', () => {
        const map = mapRef.current
        if (!map) return
        if (!map.getSource('incidents')) {
          map.addSource('incidents', { type: 'geojson', data: geojson })
          map.addLayer({
            id: 'incidents-circles',
            type: 'circle',
            source: 'incidents',
            paint: {
              'circle-radius': 8,
              'circle-color': ['get', 'color'],
              'circle-stroke-color': '#fff',
              'circle-stroke-width': 1.5,
            },
          })
        }
        if (pointsWithCoords.length) fitBounds(map, pointsWithCoords)
      })

      mapRef.current.on('click', 'incidents-circles', (e: any) => {
        const f = e.features?.[0]
        if (!f || !pointsWithCoords.length) return
        const inc = pointsWithCoords.find((i) => String(i.id) === f.id)
        if (inc) onIncidentClick?.(inc)
        const props = f.properties
        if (!popupRef.current && mapRef.current) {
          popupRef.current = new maplibre.Popup({ closeButton: true })
        }
        if (popupRef.current && mapRef.current) {
          const html = `
            <div class="p-2 min-w-[180px]">
              <div class="font-semibold text-sm">${(props?.incident_type || 'Incident').replace(/</g, '&lt;')}</div>
              ${props?.priority ? `<div class="text-xs text-gray-500">${String(props.priority).replace(/</g, '&lt;')}</div>` : ''}
              ${props?.occurrence ? `<div class="text-xs mt-1">${String(props.occurrence).replace(/</g, '&lt;')}</div>` : ''}
              ${props?.timestamp ? `<div class="text-xs text-gray-400 mt-1">${new Date(props.timestamp).toLocaleString()}</div>` : ''}
            </div>
          `
          popupRef.current.setLngLat(e.lngLat).setHTML(html).addTo(mapRef.current)
        }
      })
    }
  }, [maplibre, styleConfig.styleUrl, geojson, pointsWithCoords, fitBounds, onIncidentClick])

  useEffect(() => {
    const map = mapRef.current
    const source = map?.getSource('incidents')
    if (source && 'setData' in source) (source as any).setData(geojson)
    if (map && pointsWithCoords.length) fitBounds(map, pointsWithCoords)
  }, [geojson, pointsWithCoords, fitBounds])

  useEffect(() => {
    return () => {
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null }
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [])

  if (loadError) {
    return <div className={`flex items-center justify-center p-6 bg-muted rounded-lg ${className}`}>{loadError}</div>
  }
  if (!maplibre) {
    return <div className={`flex items-center justify-center p-6 bg-muted rounded-lg ${className}`}>Loading map…</div>
  }

  return (
    <div className={className}>
      <div ref={containerRef} className="w-full h-full min-h-[300px] rounded-lg overflow-hidden" />
      <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Urgent</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> High</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Medium</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Low</span>
      </div>
    </div>
  )
}
