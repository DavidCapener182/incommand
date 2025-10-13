// src/hooks/useFocusTrap.ts
'use client'

import { useEffect, useRef } from 'react'

interface UseFocusTrapOptions {
  enabled?: boolean
  restoreFocus?: boolean
  initialFocus?: HTMLElement | null
}

/**
 * Hook to trap focus within a container (useful for modals and dialogs)
 * Implements WCAG 2.1 focus management requirements
 */
export function useFocusTrap({
  enabled = true,
  restoreFocus = true,
  initialFocus = null
}: UseFocusTrapOptions = {}) {
  const containerRef = useRef<HTMLElement>(null)
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    // Store the currently focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      if (!containerRef.current) return []
      
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable]'
      ].join(', ')

      return Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter(el => {
        // Filter out hidden elements
        return el.offsetParent !== null && 
               !el.hasAttribute('disabled') &&
               el.getAttribute('aria-hidden') !== 'true'
      })
    }

    // Focus the initial element or first focusable element
    const focusableElements = getFocusableElements()
    if (initialFocus) {
      initialFocus.focus()
    } else if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    // Handle Tab and Shift+Tab
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement as HTMLElement

      if (event.shiftKey) {
        // Shift + Tab
        if (activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      
      // Restore focus to the previously focused element
      if (restoreFocus && previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus()
      }
    }
  }, [enabled, restoreFocus, initialFocus])

  return containerRef
}

