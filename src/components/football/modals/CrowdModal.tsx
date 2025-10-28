'use client'

import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GatesSetup, GateConfig } from '@/types/football'
import { Plus, Trash2, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react'

interface CrowdModalProps {
  onSave?: () => void
}

// Current Tab Component - Live Gate Monitoring
export function CrowdCurrent({ onSave }: CrowdModalProps) {
  const [gatesSetup, setGatesSetup] = useState<GatesSetup | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/football/crowd?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (res.ok) {
        const data = await res.json()
        setGatesSetup(data)
      }
    } catch (error) {
      console.error('Failed to load crowd data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (gateId: string, status: 'active' | 'delayed' | 'closed') => {
    if (!gatesSetup) return

    const updatedGates = gatesSetup.gates.map(gate =>
      gate.id === gateId ? { ...gate, status } : gate
    )
    
    setGatesSetup({ ...gatesSetup, gates: updatedGates })

    // Auto-save status change
    try {
      await fetch('/api/football/crowd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateId, status }),
      })
    } catch (error) {
      console.error('Failed to auto-save gate status:', error)
    }
  }

  const handleEntryRateChange = async (gateId: string, entryRate: number) => {
    if (!gatesSetup) return

    const updatedGates = gatesSetup.gates.map(gate =>
      gate.id === gateId ? { ...gate, entryRate } : gate
    )
    
    setGatesSetup({ ...gatesSetup, gates: updatedGates })

    // Auto-save entry rate change
    try {
      await fetch('/api/football/crowd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateId, entryRate }),
      })
    } catch (error) {
      console.error('Failed to auto-save entry rate:', error)
    }
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  if (!gatesSetup) {
    return <div className="p-4 text-center text-red-600">Failed to load crowd data</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'delayed': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'closed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'delayed': return <Clock className="h-4 w-4" />
      case 'closed': return <AlertTriangle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getCongestionLevel = (entryRate: number, threshold: number) => {
    const percentage = (entryRate / threshold) * 100
    if (percentage >= 90) return { level: 'High', color: 'text-red-600' }
    if (percentage >= 75) return { level: 'Medium', color: 'text-amber-600' }
    return { level: 'Low', color: 'text-green-600' }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Monitor live gate status and crowd flow. Changes are saved automatically.
      </div>
      
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">
            {gatesSetup.gates.filter(g => g.status === 'active').length}
          </div>
          <div className="text-sm text-green-700">Active Gates</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">
            {gatesSetup.gates.filter(g => g.status === 'delayed').length}
          </div>
          <div className="text-sm text-amber-700">Delayed Gates</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-600">
            {gatesSetup.gates.filter(g => g.status === 'closed').length}
          </div>
          <div className="text-sm text-red-700">Closed Gates</div>
        </div>
      </div>

      {/* Gates list */}
      <div className="space-y-3">
        {gatesSetup.gates.map((gate) => {
          const congestion = getCongestionLevel(gate.entryRate, gate.threshold)
          
          return (
            <div key={gate.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{gate.name}</h4>
                  <Badge className={getStatusColor(gate.status)}>
                    {getStatusIcon(gate.status)}
                    <span className="ml-1 capitalize">{gate.status}</span>
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Sensor: {gate.sensorId || 'N/A'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <select
                    value={gate.status}
                    onChange={(e) => handleStatusChange(gate.id, e.target.value as 'active' | 'delayed' | 'closed')}
                    className="w-full px-2 py-1 border rounded text-sm mt-1"
                  >
                    <option value="active">Active</option>
                    <option value="delayed">Delayed</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground">Entry Rate (per hour)</label>
                  <Input
                    type="number"
                    value={gate.entryRate}
                    onChange={(e) => handleEntryRateChange(gate.id, parseInt(e.target.value) || 0)}
                    className="mt-1"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Congestion Level:</span>
                  <span className={`font-medium ${congestion.color}`}>
                    {congestion.level}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      congestion.level === 'High' ? 'bg-red-500' :
                      congestion.level === 'Medium' ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((gate.entryRate / gate.threshold) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {gate.entryRate.toLocaleString()} / {gate.threshold.toLocaleString()} (threshold)
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Setup Tab Component - Gate Configuration
export function CrowdSetup({ onSave }: CrowdModalProps) {
  const [gatesSetup, setGatesSetup] = useState<GatesSetup | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newGate, setNewGate] = useState<Partial<GateConfig>>({ 
    name: '', 
    status: 'active', 
    entryRate: 0, 
    threshold: 10000,
    sensorId: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/football/crowd?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (res.ok) {
        const data = await res.json()
        setGatesSetup(data)
      }
    } catch (error) {
      console.error('Failed to load crowd data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!gatesSetup) return
    
    setSaving(true)
    try {
      await fetch('/api/football/crowd', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gates: gatesSetup.gates }),
      })
      onSave?.()
    } catch (error) {
      console.error('Failed to save gate configuration:', error)
    } finally {
      setSaving(false)
    }
  }

  const addGate = () => {
    if (!gatesSetup || !newGate.name || newGate.entryRate === 0) return

    const gate: GateConfig = {
      id: `gate-${Date.now()}`,
      name: newGate.name,
      status: newGate.status || 'active',
      entryRate: newGate.entryRate || 0,
      threshold: newGate.threshold || 10000,
      sensorId: newGate.sensorId,
    }

    const updatedGates = [...gatesSetup.gates, gate]
    setGatesSetup({ ...gatesSetup, gates: updatedGates })
    setNewGate({ name: '', status: 'active', entryRate: 0, threshold: 10000, sensorId: '' })
  }

  const removeGate = (gateId: string) => {
    if (!gatesSetup) return

    const updatedGates = gatesSetup.gates.filter(g => g.id !== gateId)
    setGatesSetup({ ...gatesSetup, gates: updatedGates })
  }

  const updateGate = (gateId: string, updates: Partial<GateConfig>) => {
    if (!gatesSetup) return

    const updatedGates = gatesSetup.gates.map(gate =>
      gate.id === gateId ? { ...gate, ...updates } : gate
    )
    
    setGatesSetup({ ...gatesSetup, gates: updatedGates })
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  if (!gatesSetup) {
    return <div className="p-4 text-center text-red-600">Failed to load crowd data</div>
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Configure gate names, sensors, and thresholds. Changes require explicit save.
      </div>
      
      {/* Add new gate */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium mb-3">Add New Gate</h4>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Gate name (e.g., Gate A)"
            value={newGate.name || ''}
            onChange={(e) => setNewGate({ ...newGate, name: e.target.value })}
          />
          <Input
            placeholder="Sensor ID (optional)"
            value={newGate.sensorId || ''}
            onChange={(e) => setNewGate({ ...newGate, sensorId: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Entry rate (per hour)"
            value={newGate.entryRate || ''}
            onChange={(e) => setNewGate({ ...newGate, entryRate: parseInt(e.target.value) || 0 })}
            min="0"
          />
          <Input
            type="number"
            placeholder="Threshold (per hour)"
            value={newGate.threshold || ''}
            onChange={(e) => setNewGate({ ...newGate, threshold: parseInt(e.target.value) || 10000 })}
            min="1"
          />
          <Button onClick={addGate} disabled={!newGate.name || newGate.entryRate === 0} className="col-span-2">
            <Plus className="h-4 w-4 mr-1" />
            Add Gate
          </Button>
        </div>
      </div>
      
      {/* Gates list */}
      <div className="space-y-2">
        {gatesSetup.gates.map((gate) => (
          <div key={gate.id} className="border rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Gate Name</label>
                <Input
                  value={gate.name}
                  onChange={(e) => updateGate(gate.id, { name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Sensor ID</label>
                <Input
                  value={gate.sensorId || ''}
                  onChange={(e) => updateGate(gate.id, { sensorId: e.target.value })}
                  className="mt-1"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Entry Rate (per hour)</label>
                <Input
                  type="number"
                  value={gate.entryRate}
                  onChange={(e) => updateGate(gate.id, { entryRate: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Threshold (per hour)</label>
                <Input
                  type="number"
                  value={gate.threshold}
                  onChange={(e) => updateGate(gate.id, { threshold: parseInt(e.target.value) || 10000 })}
                  className="mt-1"
                  min="1"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeGate(gate.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t pt-4">
        <div className="text-sm font-medium">
          Total Gates: {gatesSetup.gates.length}
        </div>
      </div>
    </div>
  )
}
