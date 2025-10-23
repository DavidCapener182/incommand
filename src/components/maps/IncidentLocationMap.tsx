'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useGeocodeLocation, { Coordinates } from '@/hooks/useGeocodeLocation'
import { getMapStyle, type MapStyleOption } from '@/utils/mapProvider'

const SCRIPT_URL = 'https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.js'
const CSS_URL = 'https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.css'

export type MapOverlay =
  | {
      id: string
      name: string
      type: 'polygon'
      color?: string
      coordinates: Coordinates[]
    }
  | {
      id: string
      name: string
      type: 'circle'
      color?: string
      center: Coordinates
      radiusMeters: number
    }
  | {
      id: string
      name: string
      type: 'marker'
      color?: string
      coordinate: Coordinates
    }

interface IncidentLocationMapProps {
  coordinates?: Coordinates | null
  locationQuery?: string | null
  overlays?: MapOverlay[]
  onLocationChange?: (coordinates: Coordinates, source: 'manual' | 'geocoded' | 'drag') => void
}

type MaplibreGl = any

function ensureScriptLoaded(): Promise<MaplibreGl> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Map cannot be used on the server'))
  }

  // Load CSS first if not already loaded
  if (!document.querySelector<HTMLLinkElement>('link[data-maplibre-css]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = CSS_URL
    link.dataset.maplibreCss = 'true'
    document.head.appendChild(link)
  }

  if ((window as any).maplibregl) {
    return Promise.resolve((window as any).maplibregl as MaplibreGl)
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-maplibre-gl]')
    if (existing) {
      existing.addEventListener('load', () => {
        // Small delay to ensure library is fully initialized
        setTimeout(() => {
          if ((window as any).maplibregl) {
            resolve((window as any).maplibregl as MaplibreGl)
          } else {
            reject(new Error('Map library failed to initialise'))
          }
        }, 100)
      }, { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load map library')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.defer = false // Change to false for immediate execution
    script.dataset.maplibreGl = 'true'
    script.onload = () => {
      // Small delay to ensure library is fully initialized
      setTimeout(() => {
        if ((window as any).maplibregl) {
          resolve((window as any).maplibregl as MaplibreGl)
        } else {
          reject(new Error('Map library failed to initialise'))
        }
      }, 100)
    }
    script.onerror = () => reject(new Error('Failed to load map library'))
    document.head.appendChild(script)
  })
}

function generateCirclePolygon(center: Coordinates, radiusMeters: number, steps = 64): [number, number][] {
  const coordinates: [number, number][] = []
  const earthRadius = 6371000
  const latRad = (center.lat * Math.PI) / 180

  for (let i = 0; i <= steps; i += 1) {
    const angle = (i / steps) * 2 * Math.PI
    const dx = (radiusMeters * Math.cos(angle)) / earthRadius
    const dy = (radiusMeters * Math.sin(angle)) / earthRadius

    const lat = center.lat + (dy * 180) / Math.PI
    const lng = center.lng + ((dx * 180) / Math.PI) / Math.cos(latRad)
    coordinates.push([lng, lat])
  }

  return coordinates
}

function isValidLocationInput(input: string | null | undefined): boolean {
  if (!input || !input.trim()) return false
  
  const trimmed = input.trim()
  
  // Allow any non-empty location name (Stage, Main Gate, North Entrance, etc.)
  return trimmed.length > 0
}

export default function IncidentLocationMap({
  coordinates,
  locationQuery,
  overlays = [],
  onLocationChange
}: IncidentLocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const overlaysRef = useRef<string[]>([])
  const [maplibre, setMaplibre] = useState<MaplibreGl | null>(null)
  const [style, setStyle] = useState<MapStyleOption>('street')
  const [manualOverride, setManualOverride] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const { coordinates: geocodedCoordinates, isLoading: isGeocoding, error: geocodeError } = useGeocodeLocation(
    locationQuery,
    !coordinates && !!(locationQuery && locationQuery.trim())
  )

  const [activeCoords, setActiveCoords] = useState<Coordinates | null>(coordinates || geocodedCoordinates || null)

  useEffect(() => {
    // Only load on client side
    if (typeof window === 'undefined') return
    
    let isMounted = true
    
    ensureScriptLoaded()
      .then((lib) => {
        if (isMounted) {
          setMaplibre(lib)
          setLoadError(null)
        }
      })
      .catch((error) => {
        console.error('Failed to load map library:', error)
        if (isMounted) {
          setLoadError('Failed to load map')
        }
      })
      
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    setManualOverride(false)
  }, [locationQuery])

  useEffect(() => {
    if (coordinates) {
      setManualOverride(false)
      setActiveCoords(prev => {
        if (!prev) return coordinates
        if (Math.abs(prev.lat - coordinates.lat) < 0.00001 && Math.abs(prev.lng - coordinates.lng) < 0.00001) {
          return prev
        }
        return coordinates
      })
    } else if (!coordinates && !manualOverride && geocodedCoordinates) {
      setActiveCoords(geocodedCoordinates)
    } else if (!coordinates && !geocodedCoordinates && !manualOverride) {
      setActiveCoords(null)
    }
  }, [coordinates, geocodedCoordinates, manualOverride])

  useEffect(() => {
    if (!coordinates && geocodedCoordinates) {
      onLocationChange?.(geocodedCoordinates, 'geocoded')
    }
  }, [coordinates, geocodedCoordinates, onLocationChange])

  const styleConfig = useMemo(() => getMapStyle(style), [style])

  const applyOverlays = useCallback(() => {
    if (!mapRef.current || !maplibre) {
      return
    }

    overlaysRef.current.forEach((id) => {
      if (mapRef.current.getLayer(id)) {
        mapRef.current.removeLayer(id)
      }
      if (mapRef.current.getSource(id)) {
        mapRef.current.removeSource(id)
      }
    })
    overlaysRef.current = []

    overlays.forEach((overlay) => {
      const sourceId = `overlay-${overlay.id}`
      const layerId = `${sourceId}-layer`

      if (overlay.type === 'polygon') {
        const coordinates = overlay.coordinates.map((coord) => [coord.lng, coord.lat]) as [number, number][]
        if (coordinates.length < 3) {
          return
        }
        const closed = [...coordinates, coordinates[0]]
        mapRef.current.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [closed]
            },
            properties: {
              name: overlay.name
            }
          }
        })

        mapRef.current.addLayer({
          id: `${layerId}-fill`,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': overlay.color || '#22d3ee',
            'fill-opacity': 0.18
          }
        })

        mapRef.current.addLayer({
          id: `${layerId}-outline`,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': overlay.color || '#0891b2',
            'line-width': 2
          }
        })

        overlaysRef.current.push(`${layerId}-fill`, `${layerId}-outline`, sourceId)
      } else if (overlay.type === 'circle') {
        const polygon = generateCirclePolygon(overlay.center, overlay.radiusMeters)
        mapRef.current.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [polygon]
            },
            properties: {
              name: overlay.name
            }
          }
        })

        mapRef.current.addLayer({
          id: `${layerId}-fill`,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': overlay.color || '#f97316',
            'fill-opacity': 0.12
          }
        })

        mapRef.current.addLayer({
          id: `${layerId}-outline`,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': overlay.color || '#ea580c',
            'line-width': 1.5,
            'line-dasharray': [2, 2]
          }
        })

        overlaysRef.current.push(`${layerId}-fill`, `${layerId}-outline`, sourceId)
      } else if (overlay.type === 'marker') {
        mapRef.current.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [overlay.coordinate.lng, overlay.coordinate.lat]
            },
            properties: {
              name: overlay.name
            }
          }
        })

        mapRef.current.addLayer({
          id: `${layerId}-circle`,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': 6,
            'circle-color': overlay.color || '#f43f5e',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.5
          }
        })

        overlaysRef.current.push(`${layerId}-circle`, sourceId)
      }
    })
  }, [maplibre, overlays])

  const ensureMarker = useCallback((coords: Coordinates) => {
    if (!maplibre || !mapRef.current) {
      return
    }

    if (!markerRef.current) {
      markerRef.current = new maplibre.Marker({
        draggable: true,
        color: '#2563eb'
      })
        .setLngLat([coords.lng, coords.lat])
        .addTo(mapRef.current)

      markerRef.current.on('dragend', () => {
        const lngLat = markerRef.current.getLngLat()
        const next: Coordinates = { lat: lngLat.lat, lng: lngLat.lng }
        setManualOverride(true)
        setActiveCoords(next)
        onLocationChange?.(next, 'drag')
      })
    } else {
      markerRef.current.setLngLat([coords.lng, coords.lat])
    }
  }, [maplibre, onLocationChange])

  useEffect(() => {
    if (!maplibre || !containerRef.current) {
      return
    }

    if (!mapRef.current) {
      const initialCenter: [number, number] = activeCoords ? [activeCoords.lng, activeCoords.lat] : [-0.1276, 51.5072]
      mapRef.current = new maplibre.Map({
        container: containerRef.current,
        style: styleConfig.styleUrl,
        center: initialCenter,
        zoom: activeCoords ? 15 : 3
      })
      mapRef.current.addControl(new maplibre.NavigationControl({ visualizePitch: true }), 'top-left')
      mapRef.current.on('load', () => {
        if (activeCoords) {
          ensureMarker(activeCoords)
        }
        applyOverlays()
      })
      mapRef.current.on('styledata', () => {
        applyOverlays()
        if (activeCoords) {
          ensureMarker(activeCoords)
        }
      })
    } else if (styleConfig.styleUrl) {
      mapRef.current.setStyle(styleConfig.styleUrl)
    }
  }, [maplibre, styleConfig, activeCoords, applyOverlays, ensureMarker])

  useEffect(() => {
    if (!mapRef.current || !activeCoords) {
      return
    }

    ensureMarker(activeCoords)
    mapRef.current.flyTo({
      center: [activeCoords.lng, activeCoords.lat],
      zoom: Math.max(mapRef.current.getZoom(), 15),
      essential: true
    })
  }, [activeCoords, ensureMarker])

  useEffect(() => {
    applyOverlays()
  }, [applyOverlays])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        try {
          markerRef.current.remove()
          markerRef.current = null
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (mapRef.current) {
        try {
          mapRef.current.remove()
          mapRef.current = null
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [])

  const legendEntries = useMemo(
    () => overlays.map((overlay) => ({ id: overlay.id, name: overlay.name, color: overlay.color })),
    [overlays]
  )

  const renderStatusMessage = () => {
    if (loadError) {
      return (
        <div className="incident-map-loading text-red-600 dark:text-red-300">
          <span className="status-dot warning" />
          {loadError}
        </div>
      )
    }

    if (!maplibre) {
      return (
        <div className="incident-map-loading">
          <span className="status-dot info" />
          Loading map…
        </div>
      )
    }

    if (isGeocoding) {
      return (
        <div className="incident-map-loading">
          <span className="status-dot info" />
          Resolving location…
        </div>
      )
    }

    if (geocodeError) {
      return (
        <div className="incident-map-loading text-red-600 dark:text-red-300">
          <span className="status-dot warning" />
          {geocodeError}
        </div>
      )
    }

    if (!activeCoords) {
      return (
        <div className="incident-map-loading">
          <span className="status-dot warning" />
          Enter a precise location to preview the map.
        </div>
      )
    }

    return null
  }

  // Don't render the map if the location input is not valid
  const shouldShowMap = isValidLocationInput(locationQuery) || !!coordinates

  // Don't render anything if location input is not valid
  if (!shouldShowMap) {
    return null
  }

  return (
    <section className="incident-map-container" aria-label="Incident map">
      <div className="incident-map-toolbar" role="toolbar" aria-label="Map style">
        {(['street', 'satellite', 'hybrid'] as MapStyleOption[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setStyle(option)}
            aria-pressed={style === option}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>

      {renderStatusMessage()}

      <div ref={containerRef} className="incident-map-viewport" aria-hidden="true" />

      {legendEntries.length > 0 && (
        <div className="incident-map-overlay-legend">
          <p className="font-semibold">Overlays</p>
          <ul className="space-y-1">
            {legendEntries.map((entry) => (
              <li key={entry.id} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color || '#2563eb' }}
                  aria-hidden
                />
                <span>{entry.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
