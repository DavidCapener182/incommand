'use client'

import { useCallback, useRef, useState } from 'react'

interface SwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  minSwipeDistance?: number
  maxSwipeTime?: number
  enableHapticFeedback?: boolean
}

interface SwipeState {
  startX: number
  startY: number
  startTime: number
  isSwipeInProgress: boolean
}

export function useSwipeGestures(options: SwipeGestureOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance = 50,
    maxSwipeTime = 500,
    enableHapticFeedback = true
  } = options

  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isSwipeInProgress: false
  })

  const triggerHapticFeedback = useCallback(() => {
    if (enableHapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10) // Short vibration
    }
  }, [enableHapticFeedback])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    setSwipeState({
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isSwipeInProgress: true
    })
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeState.isSwipeInProgress) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - swipeState.startX
    const deltaY = touch.clientY - swipeState.startY
    const deltaTime = Date.now() - swipeState.startTime

    // Check if swipe is within time limit and minimum distance
    if (deltaTime > maxSwipeTime) {
      setSwipeState(prev => ({ ...prev, isSwipeInProgress: false }))
      return
    }

    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    // Determine if it's a horizontal or vertical swipe
    if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
      // Horizontal swipe
      if (deltaX > 0 && onSwipeRight) {
        triggerHapticFeedback()
        onSwipeRight()
      } else if (deltaX < 0 && onSwipeLeft) {
        triggerHapticFeedback()
        onSwipeLeft()
      }
    } else if (absDeltaY > absDeltaX && absDeltaY > minSwipeDistance) {
      // Vertical swipe
      if (deltaY > 0 && onSwipeDown) {
        triggerHapticFeedback()
        onSwipeDown()
      } else if (deltaY < 0 && onSwipeUp) {
        triggerHapticFeedback()
        onSwipeUp()
      }
    }

    setSwipeState(prev => ({ ...prev, isSwipeInProgress: false }))
  }, [swipeState, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, minSwipeDistance, maxSwipeTime, triggerHapticFeedback])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Prevent default scrolling during swipe gestures
    if (swipeState.isSwipeInProgress) {
      e.preventDefault()
    }
  }, [swipeState.isSwipeInProgress])

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchMove: handleTouchMove,
    isSwipeInProgress: swipeState.isSwipeInProgress
  }
}

// Specific swipe gesture hooks for common patterns
export function useSwipeNavigation(
  onNext: () => void,
  onPrevious: () => void,
  options?: Partial<SwipeGestureOptions>
) {
  return useSwipeGestures({
    onSwipeLeft: onNext,
    onSwipeRight: onPrevious,
    ...options
  })
}

export function useSwipeModal(
  onClose: () => void,
  onNext?: () => void,
  onPrevious?: () => void,
  options?: Partial<SwipeGestureOptions>
) {
  return useSwipeGestures({
    onSwipeDown: onClose,
    onSwipeLeft: onNext,
    onSwipeRight: onPrevious,
    ...options
  })
}

export function useSwipeBottomNav(
  onToggle: () => void,
  options?: Partial<SwipeGestureOptions>
) {
  return useSwipeGestures({
    onSwipeUp: onToggle,
    minSwipeDistance: 30, // Smaller distance for nav toggle
    ...options
  })
}
