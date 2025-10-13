// src/components/BulkActionsToolbar.tsx
'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  TagIcon,
  ArrowPathIcon,
  XMarkIcon,
  DocumentDuplicateIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'
import { type Priority } from '@/utils/incidentStyles'

interface BulkAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  action: () => void | Promise<void>
  requiresConfirmation?: boolean
  confirmMessage?: string
}

interface BulkActionsToolbarProps {
  selectedCount: number
  totalCount: number
  onClearSelection: () => void
  onClose: () => void
  onStatusChange: (status: string) => Promise<void>
  onPriorityChange: (priority: Priority) => Promise<void>
  onDelete: () => Promise<void>
  onExport: () => void
  className?: string
}

export default function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onClearSelection,
  onClose,
  onStatusChange,
  onPriorityChange,
  onDelete,
  onExport,
  className = ''
}: BulkActionsToolbarProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showPriorityMenu, setShowPriorityMenu] = useState(false)

  const handleAction = async (action: () => Promise<void>, requiresConfirmation = false, message = '') => {
    if (requiresConfirmation) {
      const confirmed = window.confirm(message || `Are you sure you want to perform this action on ${selectedCount} incidents?`)
      if (!confirmed) return
    }

    setIsProcessing(true)
    try {
      await action()
    } catch (error) {
      console.error('Bulk action failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const statusOptions = [
    { value: 'open', label: 'Mark as Open', color: 'text-yellow-600' },
    { value: 'closed', label: 'Mark as Closed', color: 'text-green-600' },
    { value: 'in_progress', label: 'Mark as In Progress', color: 'text-blue-600' }
  ]

  const priorityOptions: { value: Priority; label: string; color: string }[] = [
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'low', label: 'Low', color: 'text-green-600' }
  ]

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 ${className}`}
        >
          <div className="bg-white dark:bg-[#1a2a57] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2d437a] px-6 py-4 flex items-center gap-4">
            {/* Selection Info */}
            <div className="flex items-center gap-3 border-r border-gray-200 dark:border-gray-700 pr-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{selectedCount}</span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedCount} of {totalCount} selected
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {/* Change Status */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Status
                </motion.button>

                <AnimatePresence>
                  {showStatusMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full mb-2 left-0 bg-white dark:bg-[#1a2a57] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-[180px]"
                    >
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            handleAction(() => onStatusChange(option.value))
                            setShowStatusMenu(false)
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${option.color} text-sm`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Change Priority */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
                >
                  <TagIcon className="h-4 w-4" />
                  Priority
                </motion.button>

                <AnimatePresence>
                  {showPriorityMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full mb-2 left-0 bg-white dark:bg-[#1a2a57] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-[150px]"
                    >
                      {priorityOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            handleAction(() => onPriorityChange(option.value))
                            setShowPriorityMenu(false)
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${option.color} text-sm font-medium`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Export */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onExport}
                disabled={isProcessing}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
                title="Export selected incidents"
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
                Export
              </motion.button>

              {/* Delete */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction(onDelete, true, `Are you sure you want to delete ${selectedCount} incidents? This action cannot be undone.`)}
                disabled={isProcessing}
                className="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
                title="Delete selected incidents"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </motion.button>
            </div>

            {/* Clear Selection */}
            <div className="border-l border-gray-200 dark:border-gray-700 pl-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClearSelection}
                disabled={isProcessing}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                title="Clear selection"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </motion.button>
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="absolute inset-0 bg-white/80 dark:bg-[#1a2a57]/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <ArrowPathIcon className="h-5 w-5 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing...</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

