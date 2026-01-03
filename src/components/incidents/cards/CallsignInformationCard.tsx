'use client'

import React from 'react'
import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline'
import { TypingIndicator } from '@/components/ui/TypingIndicator'

export interface CallsignInformationCardProps {
  callsignFrom: string
  callsignTo: string
  onCallsignFromChange: (value: string) => void
  onCallsignToChange: (value: string) => void
  getCallsignTo: () => string
  presenceUsers: Array<{ id: string; name: string; color: string }>
  updateFocus: (fieldName: string) => void
  updateTyping: (fieldName: string, isTyping: boolean) => void
}

export default function CallsignInformationCard({
  callsignFrom,
  callsignTo,
  onCallsignFromChange,
  onCallsignToChange,
  getCallsignTo,
  presenceUsers,
  updateFocus,
  updateTyping,
}: CallsignInformationCardProps) {
  
  const inputClass = "w-full rounded-lg border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-all h-10 px-3 shadow-sm placeholder:text-slate-400"

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <div className="bg-green-100 p-1.5 rounded-md text-green-600">
          <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
        </div>
        <h3 id="callsign-title" className="font-semibold text-slate-800 text-sm">Callsign Information</h3>
      </div>
      
      {/* Card Content */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5" role="region" aria-labelledby="callsign-title">
        {/* From Field */}
        <div className="relative space-y-1.5">
          <label htmlFor="callsign-from" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">From</label>
          <div className="relative">
            <input
              id="callsign-from"
              type="text"
              value={callsignFrom || ''}
              onChange={(e) => onCallsignFromChange(e.target.value)}
              onFocus={() => updateFocus('callsign-from')}
              onBlur={() => updateTyping('callsign-from', false)}
              onKeyDown={() => updateTyping('callsign-from', true)}
              placeholder="Enter callsign..."
              className={inputClass}
            />
            <TypingIndicator users={presenceUsers} fieldName="callsign-from" position="bottom" />
          </div>
        </div>

        {/* To Field */}
        <div className="space-y-1.5">
          <label htmlFor="callsign-to" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">To</label>
          <input
            id="callsign-to"
            type="text"
            value={callsignTo || getCallsignTo()}
            onChange={(e) => onCallsignToChange(e.target.value)}
            placeholder="Event Control"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  )
}