'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FootballData, StandOccupancyMap } from '@/types/football'

function getColor(percent: number) {
  if (percent > 95) return 'bg-red-500'
  if (percent >= 85) return 'bg-amber-500'
  return 'bg-green-500'
}

export default function FootballCard_StandOccupancy({ className }: { className?: string }) {
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
    const id = setInterval(load, 30000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  const totals = useMemo(() => {
    if (!data?.occupancy) return { current: 0, capacity: 0, percent: 0 }
    const values = Object.values(data.occupancy as StandOccupancyMap)
    const current = values.reduce((sum, v) => sum + (v.current || 0), 0)
    const capacity = values.reduce((sum, v) => sum + (v.capacity || 0), 0)
    const percent = capacity ? (current / capacity) * 100 : 0
    return { current, capacity, percent }
  }, [data])

  return (
    <div className={`h-full card-depth flex flex-col justify-between ${className || ''}`}>
      <h3 className="text-gray-800 font-semibold text-lg mb-3">Stand Occupancy</h3>
      <div className="space-y-3">
        {!data ? (
          <div className="text-xs text-gray-500">Loading…</div>
        ) : (
          Object.entries(data.occupancy).map(([name, val]) => {
            const percent = val.capacity ? Math.min(100, (val.current / val.capacity) * 100) : 0
            const colour = percent < 85 ? 'bg-green-500' : percent < 95 ? 'bg-amber-500' : 'bg-red-500'
            return (
              <div key={name}>
                <div className="flex justify-between text-sm text-gray-700">
                  <span>{name}</span>
                  <span className="font-medium">{percent.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-2 ${colour} rounded-full transition-all duration-700`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
      <div className="mt-4 text-sm text-gray-600">
        Total:{' '}
        <span className="text-gray-900 font-semibold">
          {totals.current.toLocaleString()} / {totals.capacity.toLocaleString()} ({totals.percent.toFixed(1)}%)
        </span>
      </div>
    </div>
  )
}


