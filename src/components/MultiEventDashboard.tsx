'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { FeatureGate } from '@/components/FeatureGate'
import { useUserPlan } from '@/hooks/useUserPlan'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/Toast'

interface Event {
  id: string
  name: string
  type: string
  venue: string
  startDate: string
  endDate: string
  status: 'upcoming' | 'active' | 'completed'
  attendance: number
  incidents: {
    total: number
    open: number
    high_priority: number
  }
  staff: {
    assigned: number
    on_duty: number
  }
}

interface MultiEventDashboardProps {
  organizationId?: string
  className?: string
}

export default function MultiEventDashboard({
  organizationId,
  className = ''
}: MultiEventDashboardProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'incidents' | 'name'>('date')
  const userPlan = useUserPlan() || 'starter'

  const loadEvents = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      // Get company_id from user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!profile?.company_id) {
        setLoading(false)
        return
      }

      // Fetch events for the company
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, event_name, event_type, venue_name, start_datetime, end_datetime, expected_attendance, is_current')
        .eq('company_id', profile.company_id)
        .order('start_datetime', { ascending: false })

      if (eventsError) throw eventsError

      // Fetch incidents and staff for each event
      const eventsWithMetrics = await Promise.all(
        (eventsData || []).map(async (event) => {
          // Get incidents for this event
          const { data: incidents, error: incidentsError } = await supabase
            .from('incident_logs')
            .select('id, status, priority')
            .eq('event_id', event.id)

          if (incidentsError) console.error('Error fetching incidents:', incidentsError)

          // Get staff for this event
          const { data: staff, error: staffError } = await supabase
            .from('staff')
            .select('id, active, availability_status')
            .eq('event_id', event.id)

          if (staffError) console.error('Error fetching staff:', staffError)

          // Determine status based on dates
          const now = new Date()
          const startDate = event.start_datetime ? new Date(event.start_datetime) : null
          const endDate = event.end_datetime ? new Date(event.end_datetime) : null

          let status: 'upcoming' | 'active' | 'completed' = 'upcoming'
          if (startDate && endDate) {
            if (now >= startDate && now <= endDate) {
              status = 'active'
            } else if (now > endDate) {
              status = 'completed'
            }
          } else if (event.is_current) {
            status = 'active'
          }

          const incidentList = incidents || []
          const staffList = staff || []

          return {
            id: event.id,
            name: event.event_name || 'Unnamed Event',
            type: event.event_type || 'Other',
            venue: event.venue_name || 'TBD',
            startDate: event.start_datetime || new Date().toISOString(),
            endDate: event.end_datetime || new Date().toISOString(),
            status,
            attendance: event.expected_attendance || 0,
            incidents: {
              total: incidentList.length,
              open: incidentList.filter((i: any) => i.status !== 'closed' && i.status !== 'resolved').length,
              high_priority: incidentList.filter((i: any) => i.priority === 'high' || i.priority === 'urgent').length,
            },
            staff: {
              assigned: staffList.length,
              on_duty: staffList.filter((s: any) => s.active && s.availability_status === 'available').length,
            },
          }
        })
      )

      setEvents(eventsWithMetrics)
    } catch (error) {
      console.error('Error loading events:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load events',
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, showToast])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const filteredEvents = events
    .filter(event => filter === 'all' || event.status === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        case 'incidents':
          return b.incidents.total - a.incidents.total
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  const getStatusConfig = (status: Event['status']) => {
    switch (status) {
      case 'active':
        return {
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          label: 'Active',
          icon: CheckCircleIcon
        }
      case 'upcoming':
        return {
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          label: 'Upcoming',
          icon: ClockIcon
        }
      case 'completed':
        return {
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-700',
          label: 'Completed',
          icon: CheckCircleIcon
        }
    }
  }

  return (
    <FeatureGate 
      feature="multi-event-management" 
      plan={userPlan} 
      showUpgradeCard={true}
      upgradeCardVariant="banner"
      upgradeCardDescription="Manage multiple concurrent events, switch between them seamlessly, and get a unified view of all your operations."
    >
      <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Multi-Event Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage multiple events simultaneously
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          <PlusIcon className="h-5 w-5" />
          <span>New Event</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {(['all', 'active', 'upcoming'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({events.filter(e => f === 'all' || e.status === f).length})
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="date">Sort by Date</option>
          <option value="incidents">Sort by Incidents</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Event Cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="card-depth p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEvents.map((event, index) => {
          const statusConfig = getStatusConfig(event.status)
          const StatusIcon = statusConfig.icon

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-depth p-6 hover:shadow-xl transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {event.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{event.venue}</span>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.bgColor}`}>
                  <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                  <span className={`text-sm font-medium ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Attendance</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {event.attendance.toLocaleString()}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Staff On Duty</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {event.staff.on_duty}/{event.staff.assigned}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Incidents</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {event.incidents.total}
                  </div>
                </div>
              </div>

              {/* Incident Status */}
              {event.status === 'active' && (
                <div className="flex items-center gap-4 py-3 px-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.incidents.open} Open
                    </span>
                  </div>
                  {event.incidents.high_priority > 0 && (
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        {event.incidents.high_priority} High Priority
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => window.location.href = `/incidents?eventId=${event.id}`}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  View Dashboard
                </button>
                <button 
                  onClick={() => window.location.href = `/analytics?eventId=${event.id}`}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                >
                  <ChartBarIcon className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )
        })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredEvents.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No events found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first event to get started
          </p>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            Create Event
          </button>
        </div>
      )}
    </div>
    </FeatureGate>
  )
}
