'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { useEventContext, useEventStrategy } from '@/contexts/EventContext'

// Import all dashboard cards
import WeatherCard from '@/components/WeatherCard'
import What3WordsSearchCard from '@/components/What3WordsSearchCard'
import VenueOccupancy from '@/components/VenueOccupancy'
import IncidentTable from '@/components/IncidentTable'

// Import new event-specific cards
import StadiumSecurityCard from '@/components/dashboard/cards/StadiumSecurityCard'
import StandCapacityCard from '@/components/dashboard/cards/StandCapacityCard'
import MatchScoreCard from '@/components/dashboard/cards/MatchScoreCard'
import MedicalResponseCard from '@/components/dashboard/cards/MedicalResponseCard'
import TurnstileStatusCard from '@/components/dashboard/cards/TurnstileStatusCard'
import MultiStageOverviewCard from '@/components/dashboard/cards/MultiStageOverviewCard'
import CrowdFlowCard from '@/components/dashboard/cards/CrowdFlowCard'
import WelfareCard from '@/components/dashboard/cards/WelfareCard'
import ScheduleAdherenceCard from '@/components/dashboard/cards/ScheduleAdherenceCard'
import IncidentSummaryCard from '@/components/dashboard/cards/IncidentSummaryCard'
import RouteStatusCard from '@/components/dashboard/cards/RouteStatusCard'
import PublicSafetyCard from '@/components/dashboard/cards/PublicSafetyCard'
import VehicleTrackerCard from '@/components/dashboard/cards/VehicleTrackerCard'
import DispersalMonitorCard from '@/components/dashboard/cards/DispersalMonitorCard'
import RunnerProgressCard from '@/components/dashboard/cards/RunnerProgressCard'
import AidStationStatusCard from '@/components/dashboard/cards/AidStationStatusCard'
import CourseWeatherCard from '@/components/dashboard/cards/CourseWeatherCard'
import MedicalZoneMapCard from '@/components/dashboard/cards/MedicalZoneMapCard'
import FlightScheduleCard from '@/components/dashboard/cards/FlightScheduleCard'
import AirfieldCapacityCard from '@/components/dashboard/cards/AirfieldCapacityCard'
import CrowdSafetyCard from '@/components/dashboard/cards/CrowdSafetyCard'
import WeatherAviationCard from '@/components/dashboard/cards/WeatherAviationCard'
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
  'StandCapacityCard': StandCapacityCard,
  'MatchScoreCard': MatchScoreCard,
  'MedicalResponseCard': MedicalResponseCard,
  'TurnstileStatusCard': TurnstileStatusCard,

  // Festival cards
  'MultiStageOverviewCard': MultiStageOverviewCard,
  'CrowdFlowCard': CrowdFlowCard,
  'WelfareCard': WelfareCard,
  'ScheduleAdherenceCard': ScheduleAdherenceCard,
  'IncidentSummaryCard': IncidentSummaryCard,

  // Parade cards
  'RouteStatusCard': RouteStatusCard,
  'PublicSafetyCard': PublicSafetyCard,
  'VehicleTrackerCard': VehicleTrackerCard,
  'DispersalMonitorCard': DispersalMonitorCard,

  // Marathon cards
  'RunnerProgressCard': RunnerProgressCard,
  'AidStationStatusCard': AidStationStatusCard,
  'CourseWeatherCard': CourseWeatherCard,
  'MedicalZoneMapCard': MedicalZoneMapCard,

  // Airshow cards
  'FlightScheduleCard': FlightScheduleCard,
  'AirfieldCapacityCard': AirfieldCapacityCard,
  'CrowdSafetyCard': CrowdSafetyCard,
  'WeatherAviationCard': WeatherAviationCard,
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

  // Get cards that should be rendered for this event type
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
                  <Component currentEventId={currentEventId} />
                </CardContent>
              </Card>
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
            <Component />
          </motion.div>
        )
      })}
    </div>
  )
}
