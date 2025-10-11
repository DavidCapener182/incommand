'use client'

import { useEffect, useState, useCallback } from 'react'

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage?: number
  networkLatency?: number
  fps?: number
}

interface PerformanceMonitorOptions {
  trackRenderTime?: boolean
  trackMemory?: boolean
  trackNetwork?: boolean
  trackFPS?: boolean
  reportInterval?: number
}

export function usePerformanceMonitor(
  componentName: string,
  options: PerformanceMonitorOptions = {}
) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0
  })
  
  const [isSlowDevice, setIsSlowDevice] = useState(false)
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'medium' | 'fast'>('medium')

  const {
    trackRenderTime = true,
    trackMemory = false,
    trackNetwork = false,
    trackFPS: shouldTrackFPS = false,
    reportInterval = 5000
  } = options

  // Detect slow devices
  useEffect(() => {
    const checkDevicePerformance = () => {
      // Check hardware concurrency (CPU cores)
      const cores = navigator.hardwareConcurrency || 1
      
      // Check memory (if available)
      const memory = (navigator as any).deviceMemory || 4
      
      // Check connection speed
      const connection = (navigator as any).connection
      if (connection) {
        const effectiveType = connection.effectiveType
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          setConnectionSpeed('slow')
        } else if (effectiveType === '3g') {
          setConnectionSpeed('medium')
        } else {
          setConnectionSpeed('fast')
        }
      }
      
      // Determine if device is slow
      const slowDevice = cores < 4 || memory < 4 || connectionSpeed === 'slow'
      setIsSlowDevice(slowDevice)
      
      if (slowDevice) {
        console.warn(`[Performance] Slow device detected for ${componentName}:`, {
          cores,
          memory,
          connection: connectionSpeed
        })
      }
    }

    checkDevicePerformance()
  }, [componentName, connectionSpeed])

  // Track render performance
  const trackRender = useCallback((startTime: number) => {
    if (!trackRenderTime) return

    const endTime = performance.now()
    const renderTime = endTime - startTime

    setMetrics(prev => ({
      ...prev,
      renderTime
    }))

    if (renderTime > 16) { // More than one frame at 60fps
      console.warn(`[Performance] Slow render for ${componentName}: ${renderTime.toFixed(2)}ms`)
    }
  }, [componentName, trackRenderTime])

  // Track memory usage
  const trackMemoryUsage = useCallback(() => {
    if (!trackMemory || !('memory' in performance)) return

    const memory = (performance as any).memory
    if (memory) {
      const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memoryUsage * 100
      }))

      if (memoryUsage > 0.8) {
        console.warn(`[Performance] High memory usage for ${componentName}: ${(memoryUsage * 100).toFixed(1)}%`)
      }
    }
  }, [componentName, trackMemory])

  // Track FPS
  const trackFPS = useCallback(() => {
    if (!shouldTrackFPS) return

    let lastTime = performance.now()
    let frameCount = 0
    let fps = 0

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        frameCount = 0
        lastTime = currentTime
        
        setMetrics(prev => ({
          ...prev,
          fps
        }))

        if (fps < 30) {
          console.warn(`[Performance] Low FPS for ${componentName}: ${fps}`)
        }
      }
      
      requestAnimationFrame(measureFPS)
    }

    requestAnimationFrame(measureFPS)
  }, [componentName, shouldTrackFPS])

  // Track network latency
  const trackNetworkLatency = useCallback(async () => {
    if (!trackNetwork) return

    const startTime = performance.now()
    
    try {
      await fetch('/api/ping', { method: 'HEAD' })
      const latency = performance.now() - startTime
      
      setMetrics(prev => ({
        ...prev,
        networkLatency: latency
      }))

      if (latency > 1000) {
        console.warn(`[Performance] High network latency for ${componentName}: ${latency.toFixed(0)}ms`)
      }
    } catch (error) {
      console.warn(`[Performance] Network test failed for ${componentName}:`, error)
    }
  }, [componentName, trackNetwork])

  // Performance reporting
  useEffect(() => {
    const reportMetrics = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} metrics:`, metrics)
      }
    }

    const interval = setInterval(reportMetrics, reportInterval)
    return () => clearInterval(interval)
  }, [componentName, metrics, reportInterval])

  // Initialize tracking
  useEffect(() => {
    trackMemoryUsage()
    trackFPS()
    trackNetworkLatency()
  }, [trackMemoryUsage, trackFPS, trackNetworkLatency])

  return {
    metrics,
    isSlowDevice,
    connectionSpeed,
    trackRender,
    trackMemoryUsage,
    trackNetworkLatency
  }
}
