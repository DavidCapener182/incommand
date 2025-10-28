'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FootballData } from '@/types/football'

export default function FootballCard_Transport({ className = '' }: { className?: string }) {
  const [data, setData] = useState<FootballData | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const res = await fetch('/api/football/data')
      if (!res.ok) return
      const json = await res.json()
      if (mounted) setData(json.data)
    }
    load()
    const id = setInterval(load, 60000)
    return () => { mounted = false; clearInterval(id) }
  }, [])


  return (
    <div className={`h-full bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between ${className || ''}`}>
        <h3 className="text-gray-800 font-semibold text-lg mb-3">Transport Status</h3>
        <div className="text-sm text-gray-700 space-y-1">
          {!data ? (
            <div className="text-xs text-gray-500">Loading…</div>
          ) : (
            <>
              <p><strong>Rail:</strong> {data.transportWeather.transport.rail}</p>
              <p><strong>Buses:</strong> {data.transportWeather.transport.buses}</p>
              <p><strong>Taxi:</strong> {data.transportWeather.transport.taxi}</p>
              <p><strong>Road Closures:</strong></p>
              <ul className="list-disc ml-4 text-xs">
                {data.transportWeather.transport.roadClosures?.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </>
          )}
        </div>
    </div>
  )
}


