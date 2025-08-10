import { useState, useEffect, useRef, useCallback } from 'react'
import { handleError } from '../lib/errorHandler'

interface GPSLocation {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: number
}

interface UseCameraGPSOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  watchPosition?: boolean
  watchInterval?: number
}

interface UseCameraGPSReturn {
  location: GPSLocation | null
  error: string | null
  isLoading: boolean
  getCurrentLocation: () => Promise<GPSLocation | null>
  startWatching: () => void
  stopWatching: () => void
  isWatching: boolean
}

export const useCameraGPS = (options: UseCameraGPSOptions = {}): UseCameraGPSReturn => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    watchPosition = false,
    watchInterval = 5000
  } = options

  const [location, setLocation] = useState<GPSLocation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isWatching, setIsWatching] = useState(false)

  const watchIdRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  /**
   * Get current GPS location
   */
  const getCurrentLocation = useCallback(async (): Promise<GPSLocation | null> => {
    if (!navigator.geolocation) {
      const err = new Error('Geolocation is not supported by this browser')
      handleError(err, {
        component: 'useCameraGPS',
        action: 'getCurrentLocation'
      }, 'medium', false)
      setError('Geolocation not supported')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          const timeoutError = new Error('GPS location request timed out')
          handleError(timeoutError, {
            component: 'useCameraGPS',
            action: 'getCurrentLocation'
          }, 'medium', false)
          setError('Location request timed out')
          reject(timeoutError)
        }, timeout)

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId)
            const gpsLocation: GPSLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            }
            setLocation(gpsLocation)
            setIsLoading(false)
            resolve(gpsLocation)
          },
          (geolocationError) => {
            clearTimeout(timeoutId)
            const err = new Error(`GPS error: ${geolocationError.message}`)
            handleError(err, {
              component: 'useCameraGPS',
              action: 'getCurrentLocation',
              additionalData: { code: geolocationError.code }
            }, 'medium', false)
            setError(geolocationError.message)
            setIsLoading(false)
            reject(err)
          },
          {
            enableHighAccuracy,
            timeout,
            maximumAge
          }
        )
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to get GPS location')
      handleError(err, {
        component: 'useCameraGPS',
        action: 'getCurrentLocation'
      }, 'medium', false)
      setError(err.message)
      setIsLoading(false)
      return null
    }
  }, [enableHighAccuracy, timeout, maximumAge])

  /**
   * Start watching GPS position
   */
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      const err = new Error('Geolocation is not supported by this browser')
      handleError(err, {
        component: 'useCameraGPS',
        action: 'startWatching'
      }, 'medium', false)
      setError('Geolocation not supported')
      return
    }

    if (watchIdRef.current) {
      stopWatching()
    }

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const gpsLocation: GPSLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          }
          setLocation(gpsLocation)
          setError(null)
        },
        (geolocationError) => {
          const err = new Error(`GPS watch error: ${geolocationError.message}`)
          handleError(err, {
            component: 'useCameraGPS',
            action: 'startWatching',
            additionalData: { code: geolocationError.code }
          }, 'medium', false)
          setError(geolocationError.message)
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge
        }
      )
      setIsWatching(true)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start GPS watching')
      handleError(err, {
        component: 'useCameraGPS',
        action: 'startWatching'
      }, 'medium', false)
      setError(err.message)
    }
  }, [enableHighAccuracy, timeout, maximumAge])

  /**
   * Stop watching GPS position
   */
  const stopWatching = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      setIsWatching(false)
    }
  }, [])

  /**
   * Cleanup media streams
   */
  const cleanupMediaStreams = useCallback(() => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks()
      tracks.forEach(track => {
        track.stop()
      })
      streamRef.current = null
    }
  }, [])

  /**
   * Initialize GPS on mount if watchPosition is enabled
   */
  useEffect(() => {
    if (watchPosition) {
      startWatching()
    } else {
      getCurrentLocation()
    }

    return () => {
      stopWatching()
      cleanupMediaStreams()
    }
  }, [watchPosition, startWatching, stopWatching, cleanupMediaStreams, getCurrentLocation])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopWatching()
      cleanupMediaStreams()
    }
  }, [stopWatching, cleanupMediaStreams])

  return {
    location,
    error,
    isLoading,
    getCurrentLocation,
    startWatching,
    stopWatching,
    isWatching
  }
}

export default useCameraGPS
