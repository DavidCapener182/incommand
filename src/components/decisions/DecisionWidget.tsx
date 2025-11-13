/**
 * Decision Widget Component
 * Feature 3: Golden Thread Decision Logging
 * 
 * Dashboard widget showing recent decisions and quick log button
 */

'use client'

import React, { useState, useEffect } from 'react'
import { ClockIcon, LockClosedIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Decision } from '@/types/decisions'
import DecisionLogger from './DecisionLogger'
import DecisionDetails from './DecisionDetails'

interface DecisionWidgetProps {
  eventId: string | null
}

export default function DecisionWidget({ eventId }: DecisionWidgetProps) {
  const [recentDecisions, setRecentDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)
  const [showDecisionLogger, setShowDecisionLogger] = useState(false)
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null)
  const [lockedCount, setLockedCount] = useState(0)

  useEffect(() => {
    if (eventId) {
      fetchRecentDecisions()
    }
  }, [eventId])

  const fetchRecentDecisions = async () => {
    if (!eventId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/decisions?event_id=${eventId}&limit=5`)
      if (response.ok) {
        const data = await response.json()
        setRecentDecisions(data.decisions || [])
        
        // Count locked decisions
        const locked = (data.decisions || []).filter((d: Decision) => d.is_locked).length
        setLockedCount(locked)
      }
    } catch (err) {
      console.error('Error fetching recent decisions:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!eventId) {
    return null
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-1 px-3 pt-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-gray-900 dark:text-white">
              Decisions
            </CardTitle>
            <button
              onClick={() => setShowDecisionLogger(true)}
              className="p-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
              title="Log Decision"
            >
              <PlusIcon className="h-3 w-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col min-h-0 px-3 pb-3">
          {loading ? (
            <div className="text-center py-2 flex items-center justify-center flex-1">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          ) : recentDecisions.length === 0 ? (
            <div className="text-center py-2 flex flex-col items-center justify-center flex-1">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">No decisions logged</p>
              <button
                onClick={() => setShowDecisionLogger(true)}
                className="text-[10px] text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                Log First Decision
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="space-y-1 flex-1 overflow-y-auto">
                {recentDecisions.slice(0, 2).map((decision) => (
                  <div
                    key={decision.id}
                    onClick={() => setSelectedDecision(decision)}
                    className="p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <ClockIcon className="h-2 w-2 text-gray-400 flex-shrink-0" />
                          <span className="text-[9px] text-gray-500 dark:text-gray-400">
                            {formatTimestamp(decision.timestamp)}
                          </span>
                          {decision.is_locked && (
                            <LockClosedIcon className="h-2 w-2 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] font-medium text-gray-900 dark:text-white truncate">
                          {decision.trigger_issue}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {recentDecisions.length > 2 && (
                <button
                  onClick={() => setSelectedDecision(recentDecisions[0])}
                  className="w-full text-[9px] text-blue-600 hover:text-blue-800 dark:text-blue-400 text-center pt-1 border-t border-gray-200 dark:border-gray-700 mt-1 flex-shrink-0"
                >
                  View All ({recentDecisions.length})
                </button>
              )}
              {lockedCount > 0 && (
                <div className="pt-1 border-t border-gray-200 dark:border-gray-700 mt-1 flex-shrink-0">
                  <p className="text-[9px] text-gray-600 dark:text-gray-400">
                    {lockedCount} locked
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decision Logger Modal */}
      {showDecisionLogger && (
        <DecisionLogger
          eventId={eventId}
          isOpen={showDecisionLogger}
          onClose={() => setShowDecisionLogger(false)}
          onDecisionCreated={() => {
            fetchRecentDecisions()
            setShowDecisionLogger(false)
          }}
        />
      )}

      {/* Decision Details Modal */}
      {selectedDecision && (
        <DecisionDetails
          decisionId={selectedDecision.id}
          onClose={() => setSelectedDecision(null)}
          onDecisionUpdated={fetchRecentDecisions}
        />
      )}
    </>
  )
}

