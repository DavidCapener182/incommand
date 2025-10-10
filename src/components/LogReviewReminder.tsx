/**
 * Log Review Reminder Component
 * Shows periodic reminders for Silver Commanders to review recent logs
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ClockIcon, 
  DocumentTextIcon, 
  XMarkIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from './Toast'

interface LogReviewReminderProps {
  isVisible?: boolean
  onDismiss?: () => void
  onReviewLogs?: () => void
}

interface RecentLogsData {
  totalLogs: number
  newLogs: number
  retrospectiveLogs: number
  amendedLogs: number
  timeRange: string
}

export default function LogReviewReminder({
  isVisible = true,
  onDismiss,
  onReviewLogs
}: LogReviewReminderProps) {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [recentLogsData, setRecentLogsData] = useState<RecentLogsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastReminderTime, setLastReminderTime] = useState<number>(0)

  // Check if user is a Silver Commander
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isSilverCommander, setIsSilverCommander] = useState(false)

  useEffect(() => {
    if (user) {
      // Get user role from profile
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            setUserRole(data.role)
            setIsSilverCommander(data.role === 'silver_commander' || data.role === 'admin')
          }
        })
    }
  }, [user])

  // Fetch recent logs data
  const fetchRecentLogs = async () => {
    if (!user || !isSilverCommander) return

    setIsLoading(true)
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      const now = new Date().toISOString()

      // Get current event
      const { data: currentEvent } = await supabase
        .from('events')
        .select('id')
        .eq('is_active', true)
        .single()

      if (!currentEvent) {
        setIsLoading(false)
        return
      }

      // Get logs from last 30 minutes
      const { data: recentLogs, error } = await supabase
        .from('incident_logs')
        .select('id, created_at, entry_type, is_amended, time_logged')
        .eq('event_id', currentEvent.id)
        .gte('created_at', thirtyMinutesAgo)
        .lte('created_at', now)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching recent logs:', error)
        setIsLoading(false)
        return
      }

      const totalLogs = recentLogs?.length || 0
      const newLogs = recentLogs?.filter(log => 
        new Date(log.created_at) > new Date(lastReminderTime)
      ).length || 0
      
      const retrospectiveLogs = recentLogs?.filter(log => 
        log.entry_type === 'retrospective'
      ).length || 0
      
      const amendedLogs = recentLogs?.filter(log => 
        log.is_amended === true
      ).length || 0

      setRecentLogsData({
        totalLogs,
        newLogs,
        retrospectiveLogs,
        amendedLogs,
        timeRange: '30 minutes'
      })
    } catch (error) {
      console.error('Error in fetchRecentLogs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Check for reminder every 30 minutes
  useEffect(() => {
    if (!isSilverCommander || !isVisible) return

    const checkReminder = () => {
      const now = Date.now()
      const timeSinceLastReminder = now - lastReminderTime
      const thirtyMinutes = 30 * 60 * 1000

      if (timeSinceLastReminder >= thirtyMinutes) {
        fetchRecentLogs()
        setLastReminderTime(now)
        setIsOpen(true)
      }
    }

    // Check immediately
    checkReminder()

    // Set up interval to check every 5 minutes
    const interval = setInterval(checkReminder, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [isSilverCommander, isVisible, lastReminderTime])

  // Auto-open if there are new logs since last reminder
  useEffect(() => {
    if (recentLogsData && recentLogsData.newLogs > 0 && isSilverCommander) {
      setIsOpen(true)
    }
  }, [recentLogsData, isSilverCommander])

  const handleDismiss = () => {
    setIsOpen(false)
    if (onDismiss) onDismiss()
  }

  const handleReviewLogs = () => {
    setIsOpen(false)
    if (onReviewLogs) {
      onReviewLogs()
    } else {
      // Default behavior - navigate to incidents page
      window.location.href = '/incidents'
    }
  }

  const handleSnooze = () => {
    setIsOpen(false)
    setLastReminderTime(Date.now() + 15 * 60 * 1000) // Snooze for 15 minutes
    addToast({
      type: 'info',
      title: 'Reminder Snoozed',
      message: 'Log review reminder will appear again in 15 minutes'
    })
  }

  if (!isSilverCommander || !isOpen || !recentLogsData) {
    return null
  }

  const hasNewActivity = recentLogsData.newLogs > 0 || recentLogsData.retrospectiveLogs > 0 || recentLogsData.amendedLogs > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 px-4 py-3 border-b border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    Log Review Reminder
                  </h3>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  As a Silver Commander, please review the last 30 minutes of incident logs for completeness and clarity.
                </p>

                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Activity Summary */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Activity Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {recentLogsData.totalLogs} total logs
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-700 dark:text-gray-300">
                            {recentLogsData.newLogs} new
                          </span>
                        </div>
                        {recentLogsData.retrospectiveLogs > 0 && (
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-amber-600" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {recentLogsData.retrospectiveLogs} retrospective
                            </span>
                          </div>
                        )}
                        {recentLogsData.amendedLogs > 0 && (
                          <div className="flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {recentLogsData.amendedLogs} amended
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Alert for significant activity */}
                    {hasNewActivity && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-amber-800 dark:text-amber-200">
                            <p className="font-semibold mb-1">Review Recommended</p>
                            <p>
                              {recentLogsData.newLogs > 0 && `• ${recentLogsData.newLogs} new incident(s) logged\n`}
                              {recentLogsData.retrospectiveLogs > 0 && `• ${recentLogsData.retrospectiveLogs} retrospective entry(ies)\n`}
                              {recentLogsData.amendedLogs > 0 && `• ${recentLogsData.amendedLogs} amendment(s) made`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleReviewLogs}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <EyeIcon className="h-4 w-4" />
                  Review Logs
                </button>
                <button
                  onClick={handleSnooze}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Snooze
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
