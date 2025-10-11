import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'

interface StaffAvailability {
  id: number
  profile_id: string
  event_id: string
  is_available: boolean
  availability_reason: string | null
  shift_start: string | null
  shift_end: string | null
  last_status_change: string
}

interface StaffMember {
  profile_id: string
  full_name: string
  callsign: string | null
  email: string
  availability?: StaffAvailability
}

interface StaffAvailabilityToggleProps {
  eventId: string
  className?: string
}

export default function StaffAvailabilityToggle({ 
  eventId,
  className = '' 
}: StaffAvailabilityToggleProps) {
  const { user } = useAuth()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchStaffAvailability = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/v1/events/${eventId}/staff-availability`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch staff availability')
      }
      
      const data = await response.json()
      setStaff(data.staff || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (eventId) {
      fetchStaffAvailability()
    }
  }, [eventId])

  const toggleAvailability = async (profileId: string, currentStatus: boolean) => {
    setUpdating(profileId)
    
    try {
      const response = await fetch(`/api/v1/staff/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profileId,
          event_id: eventId,
          is_available: !currentStatus,
          availability_reason: !currentStatus ? 'on-shift' : 'off-shift'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update availability')
      }
      
      // Refresh the staff list
      fetchStaffAvailability()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setUpdating(null)
    }
  }

  const getAvailabilityIcon = (isAvailable: boolean) => {
    return isAvailable ? (
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
    ) : (
      <XCircleIcon className="h-5 w-5 text-red-500" />
    )
  }

  const getAvailabilityColor = (isAvailable: boolean) => {
    return isAvailable 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200'
  }

  const getAvailabilityText = (isAvailable: boolean, reason?: string | null) => {
    if (isAvailable) {
      return reason === 'on-shift' ? 'On Shift' : 'Available'
    }
    return reason === 'off-shift' ? 'Off Shift' : 'Unavailable'
  }

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Availability Error
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchStaffAvailability}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const availableStaff = staff.filter(member => member.availability?.is_available)
  const unavailableStaff = staff.filter(member => !member.availability?.is_available)

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Staff Availability
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              On-shift/off-shift status for current event
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-green-600">{availableStaff.length}</span> available
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-red-600">{unavailableStaff.length}</span> unavailable
            </div>
          </div>
        </div>
      </div>

      {/* Staff List */}
      <div className="p-6">
        <div className="space-y-3">
          <AnimatePresence>
            {staff.map((member) => {
              const isAvailable = member.availability?.is_available ?? false
              const isLoading = updating === member.profile_id
              
              return (
                <motion.div
                  key={member.profile_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                    isAvailable 
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {member.full_name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {member.full_name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {member.callsign || member.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getAvailabilityColor(isAvailable)}`}>
                      {getAvailabilityIcon(isAvailable)}
                      {getAvailabilityText(isAvailable, member.availability?.availability_reason)}
                    </div>

                    <button
                      onClick={() => toggleAvailability(member.profile_id, isAvailable)}
                      disabled={isLoading}
                      className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        isAvailable
                          ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400'
                          : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400'
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Updating...
                        </div>
                      ) : (
                        isAvailable ? 'Set Off-Shift' : 'Set On-Shift'
                      )}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {staff.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No staff members found for this event</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {availableStaff.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Available Staff
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {unavailableStaff.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Unavailable Staff
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
