'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  MapPinIcon, 
  ClockIcon, 
  UserIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PhotoIcon,
  DocumentTextIcon,
  PencilIcon,
  CheckIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { useSwipeModal } from '../hooks/useSwipeGestures'
import { triggerHaptic } from '../utils/hapticFeedback'

interface IncidentDetailsBottomSheetProps {
  incident: any
  isOpen: boolean
  onClose: () => void
  onEdit?: (incident: any) => void
  onStatusChange?: (incidentId: string, status: string) => void
  className?: string
}

export default function IncidentDetailsBottomSheet({
  incident,
  isOpen,
  onClose,
  onEdit,
  onStatusChange,
  className = ''
}: IncidentDetailsBottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'logs' | 'media'>('details')
  const sheetRef = useRef<HTMLDivElement>(null)

  // Swipe gestures for closing
  const swipeGestures = useSwipeModal(
    onClose,
    undefined,
    undefined,
    { minSwipeDistance: 100 }
  )

  // Auto-expand on open
  useEffect(() => {
    if (isOpen) {
      setIsExpanded(true)
      triggerHaptic.impact()
    }
  }, [isOpen])

  if (!isOpen || !incident) return null

  const handleClose = () => {
    setIsExpanded(false)
    triggerHaptic.light()
    setTimeout(onClose, 200) // Wait for animation
  }

  const handleEdit = () => {
    triggerHaptic.medium()
    onEdit?.(incident)
  }

  const handleStatusChange = (newStatus: string) => {
    triggerHaptic.selection()
    onStatusChange?.(incident.id, newStatus)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'closed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={handleClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: isExpanded ? '10%' : '70%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl z-[61] ${className}`}
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
              maxHeight: '90vh'
            }}
            {...swipeGestures}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    Incident {incident.id}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                      {incident.status || 'Unknown'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(incident.priority)}`}>
                      {incident.priority || 'Unknown'} Priority
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={handleEdit}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Edit incident"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleClose}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {[
                  { id: 'details', label: 'Details', icon: DocumentTextIcon },
                  { id: 'logs', label: 'Logs', icon: ClockIcon },
                  { id: 'media', label: 'Media', icon: PhotoIcon }
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any)
                        triggerHaptic.selection()
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Type
                        </label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {incident.incident_type || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Time
                        </label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {formatTime(incident.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    {incident.location && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Location
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                          <MapPinIcon className="h-4 w-4 text-gray-400" />
                          <p className="text-sm text-gray-900 dark:text-white">
                            {incident.location}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Occurrence */}
                    {incident.occurrence && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Occurrence
                        </label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white leading-relaxed">
                          {incident.occurrence}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 block">
                        Quick Actions
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleStatusChange('in_progress')}
                          className="flex items-center justify-center gap-2 py-2 px-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm font-medium hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                        >
                          <ClockIcon className="h-4 w-4" />
                          In Progress
                        </button>
                        <button
                          onClick={() => handleStatusChange('closed')}
                          className="flex items-center justify-center gap-2 py-2 px-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                        >
                          <CheckIcon className="h-4 w-4" />
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'logs' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Log history for this incident will appear here.
                    </p>
                  </div>
                )}

                {activeTab === 'media' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Photos and attachments for this incident will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
