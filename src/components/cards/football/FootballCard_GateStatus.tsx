'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FootballData } from '@/types/football'

export default function FootballCard_GateStatus({ className }: { className?: string }) {
  const [data, setData] = useState<FootballData | null>(null)

  const load = async () => {
    const res = await fetch('/api/football/data')
    if (!res.ok) return
    const json = await res.json()
    setData(json.data)
  }

  useEffect(() => {
    let mounted = true
    const wrapped = async () => { if (mounted) await load() }
    wrapped()
    const id = setInterval(wrapped, 30000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  return (
    <div className={`h-full card-depth flex flex-col justify-between ${className || ''}`}>
      <h3 className="text-gray-800 font-semibold text-lg mb-3">Crowd Movement & Gate Status</h3>
      <div className="text-sm text-gray-700 space-y-1">
        {!data ? (
          <div className="text-xs text-gray-500">Loading…</div>
        ) : (
          <>
            <p><strong>Gates Open:</strong> {data.gateStatus.openTime || '-'}</p>
            <p><strong>Turnstiles Active:</strong> {data.gateStatus.activeTurnstiles}/{data.gateStatus.totalTurnstiles}</p>
            <p><strong>Entry Rate:</strong> {data.gateStatus.entryRate.toLocaleString()}/hour</p>
            {data.gateStatus.predictedFullEntry && (
              <p><strong>Predicted Full Entry:</strong> {data.gateStatus.predictedFullEntry}</p>
            )}
            {data.gateStatus.queueAlerts.length > 0 && (
              <p>
                <strong>Queue Alerts:</strong> <span className="text-red-600 font-semibold">{data.gateStatus.queueAlerts.join(', ')}</span>
              </p>
            )}
          </>
        )}
      </div>
      <div className="mt-3">
        <div className="h-2 bg-gray-100 rounded-full">
          <div className="h-2 bg-blue-500 rounded-full transition-all duration-700" style={{ width: '90%' }} />
        </div>
        <p className="text-xs text-gray-500 mt-1 text-right">90% of expected entry complete</p>
      </div>
    </div>
  )
}


