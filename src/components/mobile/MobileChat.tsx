'use client'

import React from 'react'
import TeamChat from '@/components/chat/TeamChat'
import { useAuth } from '@/contexts/AuthContext'

interface MobileChatProps {
  eventId: string | null
  companyId: string | null
}

export default function MobileChat({ eventId, companyId }: MobileChatProps) {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="p-4 text-sm text-gray-600 dark:text-gray-300">
        Please sign in to use chat.
      </div>
    )
  }

  if (!eventId || !companyId) {
    return (
      <div className="p-4 text-sm text-gray-600 dark:text-gray-300">
        No active event or company found. Select an event to start chatting with the control room.
      </div>
    )
  }

  const userCallsign = user.user_metadata?.callsign || user.email?.split('@')[0] || 'User'

  return (
    <div className="h-full min-h-[60vh] bg-white dark:bg-[#0f1a33]">
      <TeamChat
        eventId={eventId}
        companyId={companyId}
        userId={user.id}
        userCallsign={userCallsign}
      />
    </div>
  )
}

