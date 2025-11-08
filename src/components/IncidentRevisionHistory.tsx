/**
 * Incident Revision History Component
 * Displays complete audit trail of amendments to an incident log
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { 
  LogRevisionWithDetails, 
  AuditableIncidentLog,
  CHANGE_TYPE_CONFIG
} from '@/types/auditableLog'
import { 
  getRevisionHistory,
  formatAmendmentDiff,
  getRevisionSummary
} from '@/lib/auditableLogging'

interface IncidentRevisionHistoryProps {
  incidentId: string
  incident?: AuditableIncidentLog
  isOpen?: boolean
  onToggle?: () => void
}

export default function IncidentRevisionHistory({
  incidentId,
  incident,
  isOpen: controlledIsOpen,
  onToggle
}: IncidentRevisionHistoryProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [revisions, setRevisions] = useState<LogRevisionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRevision, setSelectedRevision] = useState<number | null>(null)

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Timestamp unavailable'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 'Timestamp unavailable' : date.toLocaleString('en-GB')
  }

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const handleToggle = () => {
    if (onToggle) {
      onToggle()
    } else {
      setInternalIsOpen(!internalIsOpen)
    }
  }

  const loadRevisions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getRevisionHistory(incidentId)
      
      if (!result.success) {
        setError(result.error || 'Failed to load revision history')
        return
      }

      setRevisions(result.revisions || [])
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading revisions')
    } finally {
      setLoading(false)
    }
  }, [incidentId])

  useEffect(() => {
    if (isOpen) {
      loadRevisions()
    }
  }, [isOpen, loadRevisions])

  const summary = getRevisionSummary(revisions)

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'correction':
        return <ExclamationTriangleIcon className="h-5 w-5" />
      case 'clarification':
        return <InformationCircleIcon className="h-5 w-5" />
      case 'amendment':
        return <DocumentTextIcon className="h-5 w-5" />
      case 'status_change':
        return <CheckCircleIcon className="h-5 w-5" />
      case 'escalation':
        return <ArrowPathIcon className="h-5 w-5" />
      default:
        return <ClockIcon className="h-5 w-5" />
    }
  }

  return (
    <div className="border border-gray-200 dark:border-[#2d437a] rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full px-6 py-4 bg-gray-50 dark:bg-[#1a2a57] hover:bg-gray-100 dark:hover:bg-[#182447] transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <ClockIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Revision History
          </h3>
          {summary.totalRevisions > 0 && (
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-bold rounded-full">
              {summary.totalRevisions} {summary.totalRevisions === 1 ? 'revision' : 'revisions'}
            </span>
          )}
          {summary.hasCorrections && (
            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs font-bold rounded-full">
              Corrections
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-white dark:bg-[#23408e] lg:max-h-[calc(90vh-260px)] lg:overflow-y-auto lg:pr-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </div>
              ) : revisions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 min-h-[220px]">
                  <div className="h-20 w-20 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center shadow-inner">
                    <CheckCircleIcon className="h-9 w-9 text-green-500" />
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-gray-200 font-semibold">No revisions recorded</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      This incident log has not been amended yet.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  {summary.lastAmendedAt && formatDateTime(summary.lastAmendedAt) !== 'Timestamp unavailable' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-3 text-sm">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div>
                        <span className="text-blue-800 dark:text-blue-200 font-medium">
                          Last amended {formatDateTime(summary.lastAmendedAt)}
                        </span>
                        {summary.lastAmendedBy && (
                          <span className="text-blue-600 dark:text-blue-300"> by {summary.lastAmendedBy}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Revisions List */}
                  <div className="space-y-3">
                    {revisions.map((revision) => {
                      const diff = formatAmendmentDiff(revision)
                      const config = CHANGE_TYPE_CONFIG[revision.change_type]
                      const isExpanded = selectedRevision === revision.revision_number

                      return (
                        <div
                          key={revision.id}
                          className="border border-gray-200 dark:border-[#2d437a] rounded-lg overflow-hidden"
                        >
                          {/* Revision Header */}
                          <button
                            onClick={() => setSelectedRevision(isExpanded ? null : revision.revision_number)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1a2a57] hover:bg-gray-100 dark:hover:bg-[#182447] transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-600 dark:text-${config.color}-400`}>
                                {getChangeTypeIcon(revision.change_type)}
                              </div>
                              <div className="text-left">
                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                  Revision #{revision.revision_number} - {config.label}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {diff.field} changed by {diff.changedBy}
                                </div>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                            ) : (
                              <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                            )}
                          </button>

                          {/* Revision Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 bg-white dark:bg-[#23408e] space-y-4">
                                  {/* Timestamp */}
                                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <ClockIcon className="h-4 w-4" />
                                    <span>{diff.changedAt}</span>
                                  </div>

                                  {/* Changed By */}
                                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <UserIcon className="h-4 w-4" />
                                    <span>{diff.changedBy}</span>
                                    {revision.changed_by_callsign && (
                                      <span className="text-gray-500 dark:text-gray-500">
                                        ({revision.changed_by_callsign})
                                      </span>
                                    )}
                                  </div>

                                  {/* Diff */}
                                  <div className="space-y-2">
                                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                      Changes:
                                    </div>
                                    <div className="bg-gray-50 dark:bg-[#1a2a57] rounded-lg p-3 space-y-2">
                                      <div>
                                        <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                                          Previous Value:
                                        </div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                          {diff.oldValue}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                                          New Value:
                                        </div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                          {diff.newValue}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Reason */}
                                  <div className="space-y-2">
                                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                      Reason for Change:
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                      <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {diff.reason}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
