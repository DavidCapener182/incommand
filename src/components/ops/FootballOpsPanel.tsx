'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function FootballOpsPanel() {
  const [payload, setPayload] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/football/updateManual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides: payload })
      })
      if (!res.ok) throw new Error('Failed to save')
    } catch (e: any) {
      setError(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Football Ops Panel (Manual Overrides)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1">Home Score</label>
            <input className="w-full border rounded px-2 py-1"
              type="number"
              onChange={(e) => setPayload((p: any) => ({ ...p, liveScore: { ...(p.liveScore||{}), home: Number(e.target.value) } }))} />
          </div>
          <div>
            <label className="block text-xs mb-1">Away Score</label>
            <input className="w-full border rounded px-2 py-1"
              type="number"
              onChange={(e) => setPayload((p: any) => ({ ...p, liveScore: { ...(p.liveScore||{}), away: Number(e.target.value) } }))} />
          </div>
          <div>
            <label className="block text-xs mb-1">Time (mm:ss)</label>
            <input className="w-full border rounded px-2 py-1"
              type="text"
              onChange={(e) => setPayload((p: any) => ({ ...p, liveScore: { ...(p.liveScore||{}), time: e.target.value } }))} />
          </div>
          <div>
            <label className="block text-xs mb-1">Phase</label>
            <select className="w-full border rounded px-2 py-1"
              onChange={(e) => setPayload((p: any) => ({ ...p, liveScore: { ...(p.liveScore||{}), phase: e.target.value } }))}>
              <option>Pre-Match</option>
              <option>First Half</option>
              <option>Half-Time</option>
              <option>Second Half</option>
              <option>Full Time</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1">Yellow Cards</label>
            <input className="w-full border rounded px-2 py-1" type="number"
              onChange={(e) => setPayload((p: any) => ({ ...p, liveScore: { ...(p.liveScore||{}), cards: { ...(p.liveScore?.cards||{}), yellow: Number(e.target.value) } } }))} />
          </div>
          <div>
            <label className="block text-xs mb-1">Red Cards</label>
            <input className="w-full border rounded px-2 py-1" type="number"
              onChange={(e) => setPayload((p: any) => ({ ...p, liveScore: { ...(p.liveScore||{}), cards: { ...(p.liveScore?.cards||{}), red: Number(e.target.value) } } }))} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs mb-1">Active Turnstiles</label>
            <input className="w-full border rounded px-2 py-1" type="number"
              onChange={(e) => setPayload((p: any) => ({ ...p, gateStatus: { ...(p.gateStatus||{}), activeTurnstiles: Number(e.target.value) } }))} />
          </div>
        </div>

        {error && <div className="text-xs text-red-600">{error}</div>}
        <button onClick={submit} disabled={saving} className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs">
          {saving ? 'Saving…' : 'Save Overrides'}
        </button>
      </CardContent>
    </Card>
  )
}


