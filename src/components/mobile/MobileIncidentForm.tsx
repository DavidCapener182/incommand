'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { CameraIcon, MicrophoneIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/Toast'
import { getIncidentTypesForEvent } from '@/config/incidentTypes'
import { useEventContext } from '@/contexts/EventContext'
import { usePhotoCapture } from '@/hooks/usePhotoCapture'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useGeolocation } from '@/hooks/useGeolocation'
import type { Database } from '@/types/supabase'

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

  const { photos, captureFromCamera, uploadFromDevice, removePhoto, uploadPhotos, clearPhotos, isCameraAvailable, isCapturing, error: photoError } = usePhotoCapture({ maxPhotos: 3 })
  const { isListening, isSupported: voiceSupported, toggleListening, transcript, interimTranscript, error: voiceError } = useVoiceInput({
    onResult: (text, isFinal) => {
      if (isFinal && text) setDescription((prev) => (prev ? `${prev} ${text}` : text))
    },
  })
  const { getCurrentPosition, loading: gpsLoading, error: gpsError, isSupported: gpsSupported } = useGeolocation()

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

      const payload: Database['public']['Tables']['incident_logs']['Insert'] = {
        event_id: eventId,
        logged_by_user_id: user.id,
        logged_by_callsign: user.user_metadata?.callsign || 'Mobile User',
        callsign_from: user.user_metadata?.callsign || 'Mobile User',
        callsign_to: 'Event Control',
        incident_type: incidentType,
        occurrence: description,
        priority,
        location: location || null,
        status: 'open',
        is_closed: false,
        time_of_occurrence: now,
        time_logged: now,
        timestamp: now,
        entry_type: 'contemporaneous',
        log_number: logNumber,
        action_taken: '',
        source: 'mobile',
      }

      const { data: inserted, error } = await (supabase as any).from('incident_logs').insert([payload]).select('id').single()
      if (error) {
        throw error
      }

      if (photos.length > 0 && inserted?.id) {
        try {
          await uploadPhotos(inserted.id)
          clearPhotos()
        } catch (uploadErr) {
          addToast({ type: 'error', title: 'Photos could not be uploaded', message: 'Incident was logged.' })
        }
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

  const handleUseMyLocation = async () => {
    const pos = await getCurrentPosition()
    if (pos) setLocation(`GPS: ${pos.latitude.toFixed(5)}, ${pos.longitude.toFixed(5)}`)
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-incommand-surface border border-gray-200/70 dark:border-gray-800 shadow-sm p-4">
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
            <div className="flex gap-1">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Stand / area"
                className="flex-1 min-w-0 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
              {gpsSupported && (
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={gpsLoading}
                  title="Use my location"
                  className="flex min-h-[44px] min-w-[44px] touch-target items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                >
                  <MapPinIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            {gpsError && <p className="text-[10px] text-red-500">{gpsError}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">Short description</label>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 pr-12 text-sm"
              placeholder="What happened?"
            />
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? 'Stop voice input' : 'Voice input'}
                className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-lg ${
                  isListening ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                <MicrophoneIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          {(interimTranscript || transcript) && (
            <p className="text-[10px] text-gray-500 dark:text-gray-400 italic">
              {interimTranscript || transcript}
            </p>
          )}
          {voiceError && <p className="text-[10px] text-red-500">{voiceError}</p>}
        </div>

        {isCameraAvailable && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">Photos</label>
            <div className="flex flex-wrap gap-2">
              {photos.map((p) => (
                <div key={p.id} className="relative">
                  <Image
                    src={p.url}
                    alt=""
                    width={64}
                    height={64}
                    unoptimized
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <>
                  <button
                    type="button"
                    onClick={() => captureFromCamera()}
                    disabled={isCapturing}
                    className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400"
                  >
                    <CameraIcon className="h-6 w-6" />
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="mobile-incident-photo"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) uploadFromDevice(f)
                      e.target.value = ''
                    }}
                  />
                  <label
                    htmlFor="mobile-incident-photo"
                    className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 text-xs"
                  >
                    Upload
                  </label>
                </>
              )}
            </div>
            {photoError && <p className="text-[10px] text-red-500">{photoError}</p>}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-incommand-brand-mobile text-white py-2.5 font-semibold shadow-sm disabled:opacity-50"
        >
          {loading ? 'Logging…' : 'Submit incident'}
        </button>
      </form>
    </div>
  )
}
