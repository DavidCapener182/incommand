'use client'

import React from 'react'
import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline'
import { TypingIndicator } from '@/components/ui/TypingIndicator'
import { CardFrame, CardHeader } from '@/components/ui/InCommandCard'

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
  
  const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"

  return (
    <CardFrame>
      <CardHeader
        icon={ChatBubbleBottomCenterTextIcon}
        title="Callsign Information"
        titleId="callsign-title"
        variant="green"
      />
      <div
        className="grid grid-cols-1 gap-5 sm:grid-cols-2"
        role="region"
        aria-labelledby="callsign-title"
      >
        {/* From Field */}
        <div className="relative space-y-1.5">
          <label htmlFor="callsign-from" className="text-xs font-semibold uppercase tracking-wide text-slate-500">From</label>
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
          <label htmlFor="callsign-to" className="text-xs font-semibold uppercase tracking-wide text-slate-500">To</label>
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
    </CardFrame>
  )
}
