'use client'

import React, { useState } from 'react'
import EventMessagesPanel from '@/components/EventMessagesPanel'
import AIChat from '@/components/AIChat'

export default function MessagesPage() {
  // Event context is obtained within EventMessagesPanel
  const [showListOnMobile, setShowListOnMobile] = useState(true)
  return (
    <section aria-label="Messages" className="px-4 md:px-6 pb-24">
      {/* Main two-pane grid is implemented inside EventMessagesPanel for cohesion */}
      <EventMessagesPanel eventId={null as any} eventName={''} AIChat={AIChat} />
    </section>
  )
}

