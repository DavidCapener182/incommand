'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import StaffSkillsMatrix from '@/components/staff/StaffSkillsMatrix'
import StaffAvailabilityToggle from '@/components/staff/StaffAvailabilityToggle'
import StaffPerformanceDashboard from '@/components/staff/StaffPerformanceDashboard'
import { PageBackground } from '@/components/ui/PageBackground'
import { SectionContainer, SectionHeader } from '@/components/ui/SectionContainer'
import { MetricCard } from '@/components/ui/MetricCard'
import { CardContainer } from '@/components/ui/CardContainer'

export default function StaffPage() {
  const router = useRouter()
  const [currentEvent, setCurrentEvent] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'skills' | 'availability' | 'performance'>('skills')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Get the current event
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)

      if (events && events.length > 0) {
        setCurrentEvent(events[0])
      }

      setLoading(false)
    }
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  const tabs = [
    {
      id: 'skills',
      name: 'Skills Matrix',
      icon: AcademicCapIcon,
      description: 'View and manage staff skills and certifications'
    },
    {
      id: 'availability',
      name: 'Availability',
      icon: ClockIcon,
      description: 'Track on-shift/off-shift status'
    },
    {
      id: 'performance',
      name: 'Performance',
      icon: ChartBarIcon,
      description: 'Monitor performance metrics and scoring'
    }
  ]

  return (
    <PageBackground>
      <div className="space-y-8">
        {/* Mobile Notice - Simplified Staff View */}
        <div className="block md:hidden">
          <CardContainer className="bg-green-50/90 dark:bg-green-900/25 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100/80 dark:bg-green-900/50">
                <UserGroupIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <h1 className="text-base font-semibold">Staff Management</h1>
                <p className="text-sm text-green-700 dark:text-green-200">
                  Simplified view on mobile. Full management available on desktop.
                </p>
              </div>
            </div>
          </CardContainer>
        </div>

        {/* Desktop Staff Management */}
        <div className="hidden md:block space-y-8">
          <SectionContainer className="space-y-6">
            <SectionHeader
              title="Staff Management"
              accent="blue"
              description="Manage staff skills, availability, and performance."
            />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">
                  Staff Management
                </h1>
                <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Coordinate team readiness and coverage across events.
                </p>
                {currentEvent && (
                  <p className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                    Current Event: {currentEvent.name}
                  </p>
                )}
              </div>
              {!currentEvent && (
                <CardContainer className="flex items-center gap-2 border border-yellow-300 bg-yellow-50/90 p-3 text-yellow-700 dark:border-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">No active event</span>
                </CardContainer>
              )}
            </div>
          </SectionContainer>

          <SectionContainer className="space-y-4">
            <SectionHeader
              title="Management Areas"
              accent="purple"
              description="Choose a focus area to update team information."
            />
            <CardContainer className="space-y-4 p-3 sm:p-4">
              <nav
                className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3"
                aria-label="Staff management navigation"
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`touch-target inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                          : 'border-transparent bg-transparent text-gray-600 hover:border-blue-200 hover:bg-blue-50/70 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          isActive ? 'text-white' : 'text-blue-500 dark:text-blue-300'
                        }`}
                      />
                      {tab.name}
                    </button>
                  )
                })}
              </nav>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tabs.find((tab) => tab.id === activeTab)?.description}
              </p>
            </CardContainer>
          </SectionContainer>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {activeTab === 'skills' && (
              <StaffSkillsMatrix eventId={currentEvent?.id} />
            )}

            {activeTab === 'availability' &&
              (currentEvent ? (
                <StaffAvailabilityToggle eventId={currentEvent.id} />
              ) : (
                <CardContainer className="text-center">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Active Event
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please create or activate an event to manage staff availability.
                  </p>
                </CardContainer>
              ))}

            {activeTab === 'performance' &&
              (currentEvent ? (
                <StaffPerformanceDashboard eventId={currentEvent.id} />
              ) : (
                <CardContainer className="text-center">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Active Event
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please create or activate an event to view performance metrics.
                  </p>
                </CardContainer>
              ))}
          </motion.div>

          <SectionContainer>
            <SectionHeader
              title="Team Snapshot"
              accent="emerald"
              description="High-level staffing indicators for the current event."
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <MetricCard>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                    <UserGroupIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Total Staff
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">-</p>
                  </div>
                </div>
              </MetricCard>

              <MetricCard>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300">
                    <AcademicCapIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Certified Skills
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">-</p>
                  </div>
                </div>
              </MetricCard>

              <MetricCard>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                    <ChartBarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Avg Performance
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">-</p>
                  </div>
                </div>
              </MetricCard>
            </div>
          </SectionContainer>
        </div>
      </div>
    </PageBackground>
  )
}
