'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/Toast'
import { getIncidentTypesForEvent } from '@/config/incidentTypes'
import { useEventContext } from '@/contexts/EventContext'

type Priority = 'low' | 'medium' | 'high' | 'urgent'

interface MobileIncidentFormProps {
  eventId: string | null
  onSuccess: () => void
  onCancel?: () => void
}

const priorities: Priority[] = ['low', 'medium', 'high', 'urgent']

const normalisePrefix = (value: string) => {
  const trimmed = (value || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase()
  return trimmed || 'INC'
}

async function generateNextLogNumber(eventId: string, prefixSource?: string) {
  const { count } = await supabase
    .from('incident_logs')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)

  const prefix = normalisePrefix(prefixSource || 'INC')
  const nextSequence = (count ?? 0) + 1
  return `${prefix}-${String(nextSequence).padStart(3, '0')}`
}

export default function MobileIncidentForm({ eventId, onSuccess, onCancel }: MobileIncidentFormProps) {
  const { user } = useAuth()
  const { eventData, eventType } = useEventContext()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [incidentType, setIncidentType] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')

  const incidentOptions = useMemo(() => getIncidentTypesForEvent(eventType), [eventType])

  useEffect(() => {
    if (!incidentType && incidentOptions.length > 0) {
      setIncidentType(incidentOptions[0])
    }
  }, [incidentOptions, incidentType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId) {
      addToast({ type: 'error', title: 'No active event', message: 'Select or create an event before logging incidents.' })
      return
    }
    if (!user?.id) {
      addToast({ type: 'error', title: 'Not signed in', message: 'Please sign in to log an incident.' })
      return
    }

    setLoading(true)
    try {
      const logNumber = await generateNextLogNumber(eventId, eventData?.event_name || 'INC')
      const now = new Date().toISOString()
      const payload = {
        event_id: eventId,
        logged_by_user_id: user.id,
        callsign_from: user.user_metadata?.callsign || 'Mobile User',
        callsign_to: 'Event Control',
        incident_type: incidentType,
        occurrence: description,
        priority,
        location,
        status: 'open',
        is_closed: false,
        time_of_occurrence: now,
        time_logged: now,
        entry_type: 'contemporaneous',
        log_number: logNumber,
      }

      const { error } = await supabase.from('incident_logs').insert([payload])
      if (error) {
        throw error
      }

      addToast({
        type: 'success',
        title: 'Incident logged',
        message: 'Your incident has been sent to the control room.'
      })
      setDescription('')
      setLocation('')
      setPriority('medium')
      onSuccess()
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Unable to log incident',
        message: err?.message || 'Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-[#111a30] border border-gray-200/70 dark:border-gray-800 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Log new incident</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Quick entry for frontline teams</p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-gray-600 dark:text-gray-300"
          >
            Cancel
          </button>
        )}
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">Incident type</label>
          <select
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          >
            {incidentOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Stand / area"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">Short description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            placeholder="What happened?"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#2A3990] text-white py-2.5 font-semibold shadow-sm disabled:opacity-50"
        >
          {loading ? 'Logging…' : 'Submit incident'}
        </button>
      </form>
    </div>
  )
}

