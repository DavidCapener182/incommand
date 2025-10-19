'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

export interface Coordinates {
  lat: number
  lng: number
}

interface GeocodeResult {
  coordinates: Coordinates | null
  isLoading: boolean
  error: string | null
}

const memoryCache = new Map<string, Coordinates>()

function tryParseCoordinate(query: string): Coordinates | null {
  const trimmed = query.trim()
  const parts = trimmed.split(/[,\s]+/)
  if (parts.length !== 2) {
    return null
  }
  const lat = Number(parts[0])
  const lng = Number(parts[1])
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat <= 90 && lat >= -90 && lng <= 180 && lng >= -180) {
    return { lat, lng }
  }
  return null
}

async function geocode(query: string): Promise<Coordinates | null> {
  const normalized = query.trim()
  if (!normalized) {
    return null
  }

  const cached = memoryCache.get(normalized.toLowerCase())
  if (cached) {
    return cached
  }

  const coordinateMatch = tryParseCoordinate(normalized)
  if (coordinateMatch) {
    memoryCache.set(normalized.toLowerCase(), coordinateMatch)
    return coordinateMatch
  }

  const provider = (process.env.NEXT_PUBLIC_MAP_PROVIDER || '').toLowerCase()

  try {
    if (provider === 'mapbox') {
      const token = process.env.NEXT_PUBLIC_MAPBOX_API_KEY
      if (!token) {
        throw new Error('Mapbox API key is not configured')
      }
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(normalized)}.json?access_token=${token}&limit=1`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Mapbox geocoding failed (${response.status})`)
      }
      const data = await response.json()
      const feature = data?.features?.[0]
      if (feature?.center?.length === 2) {
        const coords: Coordinates = { lat: feature.center[1], lng: feature.center[0] }
        memoryCache.set(normalized.toLowerCase(), coords)
        return coords
      }
      return null
    }

    if (provider === 'google') {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!key) {
        throw new Error('Google Maps API key is not configured')
      }
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(normalized)}&key=${key}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Google geocoding failed (${response.status})`)
      }
      const data = await response.json()
      const location = data?.results?.[0]?.geometry?.location
      if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
        const coords: Coordinates = { lat: location.lat, lng: location.lng }
        memoryCache.set(normalized.toLowerCase(), coords)
        return coords
      }
      return null
    }

    if (provider === 'maptiler') {
      const key = process.env.NEXT_PUBLIC_MAPTILER_API_KEY
      if (!key) {
        throw new Error('MapTiler API key is not configured')
      }
      const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(normalized)}.json?key=${key}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`MapTiler geocoding failed (${response.status})`)
      }
      const data = await response.json()
      const feature = data?.features?.[0]
      if (feature?.center?.length === 2) {
        const coords: Coordinates = { lat: feature.center[1], lng: feature.center[0] }
        memoryCache.set(normalized.toLowerCase(), coords)
        return coords
      }
      return null
    }

    // Default to OpenStreetMap Nominatim
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalized)}&limit=1`
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      }
    })
    if (!response.ok) {
      throw new Error(`OpenStreetMap geocoding failed (${response.status})`)
    }
    const data = await response.json()
    const first = Array.isArray(data) ? data[0] : null
    if (first?.lat && first?.lon) {
      const coords: Coordinates = { lat: parseFloat(first.lat), lng: parseFloat(first.lon) }
      memoryCache.set(normalized.toLowerCase(), coords)
      return coords
    }
    return null
  } catch (error) {
    console.warn('Failed to geocode location', error)
    throw error
  }
}

export function useGeocodeLocation(query: string | null | undefined, enabled: boolean): GeocodeResult {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const latestQuery = useRef<string>('')

  const normalizedQuery = useMemo(() => (query || '').trim(), [query])

  useEffect(() => {
    if (!enabled || !normalizedQuery) {
      setCoordinates(null)
      setError(null)
      latestQuery.current = ''
      return
    }

    const lower = normalizedQuery.toLowerCase()
    if (memoryCache.has(lower)) {
      const cached = memoryCache.get(lower) || null
      setCoordinates(cached)
      setError(null)
      latestQuery.current = normalizedQuery
      return
    }

    let active = true
    setIsLoading(true)
    setError(null)
    latestQuery.current = normalizedQuery

    geocode(normalizedQuery)
      .then((coords) => {
        if (!active) return
        setCoordinates(coords)
        setError(null)
      })
      .catch((err: Error) => {
        if (!active) return
        setCoordinates(null)
        setError(err.message)
      })
      .finally(() => {
        if (!active) return
        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [enabled, normalizedQuery])

  return { coordinates, isLoading, error }
}

export default useGeocodeLocation
