'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FootballData } from '@/types/football'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FootballCard_MedicalPolicingProps {
  className?: string
  onOpenModal?: () => void
}

export default function FootballCard_MedicalPolicing({ className, onOpenModal }: FootballCard_MedicalPolicingProps) {
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

  return (
    <div className={`h-full card-depth flex flex-col justify-between relative ${className || ''}`}>
      {onOpenModal && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-7 w-7 opacity-60 hover:opacity-100 transition-opacity"
          onClick={onOpenModal}
          title="Manage / Edit Details"
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}
      <div>
        <h3 className="text-gray-800 font-semibold text-lg mb-3 pr-10">Staffing Numbers</h3>
        <div className="text-sm text-gray-700 space-y-1">
          {!data ? (
            <div className="text-xs text-gray-500">Loading…</div>
          ) : (
            <>
              <p><strong>Medical Teams:</strong> {data.medicalPolicing.medicalTeams}</p>
              <p><strong>Police Presence:</strong> {data.medicalPolicing.policeDeployed}</p>
              <p><strong>Stewards:</strong> {data.medicalPolicing.stewards}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


