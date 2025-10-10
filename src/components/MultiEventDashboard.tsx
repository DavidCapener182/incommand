'use client'

import React, { useState, useEffect } from 'react'
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
  organizationId: string
  className?: string
}

export default function MultiEventDashboard({
  organizationId,
  className = ''
}: MultiEventDashboardProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'incidents' | 'name'>('date')

  useEffect(() => {
    loadEvents()
  }, [organizationId])

  const loadEvents = async () => {
    // Mock data - in production, fetch from API
    const mockEvents: Event[] = [
      {
        id: '1',
        name: 'Summer Music Festival 2024',
        type: 'Festival',
        venue: 'Central Park Arena',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        attendance: 15000,
        incidents: { total: 45, open: 8, high_priority: 2 },
        staff: { assigned: 50, on_duty: 45 }
      },
      {
        id: '2',
        name: 'Championship Finals',
        type: 'Sports',
        venue: 'Stadium North',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'upcoming',
        attendance: 25000,
        incidents: { total: 0, open: 0, high_priority: 0 },
        staff: { assigned: 75, on_duty: 0 }
      }
    ]
    setEvents(mockEvents)
  }

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
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow"
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
                <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  View Dashboard
                </button>
                <button className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors">
                  <ChartBarIcon className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
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
  )
}
