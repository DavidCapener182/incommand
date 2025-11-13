'use client'

import React, { useState } from 'react'
import { RadioIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/Toast'
import { analyzeRadioMessage } from '@/lib/ai/radioAnalysis'

interface RadioMessageInputProps {
  eventId: string | null
  callsignFrom?: string
  callsignTo?: string
  occurrence?: string
  onMessageCreated?: (message: any) => void
  className?: string
}

export default function RadioMessageInput({
  eventId,
  callsignFrom = '',
  callsignTo = '',
  occurrence = '',
  onMessageCreated,
  className,
}: RadioMessageInputProps) {
    const { addToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [channel, setChannel] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!eventId) {
        addToast({
          type: 'error',
          title: 'No Event Selected',
          message: 'Please select an event first',
        })
      return
    }

    if (!channel) {
        addToast({
          type: 'error',
          title: 'Channel Required',
          message: 'Channel is required',
        })
      return
    }

    if (!occurrence || !occurrence.trim()) {
        addToast({
          type: 'error',
          title: 'Incident Details Needed',
          message: 'Please enter incident details first',
        })
      return
    }

    try {
      setIsSubmitting(true)

      // Analyze the message for category and priority
      const analysis = analyzeRadioMessage(occurrence)

      const response = await fetch('/api/radio/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          channel: channel,
          from_callsign: callsignFrom || null,
          to_callsign: callsignTo || null,
          message: occurrence,
          category: analysis.category || null,
          priority: analysis.priority || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create radio message')
      }

      const { data } = await response.json()
      
        addToast({
          type: 'success',
          title: 'Message Recorded',
          message: 'Radio message recorded successfully',
        })
      
      // Reset channel only
      setChannel('')
      setIsOpen(false)

      // Notify parent component
      if (onMessageCreated) {
        onMessageCreated(data)
      }
      } catch (error: any) {
        console.error('Error creating radio message:', error)
        addToast({
          type: 'error',
          title: 'Error',
          message: error.message || 'Failed to record radio message',
        })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!eventId) {
    return null
  }

  const canRecord = channel.trim() && occurrence.trim() && callsignFrom.trim()

  return (
    <div className={cn('bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg', className)}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full p-3 flex items-center justify-between hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-2">
            <RadioIcon className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              Record Radio Traffic
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Click to record
          </span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-3 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <RadioIcon className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                Record Radio Traffic
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setChannel('')
              }}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancel
            </button>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Uses callsigns and message from incident form below
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Channel *
            </label>
            <input
              type="text"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="e.g., Channel 1"
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-1 border-t border-gray-200 dark:border-gray-700">
            <div>
              <span className="font-medium">From:</span> {callsignFrom || <span className="italic">Enter callsign below</span>}
            </div>
            <div>
              <span className="font-medium">To:</span> {callsignTo || <span className="italic">Enter callsign below</span>}
            </div>
            <div>
              <span className="font-medium">Message:</span> {occurrence ? (
                <span className="line-clamp-2">{occurrence}</span>
              ) : (
                <span className="italic">Enter incident details below</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !canRecord}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md transition-colors"
          >
            {isSubmitting ? (
              <>
                <RadioIcon className="h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="h-4 w-4" />
                Record Message
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}

