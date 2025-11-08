'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import EventCreationModal from './EventCreationModal'
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { useEventContext } from '@/contexts/EventContext'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Event {
  id: string
  event_name: string
  venue_name: string
  event_type: string
  event_description?: string
  support_acts?: any[]
  event_brief?: string
  event_date?: string
}

interface EventTiming {
  title: string
  time: string
  isNext?: boolean
  isActuallyHappeningNow?: boolean
}

interface CurrentEventProps {
  currentTime?: string;
  currentEvent: Event | null;
  loading: boolean;
  error: string | null;
  onEventCreated: () => void;
  eventTimings: EventTiming[];
}

interface AIInsight {
  title: string;
  content: string;
}

export default function CurrentEvent({ 
  currentTime,
  currentEvent,
  loading,
  error,
  onEventCreated,
  eventTimings,
}: CurrentEventProps) {
  const [showModal, setShowModal] = useState(false)
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0)
  const [aiLoading, setAiLoading] = useState(true)
  const [aiError, setAiError] = useState<string | null>(null)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const { eventType } = useEventContext()

  // Function to check if current time is between first and last event timing
  const isEventLive = () => {
    if (!eventTimings || eventTimings.length === 0) return false
    
    const now = new Date()
    const today = now.toDateString()
    
    // Get first and last timing
    const sortedTimings = [...eventTimings].sort((a, b) => {
      const timeA = new Date(`${today} ${a.time}`).getTime()
      const timeB = new Date(`${today} ${b.time}`).getTime()
      return timeA - timeB
    })
    
    if (sortedTimings.length === 0) return false
    
    const firstTiming = sortedTimings[0]
    const lastTiming = sortedTimings[sortedTimings.length - 1]
    
    const startTime = new Date(`${today} ${firstTiming.time}`)
    const endTime = new Date(`${today} ${lastTiming.time}`)
    
    return now >= startTime && now <= endTime
  }

  // Function to extract a title from a paragraph
  const extractTitleFromParagraph = (paragraph: string): string => {
    // First, try to extract the actual markdown header if it exists
    const headerMatch = paragraph.match(/^#{1,6}\s*(.+)$/m);
    if (headerMatch) {
      return headerMatch[1].trim();
    }

    // Look for common patterns to extract meaningful titles
    const lowerText = paragraph.toLowerCase();
    
    if (lowerText.includes('current event status') || (lowerText.includes('incident') && (lowerText.includes('total') || lowerText.includes('open') || lowerText.includes('status')))) {
      return 'Current Event Status'
    } else if (lowerText.includes('attendance') || lowerText.includes('capacity') || lowerText.includes('occupancy')) {
      return 'Attendance & Capacity Analysis'
    } else if (lowerText.includes('security') || lowerText.includes('safety') || lowerText.includes('operational concerns')) {
      return 'Security & Operational Concerns'
    } else if (lowerText.includes('urgent') || lowerText.includes('priority') || lowerText.includes('critical')) {
      return 'Urgent Patterns or Concerns'
    } else if (lowerText.includes('trend') || lowerText.includes('pattern') || lowerText.includes('location') || lowerText.includes('hotspot')) {
      return 'Trending Locations or Incident Types'
    } else if (lowerText.includes('recommendation') || lowerText.includes('suggest') || lowerText.includes('action')) {
      return 'Actionable Recommendations'
    } else if (lowerText.includes('recent') || lowerText.includes('activity') || lowerText.includes('hour')) {
      return 'Recent Activity'
    } else if (lowerText.includes('weather') || lowerText.includes('condition')) {
      return 'Weather Status'
    } else if (lowerText.includes('behavioral') || lowerText.includes('crowd') || lowerText.includes('monitor')) {
      return 'Crowd Analysis'
    } else {
      // Fallback: create a meaningful title based on content
      return 'Event Analysis'
    }
  }

  const currentEventId = currentEvent?.id

  const fetchAiInsights = useCallback(async () => {
    try {
      setAiLoading(true)
      setAiError(null)
      
      if (!currentEventId) {
        throw new Error('No current event selected')
      }

      const response = await fetch(`/api/notifications/ai-summary?eventId=${currentEventId}`)
      if (!response.ok) throw new Error('Failed to fetch AI insights')
      
      const data = await response.json()
      const summary = data.summary || ''
      
      // Split into paragraphs and filter out empty ones
      const paragraphs = summary
        .split('\n\n')
        .filter((para: string) => para.trim().length > 0)
        .map((para: string) => para.trim())

      // Create insights with extracted titles and cleaned content
      const insights: AIInsight[] = paragraphs.map((paragraph: string) => ({
        title: extractTitleFromParagraph(paragraph),
        content: paragraph
          .replace(/###\s*/g, '') // Remove markdown headers with optional spaces
          .replace(/##\s*/g, '') // Remove markdown headers with optional spaces
          .replace(/#\s*/g, '') // Remove markdown headers with optional spaces
          .replace(/\*\*\*/g, '') // Remove triple asterisks
          .replace(/\*\*/g, '') // Remove double asterisks
          .replace(/\*/g, '') // Remove single asterisks
          .replace(/`([^`]+)`/g, '$1') // Remove backticks but keep content
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links but keep text
          .replace(/_{2,}/g, '') // Remove multiple underscores
          .replace(/_([^_]+)_/g, '$1') // Remove italic underscores but keep content
          .replace(/~~([^~]+)~~/g, '$1') // Remove strikethrough but keep content
          .replace(/^\s*>\s+/gm, '') // Remove blockquotes
          .replace(/^\s*\|\s*/gm, '') // Remove table formatting
          .replace(/^\s*[-•]\s+/gm, '• ') // Convert bullet points to clean bullets
          .replace(/^\s*\d+\.\s+/gm, '• ') // Convert numbered lists to bullets
          .replace(/\b\d+\.\s+/g, '• ') // Convert inline numbered lists to bullets
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
      }));

      setAiInsights(insights)
    } catch (error) {
      console.error('Error fetching AI insights:', error)
      setAiError('Failed to load insights')
    } finally {
      setAiLoading(false)
    }
  }, [currentEventId])

  useEffect(() => {
    if (currentEventId) {
      fetchAiInsights()
      // Refresh every 5 minutes
      const interval = setInterval(fetchAiInsights, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [currentEventId, fetchAiInsights])

  // Auto-advance logic - increased to 45 seconds
  useEffect(() => {
    if (aiInsights.length > 1 && autoAdvance) {
      const interval = setInterval(() => {
        setCurrentInsightIndex((prevIndex) => 
          (prevIndex + 1) % aiInsights.length
        )
      }, 45000) // 45 seconds
      
      return () => clearInterval(interval)
    }
  }, [aiInsights.length, autoAdvance])

  const goToPrevious = () => {
    setAutoAdvance(false)
    setCurrentInsightIndex((prevIndex) => 
      prevIndex === 0 ? aiInsights.length - 1 : prevIndex - 1
    )
    // Resume auto-advance after 2 minutes
    setTimeout(() => setAutoAdvance(true), 120000)
  }

  const goToNext = () => {
    setAutoAdvance(false)
    setCurrentInsightIndex((prevIndex) => 
      (prevIndex + 1) % aiInsights.length
    )
    // Resume auto-advance after 2 minutes
    setTimeout(() => setAutoAdvance(true), 120000)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const handleEventCreated = () => {
    onEventCreated();
    setShowModal(false)
  }

  if (loading) {
    return (
      <div className="card-depth p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="flex-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="h-full flex flex-col justify-between relative bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 sm:p-8">
        {currentEvent ? (
          <div className="flex flex-col space-y-8">
            {/* Event Info Section */}
            <div>
              {/* Venue row */}
              <div className="flex items-center space-x-3 mb-4">
                <MapPinIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {currentEvent.venue_name}
                  {isEventLive() && (
                    <span className="ml-2 relative flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-xs font-medium">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                      </span>
                      LIVE
                    </span>
                  )}
                </h2>
              </div>
              
              {/* Event row */}
              <div className="flex items-start space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {eventType === 'football' 
                      ? currentEvent.event_name.replace(/\s*-\s*\d{2}\/\d{2}\/\d{4}$/, '') // Remove " - DD/MM/YYYY" from end
                      : currentEvent.event_name
                    }
                  </h3>
                  {currentEvent.support_acts && (() => {
                    let acts = currentEvent.support_acts
                    if (typeof acts === 'string') {
                      try {
                        acts = JSON.parse(acts)
                      } catch {
                        acts = []
                      }
                    }
                    return Array.isArray(acts) && acts.length > 0 ? (
                      <p className="text-gray-600 dark:text-gray-300">
                        {'+ ' + acts.slice().reverse().map((act: any) => act.act_name).join(', ')}
                      </p>
                    ) : null
                  })()}
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Event Summary Section */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <svg className="h-5 w-5 text-[#4361EE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Event Summary</h3>
              </div>
              
              {/* AI Insights Content */}
              <div>
                {aiLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-4/5"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                  </div>
                ) : aiError ? (
                  <div>
                    <h4 className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">System Error</h4>
                    <div className="text-sm text-red-600 dark:text-red-300 leading-relaxed">
                      {aiError}
                      <button 
                        onClick={fetchAiInsights}
                        className="ml-2 text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : aiInsights.length > 0 ? (
                  <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {aiInsights[currentInsightIndex]?.content}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-300">No insights available yet.</p>
                )}
              </div>
            </div>

            {/* Navigation Dots */}
            {!aiLoading && aiInsights.length > 1 && (
              <div className="flex justify-center items-center mt-8 pt-4">
                <button
                  onClick={goToPrevious}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label="Previous insight"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div className="flex space-x-2 mx-4">
                  {aiInsights.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentInsightIndex(index);
                        setAutoAdvance(false);
                        setTimeout(() => setAutoAdvance(true), 120000);
                      }}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentInsightIndex
                          ? 'bg-[#4361EE]'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      aria-label={`Go to insight ${index + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={goToNext}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label="Next insight"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <CardContent>
            <div className="space-y-3">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                No Current Event
              </CardTitle>
              <CardDescription>
                No event is currently selected. Create a new event to get started.
              </CardDescription>
              <div>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-[#2A3990] hover:bg-[#1e2a6a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A3990]"
                >
                  Create Event
                </button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <EventCreationModal
        isOpen={showModal && !currentEvent}
        onClose={handleCloseModal}
        onEventCreated={handleEventCreated}
      />
    </motion.div>
  )
}
