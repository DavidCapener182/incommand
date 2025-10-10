'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import MonitoringDashboard from '@/components/monitoring/MonitoringDashboard'

export default function MonitoringPage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <MonitoringDashboard />
    </div>
  )
}

