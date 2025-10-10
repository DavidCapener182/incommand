'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  CheckIcon,
  UserGroupIcon,
  TagIcon,
  ArrowDownTrayIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface BulkActionsBarProps {
  selectedCount: number
  selectedIds: number[]
  onClearSelection: () => void
  onBulkClose: () => void
  onBulkAssign: () => void
  onBulkTag: () => void
  onBulkExport: () => void
  onBulkDelete: () => void
  onBulkStatusChange: (status: string) => void
}

export default function BulkActionsBar({
  selectedCount,
  selectedIds,
  onClearSelection,
  onBulkClose,
  onBulkAssign,
  onBulkTag,
  onBulkExport,
  onBulkDelete,
  onBulkStatusChange
}: BulkActionsBarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  if (selectedCount === 0) return null

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'text-gray-600' },
    { value: 'in-progress', label: 'In Progress', color: 'text-yellow-600' },
    { value: 'resolved', label: 'Resolved', color: 'text-green-600' },
    { value: 'closed', label: 'Closed', color: 'text-blue-600' }
  ]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Selection Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {selectedCount} {selectedCount === 1 ? 'incident' : 'incidents'} selected
                  </p>
                  <p className="text-sm text-white/80">
                    Choose an action below
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Status Change */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                >
                  <CheckIcon className="h-5 w-5" />
                  Change Status
                </button>

                <AnimatePresence>
                  {showStatusMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden min-w-48"
                    >
                      {statusOptions.map((status) => (
                        <button
                          key={status.value}
                          onClick={() => {
                            onBulkStatusChange(status.value)
                            setShowStatusMenu(false)
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                          <span className={`font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Close Selected */}
              <button
                onClick={onBulkClose}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                title="Close selected incidents"
              >
                <CheckIcon className="h-5 w-5" />
                Close
              </button>

              {/* Assign */}
              <button
                onClick={onBulkAssign}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                title="Assign selected incidents"
              >
                <UserGroupIcon className="h-5 w-5" />
                Assign
              </button>

              {/* Tag */}
              <button
                onClick={onBulkTag}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                title="Add tags to selected incidents"
              >
                <TagIcon className="h-5 w-5" />
                Tag
              </button>

              {/* Export */}
              <button
                onClick={onBulkExport}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                title="Export selected incidents"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Export
              </button>

              {/* Delete */}
              <button
                onClick={onBulkDelete}
                className="px-4 py-2 bg-red-500/80 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2"
                title="Delete selected incidents"
              >
                <TrashIcon className="h-5 w-5" />
                Delete
              </button>

              {/* Clear Selection */}
              <button
                onClick={onClearSelection}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Clear selection"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Bulk Tag Modal
export function BulkTagModal({
  isOpen,
  onClose,
  selectedIds,
  onComplete
}: {
  isOpen: boolean
  onClose: () => void
  selectedIds: number[]
  onComplete: () => void
}) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const tagPresets = [
    { name: 'medical', color: '#EF4444' },
    { name: 'crowd', color: '#F59E0B' },
    { name: 'VIP', color: '#8B5CF6' },
    { name: 'weather', color: '#3B82F6' },
    { name: 'security', color: '#DC2626' },
    { name: 'staff', color: '#10B981' }
  ]

  const handleApplyTags = async () => {
    setIsLoading(true)
    
    try {
      // Apply each tag to each incident
      const promises = selectedIds.flatMap(incidentId =>
        selectedTags.map(tag =>
          fetch('/api/v1/incidents/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ incident_id: incidentId, tag })
          })
        )
      )

      await Promise.all(promises)
      onComplete()
      onClose()
      setSelectedTags([])
    } catch (error) {
      console.error('Error applying tags:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Add Tags to {selectedIds.length} Incidents
        </h3>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tagPresets.map((tag) => (
              <button
                key={tag.name}
                onClick={() => toggleTag(tag.name)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedTags.includes(tag.name)
                    ? 'ring-2 ring-offset-2 ring-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                style={selectedTags.includes(tag.name) ? { backgroundColor: tag.color } : {}}
              >
                {tag.name}
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyTags}
              disabled={selectedTags.length === 0 || isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {isLoading ? 'Applying...' : `Apply Tags`}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

