'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RadioTrafficAnalyzer from '@/components/monitoring/RadioTrafficAnalyzer'
import ChannelHealthCard from '@/components/monitoring/ChannelHealthCard'
import { useEventContext } from '@/contexts/EventContext'

export default function RadioAnalysisPage() {
  const router = useRouter()
  const { eventId: contextEventId } = useEventContext()
  const [eventId, setEventId] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    // Use context event ID if available, otherwise try to get current event
    if (contextEventId) {
      setEventId(contextEventId)
    } else {
      const fetchCurrentEvent = async () => {
        const { data: event } = await (supabase as any)
          .from('events')
          .select('id')
          .eq('is_current', true)
          .single()
        
        if (event) {
          setEventId((event as any).id)
        }
      }
      fetchCurrentEvent()
    }
  }, [contextEventId])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Radio Traffic Analysis
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Real-time analysis of radio communications, channel health monitoring, and traffic patterns
          </p>
        </div>

        {/* Channel Health Overview */}
        <ChannelHealthCard eventId={eventId} />

        {/* Radio Traffic Analyzer */}
        <RadioTrafficAnalyzer eventId={eventId} />
      </div>
    </div>
  )
}

