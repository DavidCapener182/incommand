// Performance optimization utilities for mobile devices

/**
 * Debounce function to limit function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function to limit function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Check if device is slow based on hardware specs
 */
export function isSlowDevice(): boolean {
  if (typeof window === 'undefined') return false

  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 1
  
  // Check memory (if available)
  const memory = (navigator as any).deviceMemory || 4
  
  // Check connection speed
  const connection = (navigator as any).connection
  const isSlowConnection = connection && 
    (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')
  
  return cores < 4 || memory < 4 || isSlowConnection
}

/**
 * Get optimal image quality based on device performance
 */
export function getOptimalImageQuality(): number {
  if (isSlowDevice()) {
    return 50 // Lower quality for slow devices
  }
  return 75 // Standard quality
}

/**
 * Get optimal animation duration based on device performance
 */
export function getOptimalAnimationDuration(baseDuration: number = 300): number {
  if (isSlowDevice()) {
    return Math.max(baseDuration * 0.5, 150) // Faster animations for slow devices
  }
  return baseDuration
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get optimal batch size for data processing
 */
export function getOptimalBatchSize(): number {
  if (isSlowDevice()) {
    return 10 // Smaller batches for slow devices
  }
  return 25 // Standard batch size
}

/**
 * Optimize image sizes for different screen densities
 */
export function getOptimizedImageSizes(baseWidth: number, baseHeight: number): {
  width: number
  height: number
  sizes: string
} {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  
  return {
    width: Math.round(baseWidth * dpr),
    height: Math.round(baseHeight * dpr),
    sizes: `(max-width: 768px) ${baseWidth}px, (max-width: 1200px) ${baseWidth * 1.5}px, ${baseWidth * 2}px`
  }
}

/**
 * Create a performance-optimized intersection observer
 */
export function createOptimizedIntersectionObserver(
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  }

  // Use more conservative settings for slow devices
  if (isSlowDevice()) {
    defaultOptions.threshold = 0.5
    defaultOptions.rootMargin = '100px'
  }

  return new IntersectionObserver(callback, defaultOptions)
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources(resources: string[]): void {
  if (typeof window === 'undefined') return

  resources.forEach((resource) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = resource
    link.as = resource.endsWith('.css') ? 'style' : 'script'
    document.head.appendChild(link)
  })
}

/**
 * Optimize scroll performance
 */
export function optimizeScrollPerformance(element: HTMLElement): void {
  if (!element) return

  // Add will-change property for better scroll performance
  element.style.willChange = 'transform'
  
  // Use passive event listeners for better performance
  element.addEventListener('scroll', () => {}, { passive: true })
  element.addEventListener('touchstart', () => {}, { passive: true })
  element.addEventListener('touchmove', () => {}, { passive: true })
}

/**
 * Check if component should use reduced functionality for performance
 */
export function shouldUseReducedFeatures(): boolean {
  return isSlowDevice() || prefersReducedMotion()
}

/**
 * Get optimal number of items to render initially
 */
export function getInitialRenderCount(): number {
  if (isSlowDevice()) {
    return 5 // Render fewer items initially on slow devices
  }
  return 10 // Standard initial render count
}

/**
 * Memory-efficient array chunking
 */
export function chunkArray<T>(array: T[], chunkSize?: number): T[][] {
  const size = chunkSize || getOptimalBatchSize()
  const chunks: T[][] = []
  
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  
  return chunks
}

/**
 * Efficient deep clone for small objects
 */
export function efficientClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T
  }
  
  if (obj instanceof Array) {
    return obj.map(item => efficientClone(item)) as T
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = efficientClone(obj[key])
      }
    }
    return cloned
  }
  
  return obj
}
