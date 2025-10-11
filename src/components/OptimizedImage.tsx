'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  fill?: boolean
  sizes?: string
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  loading?: 'lazy' | 'eager'
  onLoad?: () => void
  onError?: () => void
  fallbackSrc?: string
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  fill = false,
  sizes,
  placeholder = 'empty',
  blurDataURL,
  objectFit = 'cover',
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc = '/placeholder-image.png'
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)
  const [isInView, setIsInView] = useState(priority || loading === 'eager')
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || loading === 'eager') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px', // Load images 50px before they enter viewport
        threshold: 0.01
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority, loading])

  // Update src when prop changes
  useEffect(() => {
    setImageSrc(src)
    setHasError(false)
  }, [src])

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    setImageSrc(fallbackSrc)
    onError?.()
  }

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={fill ? {} : { width, height }}
    >
      {/* Loading Skeleton */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actual Image */}
      {isInView && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoading ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          {fill ? (
            <Image
              src={imageSrc}
              alt={alt}
              fill
              quality={quality}
              sizes={sizes}
              placeholder={placeholder}
              blurDataURL={blurDataURL}
              className={className}
              style={{ objectFit }}
              onLoad={handleLoad}
              onError={handleError}
              priority={priority}
            />
          ) : (
            <Image
              src={imageSrc}
              alt={alt}
              width={width}
              height={height}
              quality={quality}
              sizes={sizes}
              placeholder={placeholder}
              blurDataURL={blurDataURL}
              className={className}
              style={{ objectFit }}
              onLoad={handleLoad}
              onError={handleError}
              priority={priority}
            />
          )}
        </motion.div>
      )}

      {/* Error State */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center p-4">
            <svg
              className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-xs text-gray-500 dark:text-gray-400">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Avatar image with fallback to initials
interface AvatarImageProps extends Omit<OptimizedImageProps, 'fallbackSrc'> {
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

export function AvatarImage({ 
  name, 
  size = 'md', 
  ...props 
}: AvatarImageProps) {
  const [hasError, setHasError] = useState(false)

  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80
  }

  const dimension = sizeMap[size]

  const getInitials = (name?: string) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  if (hasError || !props.src) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold rounded-full ${props.className || ''}`}
        style={{ width: dimension, height: dimension, fontSize: dimension / 3 }}
      >
        {getInitials(name)}
      </div>
    )
  }

  return (
    <div className="relative rounded-full overflow-hidden">
      <OptimizedImage
        {...props}
        width={dimension}
        height={dimension}
        className={`rounded-full ${props.className || ''}`}
        onError={() => setHasError(true)}
        objectFit="cover"
      />
    </div>
  )
}
