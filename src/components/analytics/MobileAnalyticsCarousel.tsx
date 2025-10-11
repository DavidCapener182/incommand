'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useSwipeGestures } from '@/hooks/useSwipeGestures'
import { triggerHaptic } from '@/utils/hapticFeedback'
import MobileOptimizedChart from '../MobileOptimizedChart'
import { 
  MetricWidget, 
  TrendWidget, 
  ComparisonWidget,
  ProgressWidget 
} from './AnalyticsWidgetLibrary'

interface AnalyticsCard {
  id: string
  title: string
  type: 'chart' | 'metric' | 'trend' | 'comparison' | 'progress'
  data: any
}

interface MobileAnalyticsCarouselProps {
  cards: AnalyticsCard[]
  autoSwipe?: boolean
  autoSwipeInterval?: number
  className?: string
}

export default function MobileAnalyticsCarousel({
  cards,
  autoSwipe = false,
  autoSwipeInterval = 5000,
  className = ''
}: MobileAnalyticsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setDirection(1)
      setCurrentIndex(prev => prev + 1)
      triggerHaptic.light()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setDirection(-1)
      setCurrentIndex(prev => prev - 1)
      triggerHaptic.light()
    }
  }

  const handleDotClick = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
    triggerHaptic.selection()
  }

  // Swipe gestures
  const swipeGestures = useSwipeGestures({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrevious,
    minSwipeDistance: 50
  })

  // Auto-swipe
  React.useEffect(() => {
    if (!autoSwipe) return

    const interval = setInterval(() => {
      if (currentIndex < cards.length - 1) {
        handleNext()
      } else {
        setDirection(-1)
        setCurrentIndex(0)
      }
    }, autoSwipeInterval)

    return () => clearInterval(interval)
  }, [autoSwipe, autoSwipeInterval, currentIndex, cards.length])

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  }

  const renderCard = (card: AnalyticsCard) => {
    switch (card.type) {
      case 'chart':
        return (
          <MobileOptimizedChart
            data={card.data.chartData || []}
            title={card.title}
            type={card.data.chartType || 'line'}
            height={250}
          />
        )

      case 'metric':
        return (
          <MetricWidget
            title={card.title}
            value={card.data.value}
            subtitle={card.data.subtitle}
          />
        )

      case 'trend':
        return (
          <TrendWidget
            title={card.title}
            value={card.data.value}
            change={card.data.change}
            changeLabel={card.data.changeLabel}
            reverseColors={card.data.reverseColors}
          />
        )

      case 'comparison':
        return (
          <ComparisonWidget
            title={card.title}
            current={card.data.current}
            previous={card.data.previous}
            currentLabel={card.data.currentLabel}
            previousLabel={card.data.previousLabel}
            unit={card.data.unit}
          />
        )

      case 'progress':
        return (
          <ProgressWidget
            title={card.title}
            current={card.data.current}
            target={card.data.target}
            unit={card.data.unit}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Card Container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ minHeight: '300px' }}
        {...swipeGestures}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="w-full"
          >
            {renderCard(cards[currentIndex])}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons - Desktop Only */}
      <div className="hidden md:block">
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10"
            aria-label="Previous"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        )}

        {currentIndex < cards.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10"
            aria-label="Next"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        )}
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {cards.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? 'w-8 h-2 bg-blue-600 dark:bg-blue-400'
                : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Card Counter */}
      <div className="text-center mt-2 text-sm text-gray-500 dark:text-gray-400">
        {currentIndex + 1} / {cards.length}
      </div>

      {/* Swipe Hint - Mobile Only */}
      {currentIndex === 0 && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 3, duration: 1 }}
          className="md:hidden absolute bottom-20 left-1/2 -translate-x-1/2 bg-gray-900/80 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap pointer-events-none"
        >
          ← Swipe to navigate →
        </motion.div>
      )}
    </div>
  )
}

// Helper to create sample analytics cards
export function createAnalyticsCards(): AnalyticsCard[] {
  return [
    {
      id: 'incidents-trend',
      title: 'Incident Trend',
      type: 'chart',
      data: {
        chartType: 'area',
        chartData: Array.from({ length: 24 }, (_, i) => ({
          x: i,
          y: Math.floor(Math.random() * 15) + 5,
          label: `${i}:00`
        }))
      }
    },
    {
      id: 'response-time',
      title: 'Avg Response Time',
      type: 'trend',
      data: {
        value: '3.2 min',
        change: -12.5,
        changeLabel: 'vs last event',
        reverseColors: true
      }
    },
    {
      id: 'staff-comparison',
      title: 'Staff Deployment',
      type: 'comparison',
      data: {
        current: 45,
        previous: 38,
        currentLabel: 'Today',
        previousLabel: 'Last Event',
        unit: ' staff'
      }
    },
    {
      id: 'incident-resolution',
      title: 'Resolution Rate',
      type: 'progress',
      data: {
        current: 127,
        target: 150,
        unit: ' incidents'
      }
    },
    {
      id: 'response-chart',
      title: 'Response Times',
      type: 'chart',
      data: {
        chartType: 'line',
        chartData: Array.from({ length: 12 }, (_, i) => ({
          x: i * 2,
          y: Math.floor(Math.random() * 10) + 2,
          label: `${i * 2}:00`
        }))
      }
    }
  ]
}
