/**
 * Photo Capture Hook
 * Provides camera access and photo upload functionality
 */

import { useState, useCallback, useRef } from 'react'

export interface PhotoCaptureState {
  photos: CapturedPhoto[]
  isCapturing: boolean
  isCameraAvailable: boolean
  error: string | null
  uploadProgress: number
}

export interface CapturedPhoto {
  id: string
  url: string
  file: File
  timestamp: string
  metadata: PhotoMetadata
  uploaded: boolean
  uploadError?: string
}

export interface PhotoMetadata {
  width: number
  height: number
  size: number
  type: string
  location?: GeolocationCoordinates
  compressedSize?: number
  compressionRatio?: number
}

export interface PhotoCaptureOptions {
  maxPhotos?: number
  maxSize?: number // MB
  quality?: number // 0-1
  autoCompress?: boolean
  captureLocation?: boolean
}

export function usePhotoCapture(options: PhotoCaptureOptions = {}) {
  const {
    maxPhotos = 5,
    maxSize = 5, // 5MB
    quality = 0.8,
    autoCompress = true,
    captureLocation = true
  } = options

  const [state, setState] = useState<PhotoCaptureState>({
    photos: [],
    isCapturing: false,
    isCameraAvailable: typeof navigator !== 'undefined' && 'mediaDevices' in navigator,
    error: null,
    uploadProgress: 0
  })

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Capture photo from camera
  const captureFromCamera = useCallback(async () => {
    if (!state.isCameraAvailable) {
      setState(prev => ({ ...prev, error: 'Camera not available on this device' }))
      return null
    }

    try {
      setState(prev => ({ ...prev, isCapturing: true, error: null }))

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use rear camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })

      streamRef.current = stream

      // Create video element
      if (!videoRef.current) {
        videoRef.current = document.createElement('video')
      }

      videoRef.current.srcObject = stream
      await videoRef.current.play()

      // Wait for video to be ready
      await new Promise(resolve => setTimeout(resolve, 500))

      // Capture frame
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const context = canvas.getContext('2d')
      context?.drawImage(videoRef.current, 0, 0)

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', quality)
      })

      // Stop camera
      stream.getTracks().forEach(track => track.stop())
      streamRef.current = null

      // Create file
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })

      // Process and add photo
      const photo = await processPhoto(file, captureLocation, autoCompress, quality, maxSize)
      
      if (state.photos.length >= maxPhotos) {
        setState(prev => ({ 
          ...prev, 
          error: `Maximum ${maxPhotos} photos allowed`,
          isCapturing: false
        }))
        return null
      }

      setState(prev => ({
        ...prev,
        photos: [...prev.photos, photo],
        isCapturing: false
      }))

      return photo
    } catch (error: any) {
      console.error('Camera capture error:', error)
      
      let errorMessage = 'Failed to access camera'
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please enable camera permissions.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.'
      }

      setState(prev => ({
        ...prev,
        isCapturing: false,
        error: errorMessage
      }))

      // Clean up stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      return null
    }
  }, [state.isCameraAvailable, state.photos.length, maxPhotos, quality, captureLocation, autoCompress, maxSize])

  // Upload from file picker
  const uploadFromDevice = useCallback(async (file: File) => {
    try {
      setState(prev => ({ ...prev, error: null }))

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setState(prev => ({ ...prev, error: 'Please select an image file' }))
        return null
      }

      // Check max photos
      if (state.photos.length >= maxPhotos) {
        setState(prev => ({ 
          ...prev, 
          error: `Maximum ${maxPhotos} photos allowed` 
        }))
        return null
      }

      // Process photo
      const photo = await processPhoto(file, captureLocation, autoCompress, quality, maxSize)

      setState(prev => ({
        ...prev,
        photos: [...prev.photos, photo]
      }))

      return photo
    } catch (error: any) {
      console.error('Photo upload error:', error)
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to upload photo'
      }))
      return null
    }
  }, [state.photos.length, maxPhotos, captureLocation, autoCompress, quality, maxSize])

  // Remove photo
  const removePhoto = useCallback((photoId: string) => {
    setState(prev => ({
      ...prev,
      photos: prev.photos.filter(photo => photo.id !== photoId)
    }))
  }, [])

  // Clear all photos
  const clearPhotos = useCallback(() => {
    setState(prev => ({ ...prev, photos: [] }))
  }, [])

  // Upload photos to server
  const uploadPhotos = useCallback(async (incidentId: string): Promise<string[]> => {
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < state.photos.length; i++) {
        const photo = state.photos[i]
        
        setState(prev => ({
          ...prev,
          uploadProgress: ((i + 1) / state.photos.length) * 100
        }))

        const formData = new FormData()
        formData.append('file', photo.file)
        formData.append('incidentId', incidentId)
        formData.append('timestamp', photo.timestamp)
        
        if (photo.metadata.location) {
          formData.append('latitude', photo.metadata.location.latitude.toString())
          formData.append('longitude', photo.metadata.location.longitude.toString())
        }

        const response = await fetch('/api/incidents/upload-photo', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`Upload failed for photo ${photo.id}`)
        }

        const result = await response.json()
        uploadedUrls.push(result.url)

        // Mark photo as uploaded
        setState(prev => ({
          ...prev,
          photos: prev.photos.map(p => 
            p.id === photo.id ? { ...p, uploaded: true } : p
          )
        }))
      }

      setState(prev => ({ ...prev, uploadProgress: 0 }))
      return uploadedUrls
    } catch (error: any) {
      console.error('Photo upload error:', error)
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to upload photos',
        uploadProgress: 0
      }))
      throw error
    }
  }, [state.photos])

  return {
    ...state,
    captureFromCamera,
    uploadFromDevice,
    removePhoto,
    clearPhotos,
    uploadPhotos
  }
}

/**
 * Process and optimize photo
 */
async function processPhoto(
  file: File,
  captureLocation: boolean,
  autoCompress: boolean,
  quality: number,
  maxSize: number
): Promise<CapturedPhoto> {
  // Get image dimensions
  const dimensions = await getImageDimensions(file)

  // Compress if needed
  let processedFile = file
  let compressionRatio = 1

  if (autoCompress && file.size > maxSize * 1024 * 1024) {
    processedFile = await compressImage(file, quality, maxSize)
    compressionRatio = file.size / processedFile.size
  }

  // Get location if enabled
  let location: GeolocationCoordinates | undefined

  if (captureLocation && 'geolocation' in navigator) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          enableHighAccuracy: true
        })
      })
      location = position.coords
    } catch (error) {
      console.warn('Could not get location:', error)
    }
  }

  // Create photo object
  const photo: CapturedPhoto = {
    id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    url: URL.createObjectURL(processedFile),
    file: processedFile,
    timestamp: new Date().toISOString(),
    metadata: {
      width: dimensions.width,
      height: dimensions.height,
      size: file.size,
      type: file.type,
      location,
      compressedSize: processedFile.size,
      compressionRatio
    },
    uploaded: false
  }

  return photo
}

/**
 * Get image dimensions
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Compress image
 */
async function compressImage(file: File, quality: number, maxSizeMB: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Calculate new dimensions to stay under max size
        const maxDimension = 1920
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else {
            width = (width / height) * maxDimension
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Compression failed'))
            }
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = reject
      img.src = e.target?.result as string
    }

    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
