/**
 * Decision Timeline Component
 * Feature 3: Golden Thread Decision Logging
 * 
 * Chronological timeline view of decisions for an event
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  ClockIcon, 
  LockClosedIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import type { Decision } from '@/types/decisions'
import DecisionLogger from './DecisionLogger'
import DecisionDetails from './DecisionDetails'

interface DecisionTimelineProps {
  eventId: string
  showLockedOnly?: boolean
  roleLevelFilter?: string
}

const ROLE_LEVEL_COLORS: Record<string, string> = {
  bronze: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  silver: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  gold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  platinum: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  other: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
}

export default function DecisionTimeline({
  eventId,
  showLockedOnly,
  roleLevelFilter,
}: DecisionTimelineProps) {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    locked_only: showLockedOnly || false,
    role_level: roleLevelFilter || '',
    from: '',
    to: '',
  })
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null)
  const [showDecisionLogger, setShowDecisionLogger] = useState(false)
  const [editingDecision, setEditingDecision] = useState<Decision | undefined>()

  const limit = 20

  const fetchDecisions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        event_id: eventId,
        page: page.toString(),
        limit: limit.toString(),
      })

      if (filters.locked_only) params.append('locked_only', 'true')
      if (filters.role_level) params.append('role_level', filters.role_level)
      if (filters.from) params.append('from', filters.from)
      if (filters.to) params.append('to', filters.to)

      const response = await fetch(`/api/decisions?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch decisions')
      }

      const data = await response.json()
      setDecisions(data.decisions || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      setError(err.message || 'Failed to load decisions')
      console.error('Error fetching decisions:', err)
    } finally {
      setLoading(false)
    }
  }, [eventId, page, filters])

  useEffect(() => {
    if (eventId) {
      fetchDecisions()
    }
  }, [eventId, fetchDecisions])

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value })
    setPage(1) // Reset to first page when filters change
  }

  const filteredDecisions = decisions.filter(decision => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      decision.trigger_issue.toLowerCase().includes(query) ||
      decision.decision_taken.toLowerCase().includes(query) ||
      decision.rationale.toLowerCase().includes(query) ||
      decision.location?.toLowerCase().includes(query) ||
      decision.decision_owner_callsign?.toLowerCase().includes(query)
    )
  })

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleEditDecision = (decision: Decision) => {
    if (decision.is_locked) {
      alert('This decision is locked and cannot be edited. You can add annotations instead.')
      return
    }
    setEditingDecision(decision)
    setShowDecisionLogger(true)
  }

  const handleDecisionCreated = () => {
    fetchDecisions()
    setShowDecisionLogger(false)
    setEditingDecision(undefined)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Decision Timeline
        </h2>
        <button
          onClick={() => {
            setEditingDecision(undefined)
            setShowDecisionLogger(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Log Decision
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search decisions..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Locked Only
              </label>
              <input
                type="checkbox"
                checked={filters.locked_only}
                onChange={(e) => handleFilterChange('locked_only', e.target.checked)}
                className="h-4 w-4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role Level
              </label>
              <select
                value={filters.role_level}
                onChange={(e) => handleFilterChange('role_level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From
              </label>
              <input
                type="datetime-local"
                value={filters.from}
                onChange={(e) => handleFilterChange('from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To
              </label>
              <input
                type="datetime-local"
                value={filters.to}
                onChange={(e) => handleFilterChange('to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading decisions...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Decisions List */}
      {!loading && !error && (
        <>
          {filteredDecisions.length === 0 ? (
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400">
                {decisions.length === 0 ? 'No decisions logged yet' : 'No decisions match your search'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDecisions.map((decision) => (
                <div
                  key={decision.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedDecision(decision)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <ClockIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTimestamp(decision.timestamp)}
                        </span>
                        {decision.is_locked && (
                          <LockClosedIcon className="h-4 w-4 text-green-600" title="Locked" />
                        )}
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            ROLE_LEVEL_COLORS[decision.role_level] || ROLE_LEVEL_COLORS.other
                          }`}
                        >
                          {decision.role_level}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {decision.trigger_issue}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {decision.decision_taken}
                      </p>
                      {decision.location && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Location: {decision.location}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditDecision(decision)
                      }}
                      className="ml-4 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      disabled={decision.is_locked}
                    >
                      {decision.is_locked ? 'View' : 'Edit'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} decisions
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <span className="px-4 py-2 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Decision Logger Modal */}
      {showDecisionLogger && (
        <DecisionLogger
          eventId={eventId}
          isOpen={showDecisionLogger}
          onClose={() => {
            setShowDecisionLogger(false)
            setEditingDecision(undefined)
          }}
          onDecisionCreated={handleDecisionCreated}
          initialDecision={editingDecision}
        />
      )}

      {/* Decision Details Modal */}
      {selectedDecision && (
        <DecisionDetails
          decisionId={selectedDecision.id}
          onClose={() => setSelectedDecision(null)}
          onDecisionUpdated={fetchDecisions}
        />
      )}
    </div>
  )
}

