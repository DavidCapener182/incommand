'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import EventCreationModal from './EventCreationModal'
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline'

// Shared card base styling for consistency
const cardBase = `
  bg-white/90 dark:bg-[#1e2a78]/90
  backdrop-blur-lg
  shadow-md hover:shadow-lg
  transition-all duration-300
  border border-gray-200/60 dark:border-[#2d437a]/50
  rounded-2xl
  p-5 sm:p-6
`

interface Event {
  id: string
  event_name: string
  venue_name: string
  event_type: string
  event_description?: string
  support_acts?: any[]
  event_brief?: string
}

interface CurrentEventProps {
  currentTime?: string;
  currentEvent: Event | null;
  loading: boolean;
  error: string | null;
  onEventCreated: () => void;
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
}: CurrentEventProps) {
  const [showModal, setShowModal] = useState(false)
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0)
  const [aiLoading, setAiLoading] = useState(true)
  const [aiError, setAiError] = useState<string | null>(null)
  const [autoAdvance, setAutoAdvance] = useState(true)

  // Function to extract a title from a paragraph
  const extractTitleFromParagraph = (paragraph: string): string => {
    // Remove markdown formatting and clean up text
    const cleanText = paragraph
      .replace(/\*\*\*/g, '') // Remove triple asterisks
      .replace(/\*\*/g, '') // Remove double asterisks
      .replace(/\*/g, '') // Remove single asterisks
      .replace(/###\s*/g, '') // Remove markdown headers with optional spaces
      .replace(/##\s*/g, '') // Remove markdown headers with optional spaces
      .replace(/#\s*/g, '') // Remove markdown headers with optional spaces
      .replace(/`([^`]+)`/g, '$1') // Remove backticks but keep content
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links but keep text
      .replace(/_{2,}/g, '') // Remove multiple underscores
      .replace(/_([^_]+)_/g, '$1') // Remove italic underscores but keep content
      .replace(/~~([^~]+)~~/g, '$1') // Remove strikethrough but keep content
      .replace(/^\s*>\s+/gm, '') // Remove blockquotes
      .replace(/^\s*[-•]\s+/gm, '') // Remove bullet points
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered lists
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    // Look for common patterns to extract meaningful titles
    const lowerText = cleanText.toLowerCase();
    
    if (lowerText.includes('incident') && (lowerText.includes('total') || lowerText.includes('open') || lowerText.includes('status'))) {
      return 'Current Incidents'
    } else if (lowerText.includes('attendance') || lowerText.includes('capacity') || lowerText.includes('occupancy')) {
      return 'Venue Status'
    } else if (lowerText.includes('security') || lowerText.includes('safety')) {
      return 'Security Update'
    } else if (lowerText.includes('recent') || lowerText.includes('activity') || lowerText.includes('hour')) {
      return 'Recent Activity'
    } else if (lowerText.includes('alert') || lowerText.includes('urgent') || lowerText.includes('priority')) {
      return 'Priority Alerts'
    } else if (lowerText.includes('recommendation') || lowerText.includes('suggest') || lowerText.includes('action')) {
      return 'Action Items'
    } else if (lowerText.includes('trend') || lowerText.includes('pattern') || lowerText.includes('analysis')) {
      return 'Insights'
    } else if (lowerText.includes('weather') || lowerText.includes('condition')) {
      return 'Weather Status'
    } else if (lowerText.includes('behavioral') || lowerText.includes('crowd') || lowerText.includes('monitor')) {
      return 'Crowd Analysis'
    } else if (lowerText.includes('location') || lowerText.includes('area') || lowerText.includes('hotspot')) {
      return 'Location Focus'
    } else {
      // Fallback: create a generic title based on content
      return 'Event Update'
    }
  }

  const fetchAiInsights = async () => {
    try {
      setAiLoading(true)
      setAiError(null)
      
      const response = await fetch('/api/notifications/ai-summary')
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
          .replace(/\*\*\*/g, '') // Remove triple asterisks
          .replace(/\*\*/g, '') // Remove double asterisks
          .replace(/\*/g, '') // Remove single asterisks
          .replace(/###\s*/g, '') // Remove markdown headers with optional spaces
          .replace(/##\s*/g, '') // Remove markdown headers with optional spaces
          .replace(/#\s*/g, '') // Remove markdown headers with optional spaces
          .replace(/^\s*[-•]\s+/gm, '') // Remove bullet points (- or •)
          .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered lists (1. 2. etc.)
          .replace(/^\d+\.\s+/gm, '') // Remove numbered lists without leading spaces
          .replace(/\b\d+\.\s+/g, '') // Remove numbered lists anywhere in text
          .replace(/`([^`]+)`/g, '$1') // Remove backticks but keep content
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links but keep text
          .replace(/_{2,}/g, '') // Remove multiple underscores
          .replace(/_([^_]+)_/g, '$1') // Remove italic underscores but keep content
          .replace(/~~([^~]+)~~/g, '$1') // Remove strikethrough but keep content
          .replace(/^\s*>\s+/gm, '') // Remove blockquotes
          .replace(/^\s*\|\s*/gm, '') // Remove table formatting
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
  }

  useEffect(() => {
    if (currentEvent) {
      fetchAiInsights()
      // Refresh every 5 minutes
      const interval = setInterval(fetchAiInsights, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [currentEvent])

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
      <div className="bg-white shadow sm:rounded-lg p-6">
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
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className={`${cardBase} h-full flex flex-col justify-between relative`}>
        {currentEvent ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-gray-400 dark:text-gray-300 mt-1" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Event</h2>
                  <div className="mt-1">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      {currentEvent.event_name}
                    </span>
                    {currentEvent.support_acts && (() => {
                      let acts = currentEvent.support_acts;
                      if (typeof acts === 'string') {
                        try {
                          acts = JSON.parse(acts);
                        } catch {
                          acts = [];
                        }
                      }
                      return Array.isArray(acts) && acts.length > 0 ? (
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-300 ml-2">
                          {' + ' + acts.slice().reverse().map((act: any) => act.act_name).join(', ')}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>
              <div className="md:hidden">
                {currentTime && (
                  <span className="text-base font-bold text-gray-900 dark:text-white">{currentTime}</span>
                )}
              </div>
            </div>
            
            <div className="hidden md:block">
              {/* Visual divider */}
              <hr className="my-4 border-gray-200/60 dark:border-[#2d437a]/50" />
              
              <div className="flex items-center gap-3">
                <MapPinIcon className="h-4 w-4 text-gray-400 dark:text-gray-300" />
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Venue</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white ml-2">{currentEvent.venue_name}</span>
                </div>
              </div>
              
              {/* AI Insights - modernized with better styling */}
              {aiInsights.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200/60 dark:border-[#2d437a]/50">
                  <div className="min-h-[100px] max-h-[100px] overflow-hidden">
                    {aiLoading ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-4/5"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                      </div>
                    ) : aiError ? (
                      <div className="pb-4">
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
                    ) : (
                      <div className="pb-4">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                          {aiInsights[currentInsightIndex]?.title}
                        </h4>
                        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pr-1">
                          {aiInsights[currentInsightIndex]?.content}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Navigation positioned at very bottom of entire card */}
              {!aiLoading && aiInsights.length > 0 && (
                <div className="absolute left-0 right-0 bottom-3 flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    {aiInsights.length > 1 && (
                      <button
                        onClick={goToPrevious}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Previous insight"
                      >
                        <ChevronLeftIcon className="h-4 w-4 text-gray-500" />
                      </button>
                    )}
                    <div className="flex space-x-1">
                      {aiInsights.map((_, index) => (
                        <div
                          key={index}
                          className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                            index === currentInsightIndex ? 'bg-[#2A3990]' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    {aiInsights.length > 1 && (
                      <button
                        onClick={goToNext}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Next insight"
                      >
                        <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Subtle gradient accent at bottom */}
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mt-4" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              No Current Event
            </h3>
            <p className="text-sm text-gray-500">
              No event is currently selected. Create a new event to get started.
            </p>
            <div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-[#2A3990] hover:bg-[#1e2a6a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A3990]"
              >
                Create Event
              </button>
            </div>
          </div>
        )}
      </div>

      <EventCreationModal
        isOpen={showModal && !currentEvent}
        onClose={handleCloseModal}
        onEventCreated={handleEventCreated}
      />
    </motion.div>
  )
}
