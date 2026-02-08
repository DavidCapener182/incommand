/**
 * Simple geolocation hook for "Use my location" style actions.
 * Returns current position and loading/error state.
 */

import { useState, useCallback } from 'react'

export interface GeoPosition {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export interface UseGeolocationResult {
  position: GeoPosition | null
  loading: boolean
  error: string | null
  getCurrentPosition: (options?: PositionOptions) => Promise<GeoPosition | null>
  clearPosition: () => void
  isSupported: boolean
}

const defaultOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
}

export function useGeolocation(): UseGeolocationResult {
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  const getCurrentPosition = useCallback(async (options?: PositionOptions): Promise<GeoPosition | null> => {
    if (!isSupported) {
      setError('Geolocation is not supported by this device')
      return null
    }

    setLoading(true)
    setError(null)

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const result: GeoPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy ?? 0,
            timestamp: pos.timestamp,
          }
          setPosition(result)
          setLoading(false)
          resolve(result)
        },
        (err) => {
          let message = 'Unable to get location'
          switch (err.code) {
            case err.PERMISSION_DENIED:
              message = 'Location permission denied'
              break
            case err.POSITION_UNAVAILABLE:
              message = 'Location unavailable'
              break
            case err.TIMEOUT:
              message = 'Location request timed out'
              break
          }
          setError(message)
          setLoading(false)
          resolve(null)
        },
        { ...defaultOptions, ...options }
      )
    })
  }, [isSupported])

  const clearPosition = useCallback(() => {
    setPosition(null)
    setError(null)
  }, [])

  return {
    position,
    loading,
    error,
    getCurrentPosition,
    clearPosition,
    isSupported,
  }
}
