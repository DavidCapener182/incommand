// src/hooks/useScreenReader.ts
'use client'

import { useCallback, useEffect, useRef } from 'react'

type AriaLive = 'polite' | 'assertive' | 'off'

interface ScreenReaderOptions {
  politeness?: AriaLive
  clearOnUnmount?: boolean
}

/**
 * Hook to announce messages to screen readers
 * Creates an invisible live region for announcements
 */
export function useScreenReader({
  politeness = 'polite',
  clearOnUnmount = true
}: ScreenReaderOptions = {}) {
  const liveRegionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Create or get the live region
    let liveRegion = document.getElementById('screen-reader-live-region') as HTMLDivElement

    if (!liveRegion) {
      liveRegion = document.createElement('div')
      liveRegion.id = 'screen-reader-live-region'
      liveRegion.setAttribute('aria-live', politeness)
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.setAttribute('role', 'status')
      liveRegion.style.position = 'absolute'
      liveRegion.style.left = '-10000px'
      liveRegion.style.width = '1px'
      liveRegion.style.height = '1px'
      liveRegion.style.overflow = 'hidden'
      document.body.appendChild(liveRegion)
    }

    liveRegionRef.current = liveRegion

    return () => {
      if (clearOnUnmount && liveRegionRef.current) {
        liveRegionRef.current.textContent = ''
      }
    }
  }, [politeness, clearOnUnmount])

  const announce = useCallback((message: string, options?: { politeness?: AriaLive; clearPrevious?: boolean }) => {
    if (!liveRegionRef.current) return

    const region = liveRegionRef.current

    // Update politeness if specified
    if (options?.politeness) {
      region.setAttribute('aria-live', options.politeness)
    }

    // Clear previous announcement if requested
    if (options?.clearPrevious) {
      region.textContent = ''
      // Small delay to ensure screen readers recognize it as a new announcement
      setTimeout(() => {
        region.textContent = message
      }, 100)
    } else {
      region.textContent = message
    }
  }, [])

  const clear = useCallback(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = ''
    }
  }, [])

  return { announce, clear }
}

/**
 * Utility function to announce messages without a hook
 * Useful for one-off announcements
 */
export function announceToScreenReader(
  message: string,
  politeness: AriaLive = 'polite'
) {
  let liveRegion = document.getElementById('screen-reader-live-region') as HTMLDivElement

  if (!liveRegion) {
    liveRegion = document.createElement('div')
    liveRegion.id = 'screen-reader-live-region'
    liveRegion.setAttribute('aria-live', politeness)
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.setAttribute('role', 'status')
    liveRegion.style.position = 'absolute'
    liveRegion.style.left = '-10000px'
    liveRegion.style.width = '1px'
    liveRegion.style.height = '1px'
    liveRegion.style.overflow = 'hidden'
    document.body.appendChild(liveRegion)
  }

  liveRegion.setAttribute('aria-live', politeness)
  liveRegion.textContent = message
}

