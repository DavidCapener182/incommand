'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { handleError } from '../lib/errorHandler'

interface CameraCaptureProps {
  onCapture: (blob: Blob, coordinates?: { latitude: number; longitude: number }) => void
  onError?: (error: Error) => void
  className?: string
  showGPS?: boolean
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onError,
  className = '',
  showGPS = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  /**
   * Get available camera devices
   */
  const getCameraDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setDevices(videoDevices)
      
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to enumerate devices')
      handleError(err, {
        component: 'CameraCapture',
        action: 'getCameraDevices'
      }, 'medium', false)
      onError?.(err)
    }
  }, [selectedDevice, onError])

  /**
   * Start camera stream
   */
  const startStream = useCallback(async (deviceId?: string) => {
    try {
      // Stop existing stream first
      await stopStream()

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsStreaming(true)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start camera stream')
      handleError(err, {
        component: 'CameraCapture',
        action: 'startStream',
        additionalData: { deviceId }
      }, 'high', true)
      onError?.(err)
    }
  }, [onError])

  /**
   * Stop camera stream with proper cleanup
   */
  const stopStream = useCallback(async () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks()
      tracks.forEach(track => {
        track.stop()
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsStreaming(false)
  }, [])

  /**
   * Get GPS coordinates
   */
  const getGPSLocation = useCallback(async (): Promise<{ latitude: number; longitude: number } | null> => {
    if (!showGPS || !navigator.geolocation) {
      return null
    }

    try {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('GPS location request timed out'))
        }, 10000) // 10 second timeout

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId)
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
            setCoordinates(coords)
            resolve(coords)
          },
          (error) => {
            clearTimeout(timeoutId)
            reject(new Error(`GPS error: ${error.message}`))
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        )
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to get GPS location')
      handleError(err, {
        component: 'CameraCapture',
        action: 'getGPSLocation'
      }, 'low', false)
      return null
    }
  }, [showGPS])

  /**
   * Capture photo
   */
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) {
      return
    }

    setIsCapturing(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('Failed to get canvas context')
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob from canvas'))
          }
        }, 'image/jpeg', 0.9)
      })

      // Get GPS coordinates if enabled
      let gpsCoords = coordinates
      if (showGPS && !coordinates) {
        gpsCoords = await getGPSLocation()
      }

      // Call onCapture with blob and coordinates
      onCapture(blob, gpsCoords || undefined)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to capture photo')
      handleError(err, {
        component: 'CameraCapture',
        action: 'capturePhoto'
      }, 'medium', true)
      onError?.(err)
    } finally {
      setIsCapturing(false)
    }
  }, [isStreaming, coordinates, showGPS, getGPSLocation, onCapture, onError])

  /**
   * Handle device selection change
   */
  const handleDeviceChange = useCallback(async (deviceId: string) => {
    setSelectedDevice(deviceId)
    await startStream(deviceId)
  }, [startStream])

  /**
   * Initialize camera on mount
   */
  useEffect(() => {
    getCameraDevices()
    startStream()

    return () => {
      stopStream()
    }
  }, [getCameraDevices, startStream, stopStream])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopStream()
    }
  }, [stopStream])

  return (
    <div className={`camera-capture ${className}`}>
      <div className="camera-controls mb-4">
        {devices.length > 1 && (
          <select
            value={selectedDevice}
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="mb-2 p-2 border rounded"
          >
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        )}

        <div className="flex gap-2">
          <button
            onClick={startStream}
            disabled={isStreaming}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Start Camera
          </button>
          <button
            onClick={stopStream}
            disabled={!isStreaming}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
          >
            Stop Camera
          </button>
          <button
            onClick={capturePhoto}
            disabled={!isStreaming || isCapturing}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            {isCapturing ? 'Capturing...' : 'Capture Photo'}
          </button>
        </div>

        {showGPS && (
          <div className="mt-2 text-sm text-gray-600">
            {coordinates ? (
              <span>
                📍 GPS: {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
              </span>
            ) : (
              <span>📍 GPS: Not available</span>
            )}
          </div>
        )}
      </div>

      <div className="camera-view">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full max-w-md border rounded"
        />
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  )
}

export default CameraCapture
