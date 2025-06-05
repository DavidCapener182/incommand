import React from 'react'
import IncidentTable from '@/components/IncidentTable'

export default function IncidentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Incidents</h1>
      <IncidentTable />
    </div>
  )
} 