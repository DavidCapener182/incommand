'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import StaffSkillsMatrix from '@/components/staff/StaffSkillsMatrix'
import StaffAvailabilityToggle from '@/components/staff/StaffAvailabilityToggle'
import StaffPerformanceDashboard from '@/components/staff/StaffPerformanceDashboard'

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Staff Management
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage staff skills, availability, and performance
              </p>
              {currentEvent && (
                <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                  Current Event: {currentEvent.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {!currentEvent && (
                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-100 px-3 py-2 rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">No active event</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon
                    className={`mr-2 h-5 w-5 ${
                      isActive
                        ? 'text-blue-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {tab.name}
                </button>
              )
            })}
          </nav>
          
          {/* Tab Description */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'skills' && (
            <StaffSkillsMatrix 
              eventId={currentEvent?.id}
              className="mb-8"
            />
          )}

          {activeTab === 'availability' && (
            currentEvent ? (
              <StaffAvailabilityToggle 
                eventId={currentEvent.id}
                className="mb-8"
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Active Event
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Please create or activate an event to manage staff availability.
                </p>
              </div>
            )
          )}

          {activeTab === 'performance' && (
            currentEvent ? (
              <StaffPerformanceDashboard 
                eventId={currentEvent.id}
                className="mb-8"
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Active Event
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Please create or activate an event to view performance metrics.
                </p>
              </div>
            )
          )}
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Staff
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  -
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Certified Skills
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  -
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Performance
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  -
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}