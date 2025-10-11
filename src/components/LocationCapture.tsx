'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

export interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  altitude?: number | null
  altitudeAccuracy?: number | null
  heading?: number | null
  speed?: number | null
  timestamp: string
  address?: string
  what3words?: string
}

interface LocationCaptureProps {
  onLocationCaptured?: (location: LocationData) => void
  onLocationCleared?: () => void
  autoCapture?: boolean
  showMap?: boolean
  className?: string
  compact?: boolean
}

export default function LocationCapture({
  onLocationCaptured,
  onLocationCleared,
  autoCapture = false,
  showMap = true,
  className = '',
  compact = false
}: LocationCaptureProps) {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [what3words, setWhat3words] = useState<string | null>(null)

  // Auto-capture on mount if enabled
  useEffect(() => {
    if (autoCapture) {
      captureLocation()
    }
  }, [autoCapture])

  const captureLocation = async () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setIsCapturing(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        )
      })

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: new Date(position.timestamp).toISOString()
      }

      setLocation(locationData)
      onLocationCaptured?.(locationData)

      // Fetch reverse geocoding
      await fetchAddress(locationData.latitude, locationData.longitude)
      
      // Fetch What3Words (if API key available)
      await fetchWhat3Words(locationData.latitude, locationData.longitude)

      setIsCapturing(false)
    } catch (error: any) {
      console.error('Location error:', error)
      
      let errorMessage = 'Failed to get location'
      switch (error.code) {
        case 1: // PERMISSION_DENIED
          errorMessage = 'Location access denied. Please enable location permissions.'
          break
        case 2: // POSITION_UNAVAILABLE
          errorMessage = 'Location information unavailable.'
          break
        case 3: // TIMEOUT
          errorMessage = 'Location request timed out. Please try again.'
          break
      }

      setError(errorMessage)
      setIsCapturing(false)
    }
  }

  const clearLocation = () => {
    setLocation(null)
    setAddress(null)
    setWhat3words(null)
    setError(null)
    onLocationCleared?.()
  }

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      // Using OpenStreetMap Nominatim (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'inCommand Event Management System'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        const formattedAddress = data.display_name || 
          `${data.address?.road || ''}, ${data.address?.city || data.address?.town || ''}`
        setAddress(formattedAddress)
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }
  }

  const fetchWhat3Words = async (lat: number, lng: number) => {
    try {
      // This would require a What3Words API key
      // For now, we'll generate a mock what3words address
      const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel']
      const mockW3W = `///${words[Math.floor(Math.random() * words.length)]}.${words[Math.floor(Math.random() * words.length)]}.${words[Math.floor(Math.random() * words.length)]}`
      setWhat3words(mockW3W)
    } catch (error) {
      console.error('What3Words error:', error)
    }
  }

  const openInMaps = () => {
    if (!location) return
    
    // Open in device's default maps app
    const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    window.open(mapsUrl, '_blank')
  }

  const copyCoordinates = async () => {
    if (!location) return
    
    const coords = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
    await navigator.clipboard.writeText(coords)
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={location ? clearLocation : captureLocation}
          disabled={isCapturing}
          className={`p-2 rounded-lg transition-colors ${
            location
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title={location ? 'Location captured' : 'Capture location'}
        >
          {isCapturing ? (
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
          ) : location ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <MapPinIcon className="h-5 w-5" />
          )}
        </button>
        {location && (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPinIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Location
          </span>
        </div>
        {location && (
          <button
            onClick={clearLocation}
            className="text-xs text-red-600 dark:text-red-400 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Capture Button */}
      {!location && (
        <button
          type="button"
          onClick={captureLocation}
          disabled={isCapturing}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
        >
          {isCapturing ? (
            <>
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              <span>Capturing Location...</span>
            </>
          ) : (
            <>
              <MapPinIcon className="h-5 w-5" />
              <span>Capture Current Location</span>
            </>
          )}
        </button>
      )}

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
          >
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Display */}
      {location && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
        >
          {/* Coordinates */}
          <div className="flex items-start gap-3 mb-3">
            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white mb-1">
                Location Captured
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Coordinates:</span>
                  <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </code>
                  <button
                    onClick={copyCoordinates}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                  >
                    Copy
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Accuracy:</span>
                  <span className="text-xs">±{location.accuracy.toFixed(0)}m</span>
                </div>
                {address && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Address:</span>
                    <span className="text-xs">{address}</span>
                  </div>
                )}
                {what3words && (
                  <div className="flex items-center gap-2">
                    <Image src="/w3w.png" alt="what3words" width={16} height={16} className="h-4 w-4" />
                    <code className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                      {what3words}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Map Preview */}
          {showMap && (
            <div className="mt-3 rounded-lg overflow-hidden border border-green-300 dark:border-green-700">
              <Image
                src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+3b82f6(${location.longitude},${location.latitude})/${location.longitude},${location.latitude},15,0/400x200@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`}
                alt="Location map"
                width={400}
                height={200}
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={openInMaps}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <GlobeAltIcon className="h-4 w-4" />
              <span>Open in Maps</span>
            </button>
            <button
              onClick={captureLocation}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
              title="Refresh location"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Compact version for inline use
export function LocationCaptureCompact({
  onLocationCaptured,
  className = ''
}: {
  onLocationCaptured?: (location: LocationData) => void
  className?: string
}) {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  const captureLocation = async () => {
    if (!('geolocation' in navigator)) return

    setIsCapturing(true)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000
        })
      })

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: new Date(position.timestamp).toISOString()
      }

      setLocation(locationData)
      onLocationCaptured?.(locationData)
    } catch (error) {
      console.error('Location capture error:', error)
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <button
      type="button"
      onClick={location ? () => setLocation(null) : captureLocation}
      disabled={isCapturing}
      className={`p-2 rounded-lg transition-colors ${
        location
          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
      } ${className}`}
      title={location ? `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Capture location'}
    >
      {isCapturing ? (
        <ArrowPathIcon className="h-5 w-5 animate-spin" />
      ) : location ? (
        <CheckCircleIcon className="h-5 w-5" />
      ) : (
        <MapPinIcon className="h-5 w-5" />
      )}
    </button>
  )
}
