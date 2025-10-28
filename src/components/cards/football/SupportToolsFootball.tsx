'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { FootballData } from '@/types/football'
import FootballCard_StandOccupancy from './FootballCard_StandOccupancy'
import FootballCard_LiveScore from './FootballCard_LiveScore'
import FootballCard_GateStatus from './FootballCard_GateStatus'
import FootballCard_MedicalPolicing from './FootballCard_MedicalPolicing'
import FootballCard_Transport from './FootballCard_TransportWeather'

export default function SupportToolsFootball() {
  const [data, setData] = useState<FootballData | null>(null)

  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      const res = await fetch('/api/football/data')
      if (!res.ok) return
      const json = await res.json()
      if (mounted) setData(json.data)
    }
    fetchData()
    return () => { mounted = false }
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5">
      {/* Each wrapper uses flex + uniform height for consistent sizing */}
      <div className="col-span-1 flex h-[260px]">
        <FootballCard_StandOccupancy className="flex-1" />
      </div>

      <div className="col-span-1 flex h-[260px]">
        <FootballCard_MedicalPolicing className="flex-1" />
      </div>

      <div className="col-span-2 flex h-[260px]">
        <FootballCard_LiveScore className="flex-1" />
      </div>

      <div className="col-span-1 flex h-[260px]">
        <FootballCard_GateStatus className="flex-1" />
      </div>

      <div className="col-span-1 flex h-[260px]">
        <FootballCard_Transport className="flex-1" />
      </div>
    </div>
  )
}


