'use client'

import React, { useState } from 'react'
import {
  CameraIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { usePhotoCapture, type CapturedPhoto } from '@/hooks/usePhotoCapture'

interface PhotoCaptureWidgetProps {
  onPhotosChange?: (photos: CapturedPhoto[]) => void
  maxPhotos?: number
  className?: string
  compact?: boolean
}

export default function PhotoCaptureWidget({
  onPhotosChange,
  maxPhotos = 5,
  className = '',
  compact = false
}: PhotoCaptureWidgetProps) {
  const {
    photos,
    isCapturing,
    isCameraAvailable,
    error,
    uploadProgress,
    captureFromCamera,
    uploadFromDevice,
    removePhoto,
    clearPhotos
  } = usePhotoCapture({ maxPhotos, autoCompress: true, captureLocation: true })

  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(null)

  // Notify parent of photo changes
  React.useEffect(() => {
    onPhotosChange?.(photos)
  }, [photos, onPhotosChange])

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    for (let i = 0; i < files.length && photos.length < maxPhotos; i++) {
      await uploadFromDevice(files[i])
    }

    // Reset input
    event.target.value = ''
  }

  const handleCapture = async () => {
    await captureFromCamera()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Camera Button */}
        {isCameraAvailable && (
          <button
            type="button"
            onClick={handleCapture}
            disabled={isCapturing || photos.length >= maxPhotos}
            className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Take photo"
          >
            <CameraIcon className="h-5 w-5" />
          </button>
        )}

        {/* Upload Button */}
        <label className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors">
          <PhotoIcon className="h-5 w-5" />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            className="hidden"
            disabled={photos.length >= maxPhotos}
          />
        </label>

        {/* Photo Count */}
        {photos.length > 0 && (
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
            {photos.length}
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
          <PhotoIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Photos ({photos.length}/{maxPhotos})
          </span>
        </div>
        {photos.length > 0 && (
          <button
            onClick={clearPhotos}
            className="text-xs text-red-600 dark:text-red-400 hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {/* Camera Button */}
        {isCameraAvailable && (
          <button
            type="button"
            onClick={handleCapture}
            disabled={isCapturing || photos.length >= maxPhotos}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
          >
            <CameraIcon className={`h-5 w-5 ${isCapturing ? 'animate-pulse' : ''}`} />
            <span>{isCapturing ? 'Capturing...' : 'Take Photo'}</span>
          </button>
        )}

        {/* Upload Button */}
        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium cursor-pointer transition-colors">
          <ArrowUpTrayIcon className="h-5 w-5" />
          <span>Upload</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            className="hidden"
            disabled={photos.length >= maxPhotos}
          />
        </label>
      </div>

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

      {/* Upload Progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpTrayIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Uploading... {uploadProgress.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden group"
            >
              {/* Photo */}
              <img
                src={photo.url}
                alt={`Photo ${photo.id}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200">
                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removePhoto(photo.id)
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between text-white text-xs">
                    <span>{formatFileSize(photo.metadata.compressedSize || photo.metadata.size)}</span>
                    {photo.uploaded && (
                      <CheckCircleIcon className="h-4 w-4 text-green-400" />
                    )}
                    {photo.metadata.location && (
                      <MapPinIcon className="h-4 w-4 text-blue-400" />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Photo Detail Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              {/* Photo */}
              <img
                src={selectedPhoto.url}
                alt="Full size photo"
                className="w-full h-auto rounded-lg shadow-2xl"
              />

              {/* Metadata */}
              <div className="mt-4 bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-white/60 mb-1">Size</div>
                    <div className="font-medium">
                      {formatFileSize(selectedPhoto.metadata.compressedSize || selectedPhoto.metadata.size)}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60 mb-1">Dimensions</div>
                    <div className="font-medium">
                      {selectedPhoto.metadata.width} × {selectedPhoto.metadata.height}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60 mb-1">Timestamp</div>
                    <div className="font-medium">
                      {new Date(selectedPhoto.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  {selectedPhoto.metadata.location && (
                    <div>
                      <div className="text-white/60 mb-1">Location</div>
                      <div className="font-medium flex items-center gap-1">
                        <MapPinIcon className="h-4 w-4" />
                        Captured
                      </div>
                    </div>
                  )}
                </div>
                {selectedPhoto.metadata.compressionRatio && selectedPhoto.metadata.compressionRatio > 1 && (
                  <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/80">
                    Compressed {selectedPhoto.metadata.compressionRatio.toFixed(1)}x (
                    {formatFileSize(selectedPhoto.metadata.size)} → {formatFileSize(selectedPhoto.metadata.compressedSize || 0)})
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
