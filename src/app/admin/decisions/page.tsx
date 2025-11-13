/**
 * Admin Decisions Page
 * Feature 3: Golden Thread Decision Logging
 * 
 * Full management interface for viewing and managing all decisions
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DecisionTimeline from '@/components/decisions/DecisionTimeline'
import DecisionDetails from '@/components/decisions/DecisionDetails'
import DecisionLogger from '@/components/decisions/DecisionLogger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusIcon } from '@heroicons/react/24/outline'
import type { Decision } from '@/types/decisions'

export default function AdminDecisionsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [events, setEvents] = useState<Array<{ id: string; event_name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [showDecisionLogger, setShowDecisionLogger] = useState(false)
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
        if (data.events && data.events.length > 0) {
          setSelectedEventId(data.events[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching events:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Decision Logging
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Golden Thread Decision Logging - Tamper-evident decision records
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={selectedEventId || ''}
            onValueChange={setSelectedEventId}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.event_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedEventId && (
            <Button
              onClick={() => setShowDecisionLogger(true)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Log Decision
            </Button>
          )}
        </div>
      </div>

      {/* Decision Timeline */}
      {selectedEventId ? (
        <Card>
          <CardContent className="p-6">
            <DecisionTimeline
              eventId={selectedEventId}
              showLockedOnly={false}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Please select an event to view decisions
            </p>
          </CardContent>
        </Card>
      )}

      {/* Decision Logger Modal */}
      {selectedEventId && (
        <DecisionLogger
          eventId={selectedEventId}
          isOpen={showDecisionLogger}
          onClose={() => setShowDecisionLogger(false)}
          onDecisionCreated={() => {
            setShowDecisionLogger(false)
            // Timeline will auto-refresh
          }}
        />
      )}

      {/* Decision Details Modal */}
      {selectedDecision && (
        <DecisionDetails
          decisionId={selectedDecision.id}
          onClose={() => setSelectedDecision(null)}
          onDecisionUpdated={() => {
            // Timeline will auto-refresh
          }}
        />
      )}
    </div>
  )
}

