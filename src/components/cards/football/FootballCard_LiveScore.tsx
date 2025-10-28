'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FootballData, FootballPhase } from '@/types/football'

export default function FootballCard_LiveScore({ className }: { className?: string }) {
  const [data, setData] = useState<FootballData | null>(null)
  const matchDuration = 90
  const minutesFromTime = useMemo(() => {
    const t = data?.liveScore.time || '0:00'
    const [mm, ss] = t.split(':').map(Number)
    return (mm || 0) + (ss ? ss / 60 : 0)
  }, [data?.liveScore.time])

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

  const circumference = 2 * Math.PI * 45
  const progress = Math.min(minutesFromTime / matchDuration, 1)

  return (
    <div className={`relative w-full h-full overflow-hidden card-depth bg-gradient-to-br from-green-700/90 to-green-900/90 text-white flex items-center justify-center ${className || ''}`}>
      {/* Perfectly centred pitch SVG */}
      <svg viewBox="0 0 120 72" className="absolute opacity-25" style={{ 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        width: '100%',
        height: '100%'
      }} preserveAspectRatio="xMidYMid meet">
        <rect width="120" height="72" fill="none" stroke="white" strokeWidth="0.5" />
        <line x1="60" y1="0" x2="60" y2="72" stroke="white" strokeWidth="0.5" />
        <circle cx="60" cy="36" r="6" stroke="white" fill="none" strokeWidth="0.5" />
        <rect x="0" y="24" width="6" height="24" stroke="white" fill="none" strokeWidth="0.5" />
        <rect x="114" y="24" width="6" height="24" stroke="white" fill="none" strokeWidth="0.5" />
      </svg>

      {/* Overlay content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full px-4">
        <div className="flex justify-between w-full text-sm text-gray-200 mb-2">
          <span>Fixture</span>
          <span>{data?.liveScore.competition || 'Match'}</span>
        </div>

        {!data ? (
          <div className="text-xs text-gray-200">Loading…</div>
        ) : (
          <>
            <h3 className="text-white font-semibold text-base">{data.liveScore.homeTeam} v {data.liveScore.awayTeam}</h3>
            <div className="flex justify-between w-full text-sm text-gray-300 mb-2">
              <span></span>
              <span>Time: {data.liveScore.time}</span>
            </div>

            {/* Progress Ring directly aligned with centre circle */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 100 100" className="w-full h-full rotate-[-90deg]">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#38bdf8"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-sm font-mono">
                  <span>{Math.floor(minutesFromTime)}'</span>
                </div>
              </div>
            </div>

            {/* Score & phase */}
            <div className="mt-24">
              <p className="text-3xl font-bold">
                {data.liveScore.home} – {data.liveScore.away}
              </p>
              <p className="text-xs text-gray-200">{data.liveScore.phase as FootballPhase}</p>
              <div className="flex justify-around mt-2 text-xs">
                <span>🟨 {data.liveScore.cards.yellow}</span>
                <span>🟥 {data.liveScore.cards.red}</span>
                <span>🔁 {data.liveScore.subs}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}


