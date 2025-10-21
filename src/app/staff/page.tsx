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
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/card'

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
    <PageWrapper className="px-4 py-4 sm:px-6 sm:py-6">
      {/* Mobile Notice - Simplified Staff View */}
      <div className="block md:hidden mb-8">
        <Card className="bg-green-50/90 dark:bg-green-900/25 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100 p-4">
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
        </Card>
      </div>

      {/* Desktop Staff Management */}
      <div className="hidden md:block">
        <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl shadow-lg shadow-black/5 border border-gray-200/70 dark:border-gray-700/50 space-y-8 backdrop-blur-md">
          {/* Header Section */}
          <div className="p-6 md:p-8 space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
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
                  <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-yellow-700 dark:border-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200">
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">No active event</span>
                  </div>
                )}
              </div>
            </div>

          {/* Navigation Section */}
          <section className="!bg-white dark:!bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 !p-4 sm:!p-5 lg:!p-5 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-1 rounded-full bg-gradient-to-b from-purple-500 to-indigo-500" />
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">Management Areas</h2>
              </div>
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
                      className={`touch-target inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all border-2 ${
                        isActive
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-transparent'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {tab.name}
                    </button>
                  )
                })}
              </nav>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tabs.find((tab) => tab.id === activeTab)?.description}
              </p>
            </section>

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
                <Card className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Active Event
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please create or activate an event to manage staff availability.
                  </p>
                </Card>
              ))}

            {activeTab === 'performance' &&
              (currentEvent ? (
                <StaffPerformanceDashboard eventId={currentEvent.id} />
              ) : (
                <Card className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Active Event
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please create or activate an event to view performance metrics.
                  </p>
                </Card>
              ))}
          </motion.div>

          {/* Team Snapshot Section */}
          <section className="!bg-white dark:!bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 !p-4 sm:!p-5 lg:!p-5 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-green-500" />
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">Team Snapshot</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {/* Total Staff Card */}
                <Card className="rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-150 p-4 sm:p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Staff</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">-</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Active members</p>
                    </div>
                    <UserGroupIcon className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
                  </div>
                </Card>

                {/* Certified Skills Card */}
                <Card className="rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-150 p-4 sm:p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Certified Skills</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">-</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Verified certifications</p>
                    </div>
                    <AcademicCapIcon className="h-7 w-7 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
                  </div>
                </Card>

                {/* Avg Performance Card */}
                <Card className="rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-150 p-4 sm:p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avg Performance</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">-</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Performance score</p>
                    </div>
                    <ChartBarIcon className="h-7 w-7 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
                  </div>
                </Card>
              </div>
            </section>
          </div>
        </div>
    </PageWrapper>
  )
}
