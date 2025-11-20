'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { useEventContext, useEventStrategy } from '@/contexts/EventContext'
import { FilterState } from '@/utils/incidentFilters'
import { getCardsForType } from '@/lib/events/eventCards'

// Import all dashboard cards
import WeatherCard from '@/components/WeatherCard'
import What3WordsSearchCard from '@/components/What3WordsSearchCard'
import VenueOccupancy from '@/components/VenueOccupancy'
import IncidentTable from '@/components/IncidentTable'

// Import new event-specific cards
import StadiumSecurityCard from '@/components/dashboard/cards/StadiumSecurityCard'
import CapacityCard from '@/components/dashboard/cards/CapacityCard'
import MedicalResponseCard from '@/components/dashboard/cards/MedicalResponseCard'
import MultiStageCard from '@/components/dashboard/cards/MultiStageCard'
import CrowdFlowCard from '@/components/dashboard/cards/CrowdFlowCard'
import RouteStatusCard from '@/components/dashboard/cards/RouteStatusCard'
import PublicSafetyCard from '@/components/dashboard/cards/PublicSafetyCard'
import PerformanceChart from '@/components/dashboard/cards/PerformanceChart'
import CrowdDensityCard from '@/components/dashboard/cards/CrowdDensityCard'

// Card registry mapping card names to components
const cardComponents = {
  // Concert cards
  'IncidentDashboardCard': IncidentTable,
  'WeatherCard': WeatherCard,
  'PerformanceChart': PerformanceChart,
  'CrowdDensityCard': CrowdDensityCard,
  'VenueOccupancy': VenueOccupancy,
  'What3WordsSearchCard': What3WordsSearchCard,
  
  // Football cards
  'StadiumSecurityCard': StadiumSecurityCard,
  'CapacityCard': CapacityCard,
  'MedicalResponseCard': MedicalResponseCard,
  
  // Festival cards
  'MultiStageCard': MultiStageCard,
  'CrowdFlowCard': CrowdFlowCard,
  
  // Parade cards
  'RouteStatusCard': RouteStatusCard,
  'PublicSafetyCard': PublicSafetyCard,
}

interface DynamicDashboardCardsProps {
  currentEventId: string | null
  currentEvent: any
  coordinates: { lat: number; lon: number }
  className?: string
}

export default function DynamicDashboardCards({ 
  currentEventId, 
  currentEvent, 
  coordinates,
  className 
}: DynamicDashboardCardsProps) {
  const { eventType } = useEventContext()
  const strategy = useEventStrategy()
  
  // DEBUG: Log event type detection
  console.log('🎯 DynamicDashboardCards render:', {
    eventType,
    currentEventType: currentEvent?.event_type,
    strategyName: strategy.name,
    dashboardCards: strategy.dashboardCards,
    currentEventId,
    currentEventName: currentEvent?.event_name
  })
  
  // Default filters for components that require them
  const defaultFilters: FilterState = {
    types: [],
    statuses: [],
    priorities: [],
    query: ''
  }

  // Use the new event card mapping utility to get the correct cards
  const CardsComponent = getCardsForType(currentEvent?.event_type || eventType)
  
  // If we have a specific card component for this event type, use it
  if (CardsComponent) {
    return (
      <div className={`hidden md:grid grid-cols-2 gap-4 lg:grid-cols-4 pt-2 ${className}`}>
        <CardsComponent 
          currentEventId={currentEventId}
          currentEvent={currentEvent}
          coordinates={coordinates}
          filters={defaultFilters}
        />
      </div>
    )
  }

  // Fallback to the original strategy-based approach
  const cardsToRender = strategy.dashboardCards

  // Filter cards based on their supportedEventTypes
  const renderableCards = cardsToRender.filter(cardName => {
    const Component = cardComponents[cardName as keyof typeof cardComponents]
    if (!Component) return false
    
    // Check if component has supportedEventTypes export
    const supportedTypes = (Component as any).supportedEventTypes
    if (!supportedTypes) return true // If no supportedEventTypes, assume it supports all
    
    return supportedTypes.includes(eventType)
  })

  return (
    <div className={`hidden md:grid grid-cols-2 gap-4 lg:grid-cols-4 pt-2 ${className}`}>
      {renderableCards.map((cardName, index) => {
        const Component = cardComponents[cardName as keyof typeof cardComponents]
        if (!Component) return null

        // Special handling for cards that need specific props
        if (cardName === 'WeatherCard' && currentEvent?.venue_address) {
          return (
            <motion.div
              key={cardName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Component
                lat={coordinates?.lat}
                lon={coordinates?.lon}
                locationName={currentEvent.venue_address}
                eventDate={currentEvent.event_date ?? ''}
                startTime={currentEvent.main_act_start_time ?? ''}
                curfewTime={currentEvent.curfew_time ?? ''}
                filters={defaultFilters}
                currentEventId={currentEventId || ''}
                venueAddress={currentEvent.venue_address || ''}
                singleCard={false}
                largeLogo={false}
              />
            </motion.div>
          )
        }

        if (cardName === 'What3WordsSearchCard') {
          return (
            <motion.div
              key={cardName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="col-span-1 h-[130px] cursor-pointer transition-all duration-300 hover:shadow-lg"
            >
              <Card className="card-depth h-full shadow-sm dark:shadow-md hover:shadow-md transition-all duration-150">
                <CardContent className="flex h-full flex-col items-center justify-center p-4">
                  <Component
                    lat={coordinates.lat}
                    lon={coordinates.lon}
                    venueAddress={currentEvent?.venue_address || ''}
                    singleCard
                    largeLogo={false}
                    filters={defaultFilters}
                    locationName={currentEvent?.venue_address || ''}
                    eventDate={currentEvent?.event_date || ''}
                    startTime={currentEvent?.main_act_start_time || ''}
                    curfewTime={currentEvent?.curfew_time || ''}
                    currentEventId={currentEventId || ''}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )
        }

        if (cardName === 'VenueOccupancy') {
          return (
            <motion.div
              key={cardName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="col-span-1 h-[130px] cursor-pointer transition-all duration-300 hover:shadow-lg"
            >
              <Card className="card-depth h-full shadow-sm dark:shadow-md hover:shadow-md transition-all duration-150">
                <CardContent className="flex h-full flex-col items-center justify-center p-4">
                  <Component 
                    currentEventId={currentEventId || ''} 
                    filters={defaultFilters}
                    lat={coordinates?.lat || 0}
                    lon={coordinates?.lon || 0}
                    locationName={currentEvent?.venue_address || ''}
                    eventDate={currentEvent?.event_date || ''}
                    startTime={currentEvent?.main_act_start_time || ''}
                    curfewTime={currentEvent?.curfew_time || ''}
                    venueAddress={currentEvent?.venue_address || ''}
                    singleCard={false}
                    largeLogo={false}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )
        }

        // Special handling for PublicSafetyCard (only accepts className)
        if (cardName === 'PublicSafetyCard') {
          return (
            <motion.div
              key={cardName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="col-span-1 h-[130px] transition-all duration-300 hover:shadow-lg"
            >
              <Component />
            </motion.div>
          )
        }

        // Default rendering for other cards
        return (
          <motion.div
            key={cardName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="col-span-1 h-[130px] transition-all duration-300 hover:shadow-lg"
          >
            <Component 
              filters={defaultFilters}
              lat={coordinates?.lat || 0}
              lon={coordinates?.lon || 0}
              locationName={currentEvent?.venue_address || ''}
              eventDate={currentEvent?.event_date || ''}
              startTime={currentEvent?.main_act_start_time || ''}
              curfewTime={currentEvent?.curfew_time || ''}
              currentEventId={currentEventId || ''}
              venueAddress={currentEvent?.venue_address || ''}
              singleCard={false}
              largeLogo={false}
            />
          </motion.div>
        )
      })}
    </div>
  )
}
