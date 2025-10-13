'use client'

import React, { memo, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LazyImage from './LazyImage'
import { useRenderPerformance } from '../hooks/usePerformanceMonitor'

interface OptimizedImageGalleryProps {
  images: Array<{
    src: string
    alt: string
    thumbnail?: string
    caption?: string
  }>
  maxImages?: number
  showThumbnails?: boolean
  autoPlay?: boolean
  interval?: number
  className?: string
}

const OptimizedImageGallery = memo(function OptimizedImageGallery({
  images,
  maxImages = 10,
  showThumbnails = true,
  autoPlay = false,
  interval = 3000,
  className = ''
}: OptimizedImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const perf = useRenderPerformance('ImageGallery')
  const isSlowDevice = perf.metrics.renderTime > 200 || perf.metrics.memoryUsage > 150
  const connectionSpeed: 'slow' | 'fast' = perf.metrics.networkLatency > 800 ? 'slow' : 'fast'

  // Optimize images based on device performance
  const optimizedImages = useMemo(() => {
    const limitedImages = images.slice(0, maxImages)
    
    // For slow devices or slow connections, use lower quality
    const quality = isSlowDevice || connectionSpeed === 'slow' ? 50 : 75
    
    return limitedImages.map(image => ({
      ...image,
      quality,
      // Use thumbnail for slow connections
      displaySrc: (connectionSpeed === 'slow' && image.thumbnail) ? image.thumbnail : image.src
    }))
  }, [images, maxImages, isSlowDevice, connectionSpeed])

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % optimizedImages.length)
  }, [optimizedImages.length])

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + optimizedImages.length) % optimizedImages.length)
  }, [optimizedImages.length])

  const goToImage = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Auto-play effect
  React.useEffect(() => {
    if (!autoPlay || optimizedImages.length <= 1) return

    const timer = setInterval(nextImage, interval)
    return () => clearInterval(timer)
  }, [autoPlay, interval, nextImage, optimizedImages.length])

  // Keyboard navigation
  React.useEffect(() => {
    if (!isFullscreen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          prevImage()
          break
        case 'ArrowRight':
          nextImage()
          break
        case 'Escape':
          setIsFullscreen(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, nextImage, prevImage])

  if (optimizedImages.length === 0) {
    return null
  }

  const currentImage = optimizedImages[currentIndex]

  return (
    <div className={`relative ${className}`}>
      {/* Main Image */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        <LazyImage
          src={currentImage.displaySrc}
          alt={currentImage.alt}
          fill
          priority={currentIndex === 0}
          className="object-cover cursor-pointer"
          onClick={toggleFullscreen}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Navigation Arrows */}
        {optimizedImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors touch-target"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors touch-target"
              aria-label="Next image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter */}
        {optimizedImages.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
            {currentIndex + 1} / {optimizedImages.length}
          </div>
        )}
      </div>

      {/* Caption */}
      {currentImage.caption && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
          {currentImage.caption}
        </p>
      )}

      {/* Thumbnails */}
      {showThumbnails && optimizedImages.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {optimizedImages.map((image, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <LazyImage
                src={image.thumbnail || image.displaySrc}
                alt={image.alt}
                width={64}
                height={64}
                className="object-cover w-full h-full"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleFullscreen}
          >
            <motion.div
              className="relative max-w-full max-h-full p-4"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <LazyImage
                src={currentImage.src}
                alt={currentImage.alt}
                width={800}
                height={600}
                className="max-w-full max-h-full object-contain"
                priority
              />
              
              {/* Close Button */}
              <button
                onClick={toggleFullscreen}
                className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors touch-target"
                aria-label="Close fullscreen"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Fullscreen Navigation */}
              {optimizedImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors touch-target"
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors touch-target"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Fullscreen Counter */}
              {optimizedImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                  {currentIndex + 1} / {optimizedImages.length}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default OptimizedImageGallery
