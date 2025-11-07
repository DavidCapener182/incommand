'use client'

import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StandsSetup, StandConfig } from '@/types/football'
import { Plus, Trash2, GripVertical } from 'lucide-react'

interface StandOccupancyModalProps {
  onSave?: () => void
}

// Current Tab Component
export function StandOccupancyCurrent({ onSave }: StandOccupancyModalProps) {
  const [standsSetup, setStandsSetup] = useState<StandsSetup | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingStand, setEditingStand] = useState<string | null>(null)
  const [newStand, setNewStand] = useState<Partial<StandConfig>>({ name: '', capacity: 0 })
  const [thresholds, setThresholds] = useState({
    default_green_threshold: 90,
    default_amber_threshold: 97,
    default_red_threshold: 100,
    stand_overrides: {} as Record<string, { amber?: number; red?: number }>
  })

  useEffect(() => {
    loadData()
    loadThresholds()
  }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/football/stands?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (res.ok) {
        const data = await res.json()
        setStandsSetup(data.standsSetup)
      }
    } catch (error) {
      console.error('Failed to load stands data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadThresholds = async () => {
    try {
      const res = await fetch('/api/football/thresholds?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (res.ok) {
        const data = await res.json()
        setThresholds({
          default_green_threshold: data.default_green_threshold || 90,
          default_amber_threshold: data.default_amber_threshold || 97,
          default_red_threshold: data.default_red_threshold || 100,
          stand_overrides: data.stand_overrides || {}
        })
      }
    } catch (error) {
      console.error('Failed to load thresholds:', error)
    }
  }

  const getColorForStand = (standName: string, percent: number): string => {
    const override = thresholds.stand_overrides[standName]
    const amberThreshold = override?.amber ?? thresholds.default_amber_threshold
    const redThreshold = override?.red ?? thresholds.default_red_threshold
    const greenThreshold = thresholds.default_green_threshold

    if (percent >= redThreshold) return 'bg-red-500'
    if (percent >= amberThreshold) return 'bg-amber-500'
    if (percent >= greenThreshold) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const handleSave = async () => {
    if (!standsSetup) return
    
    setSaving(true)
    try {
      await fetch('/api/football/stands', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standsSetup }),
      })
      onSave?.()
    } catch (error) {
      console.error('Failed to save stands setup:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCurrentOccupancyChange = async (standId: string, current: number) => {
    if (!standsSetup) return

    const updatedStands = standsSetup.stands.map(stand =>
      stand.id === standId ? { ...stand, current } : stand
    )
    
    setStandsSetup({ ...standsSetup, stands: updatedStands })

    // Auto-save current occupancy
    try {
      await fetch('/api/football/stands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standId, current }),
      })
    } catch (error) {
      console.error('Failed to auto-save occupancy:', error)
    }
  }

  const addStand = () => {
    if (!standsSetup || !newStand.name || newStand.capacity === 0) return

    const stand: StandConfig = {
      id: `stand-${Date.now()}`,
      name: newStand.name,
      capacity: newStand.capacity || 0,
      order: standsSetup.stands.length + 1,
    }

    const updatedStands = [...standsSetup.stands, stand]
    const totalCapacity = updatedStands.reduce((sum, s) => sum + s.capacity, 0)
    
    setStandsSetup({
      ...standsSetup,
      stands: updatedStands,
      totalCapacity,
    })

    setNewStand({ name: '', capacity: 0 })
  }

  const removeStand = (standId: string) => {
    if (!standsSetup) return

    const updatedStands = standsSetup.stands.filter(s => s.id !== standId)
    const totalCapacity = updatedStands.reduce((sum, s) => sum + s.capacity, 0)
    
    setStandsSetup({
      ...standsSetup,
      stands: updatedStands,
      totalCapacity,
    })
  }

  const updateStand = (standId: string, updates: Partial<StandConfig>) => {
    if (!standsSetup) return

    const updatedStands = standsSetup.stands.map(stand =>
      stand.id === standId ? { ...stand, ...updates } : stand
    )
    const totalCapacity = updatedStands.reduce((sum, s) => sum + s.capacity, 0)
    
    setStandsSetup({
      ...standsSetup,
      stands: updatedStands,
      totalCapacity,
    })
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  if (!standsSetup) {
    return <div className="p-4 text-center text-red-600">Failed to load stands data</div>
  }

  const currentTab = (
    <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-200px)] pr-2">
      <div className="text-sm text-muted-foreground mb-4">
        Edit live occupancy numbers. Changes are saved automatically.
      </div>
      
      {standsSetup.stands.map((stand) => {
        const percent = stand.capacity ? Math.min(100, ((stand.current || 0) / stand.capacity) * 100) : 0
        const colorClass = getColorForStand(stand.name, percent)
        
        return (
          <div key={stand.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">{stand.name}</h4>
              <span className="text-sm text-muted-foreground">
                {stand.current || 0} / {stand.capacity.toLocaleString()}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={stand.current || 0}
                  onChange={(e) => handleCurrentOccupancyChange(stand.id, parseInt(e.target.value) || 0)}
                  className="w-32"
                  min="0"
                  max={stand.capacity}
                />
                <span className="text-sm text-muted-foreground self-center">people</span>
              </div>
              
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-2 ${colorClass} rounded-full transition-all duration-300`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
              
              <div className="text-xs text-muted-foreground">
                {percent.toFixed(1)}% occupied
              </div>
            </div>
          </div>
        )
      })}
      
      <div className="border-t pt-4">
        <div className="text-sm font-medium">
          Total: {standsSetup.stands.reduce((sum, s) => sum + (s.current || 0), 0).toLocaleString()} / {standsSetup.totalCapacity.toLocaleString()}
        </div>
      </div>
    </div>
  )

  const setupTab = (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Configure stand names, capacities, and order. Changes require explicit save.
      </div>
      
      {/* Add new stand */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium mb-3">Add New Stand</h4>
        <div className="flex gap-2">
          <Input
            placeholder="Stand name"
            value={newStand.name || ''}
            onChange={(e) => setNewStand({ ...newStand, name: e.target.value })}
            className="flex-1"
          />
          <Input
            type="number"
            placeholder="Capacity"
            value={newStand.capacity || ''}
            onChange={(e) => setNewStand({ ...newStand, capacity: parseInt(e.target.value) || 0 })}
            className="w-32"
            min="1"
          />
          <Button onClick={addStand} disabled={!newStand.name || newStand.capacity === 0}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
      
      {/* Stands list */}
      <div className="space-y-2">
        {standsSetup.stands.map((stand, index) => (
          <div key={stand.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">#{index + 1}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Name</label>
                <Input
                  value={stand.name}
                  onChange={(e) => updateStand(stand.id, { name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Capacity</label>
                <Input
                  type="number"
                  value={stand.capacity}
                  onChange={(e) => updateStand(stand.id, { capacity: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                  min="1"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeStand(stand.id)}
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
          Total Stadium Capacity: {standsSetup.totalCapacity.toLocaleString()}
        </div>
      </div>
    </div>
  )

  return currentTab
}

// Setup Tab Component
export function StandOccupancySetup({ onSave }: StandOccupancyModalProps) {
  const [standsSetup, setStandsSetup] = useState<StandsSetup | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newStand, setNewStand] = useState<Partial<StandConfig>>({ name: '', capacity: 0 })
  const [thresholds, setThresholds] = useState({
    default_green_threshold: 90,
    default_amber_threshold: 97,
    default_red_threshold: 100,
    stand_overrides: {} as Record<string, { amber?: number; red?: number }>
  })
  const [editingStandOverride, setEditingStandOverride] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const res = await fetch('/api/football/stands?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (res.ok) {
        const data = await res.json()
        setStandsSetup(data.standsSetup)
      }
    } catch (error) {
      console.error('Failed to load stands data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadThresholds = async () => {
    try {
      const res = await fetch('/api/football/thresholds?company_id=550e8400-e29b-41d4-a716-446655440000&event_id=550e8400-e29b-41d4-a716-446655440001')
      if (res.ok) {
        const data = await res.json()
        setThresholds({
          default_green_threshold: data.default_green_threshold || 90,
          default_amber_threshold: data.default_amber_threshold || 97,
          default_red_threshold: data.default_red_threshold || 100,
          stand_overrides: data.stand_overrides || {}
        })
      }
    } catch (error) {
      console.error('Failed to load thresholds:', error)
    }
  }

  useEffect(() => {
    loadData()
    loadThresholds()
  }, [])

  const saveThresholds = async () => {
    setSaving(true)
    try {
      await fetch('/api/football/thresholds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_green_threshold: thresholds.default_green_threshold,
          default_amber_threshold: thresholds.default_amber_threshold,
          default_red_threshold: thresholds.default_red_threshold,
          stand_overrides: thresholds.stand_overrides
        }),
      })
      onSave?.()
    } catch (error) {
      console.error('Failed to save thresholds:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!standsSetup) return
    
    setSaving(true)
    try {
      await fetch('/api/football/stands', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standsSetup }),
      })
      onSave?.()
    } catch (error) {
      console.error('Failed to save stands setup:', error)
    } finally {
      setSaving(false)
    }
  }

  const addStand = () => {
    if (!standsSetup || !newStand.name || newStand.capacity === 0) return

    const stand: StandConfig = {
      id: `stand-${Date.now()}`,
      name: newStand.name,
      capacity: newStand.capacity || 0,
      order: standsSetup.stands.length + 1,
    }

    const updatedStands = [...standsSetup.stands, stand]
    const totalCapacity = updatedStands.reduce((sum, s) => sum + s.capacity, 0)
    
    setStandsSetup({
      ...standsSetup,
      stands: updatedStands,
      totalCapacity,
    })

    setNewStand({ name: '', capacity: 0 })
  }

  const removeStand = (standId: string) => {
    if (!standsSetup) return

    const updatedStands = standsSetup.stands.filter(s => s.id !== standId)
    const totalCapacity = updatedStands.reduce((sum, s) => sum + s.capacity, 0)
    
    setStandsSetup({
      ...standsSetup,
      stands: updatedStands,
      totalCapacity,
    })
  }

  const updateStand = (standId: string, updates: Partial<StandConfig>) => {
    if (!standsSetup) return

    const updatedStands = standsSetup.stands.map(stand =>
      stand.id === standId ? { ...stand, ...updates } : stand
    )
    const totalCapacity = updatedStands.reduce((sum, s) => sum + s.capacity, 0)
    
    setStandsSetup({
      ...standsSetup,
      stands: updatedStands,
      totalCapacity,
    })
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  if (!standsSetup) {
    return <div className="p-4 text-center text-red-600">Failed to load stands data</div>
  }

  return (
    <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-200px)] pr-2">
      {/* Threshold Configuration Section */}
      <div className="border rounded-lg p-4 space-y-4">
        <div>
          <h4 className="font-medium mb-1">Occupancy Thresholds</h4>
          <p className="text-xs text-muted-foreground">
            Configure color thresholds for occupancy indicators. Stands below green threshold show green, 
            between green and amber show amber, above amber show red.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Green Threshold (%)</label>
            <Input
              type="number"
              value={thresholds.default_green_threshold}
              onChange={(e) => setThresholds({
                ...thresholds,
                default_green_threshold: parseInt(e.target.value) || 90
              })}
              min="0"
              max="100"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">Below this: Green</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Amber Threshold (%)</label>
            <Input
              type="number"
              value={thresholds.default_amber_threshold}
              onChange={(e) => setThresholds({
                ...thresholds,
                default_amber_threshold: parseInt(e.target.value) || 97
              })}
              min="0"
              max="100"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">Green to this: Amber</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Red Threshold (%)</label>
            <Input
              type="number"
              value={thresholds.default_red_threshold}
              onChange={(e) => setThresholds({
                ...thresholds,
                default_red_threshold: parseInt(e.target.value) || 100
              })}
              min="0"
              max="100"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">Above amber: Red</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={saveThresholds} size="sm">
            Save Thresholds
          </Button>
        </div>

        {/* Stand-specific overrides */}
        {standsSetup && standsSetup.stands.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h5 className="text-sm font-medium mb-2">Stand-Specific Overrides</h5>
            <p className="text-xs text-muted-foreground mb-3">
              Override thresholds for specific stands. Leave empty to use defaults.
            </p>
            <div className="space-y-2">
              {standsSetup.stands.map((stand) => {
                const override = thresholds.stand_overrides[stand.name] || {}
                const isEditing = editingStandOverride === stand.name
                
                return (
                  <div key={stand.id} className="border rounded p-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{stand.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingStandOverride(isEditing ? null : stand.name)}
                      >
                        {isEditing ? 'Done' : 'Override'}
                      </Button>
                    </div>
                    {isEditing && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Amber Threshold</label>
                          <Input
                            type="number"
                            value={override.amber || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseInt(e.target.value) : undefined
                              setThresholds({
                                ...thresholds,
                                stand_overrides: {
                                  ...thresholds.stand_overrides,
                                  [stand.name]: {
                                    ...override,
                                    amber: value
                                  }
                                }
                              })
                            }}
                            placeholder={`Default: ${thresholds.default_amber_threshold}`}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Red Threshold</label>
                          <Input
                            type="number"
                            value={override.red || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseInt(e.target.value) : undefined
                              setThresholds({
                                ...thresholds,
                                stand_overrides: {
                                  ...thresholds.stand_overrides,
                                  [stand.name]: {
                                    ...override,
                                    red: value
                                  }
                                }
                              })
                            }}
                            placeholder={`Default: ${thresholds.default_red_threshold}`}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Stand Configuration Section */}
      <div className="border rounded-lg p-4">
      <div className="text-sm text-muted-foreground mb-4">
        Configure stand names, capacities, and order. Changes require explicit save.
      </div>
      
      {/* Add new stand */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium mb-3">Add New Stand</h4>
        <div className="flex gap-2">
          <Input
            placeholder="Stand name"
            value={newStand.name || ''}
            onChange={(e) => setNewStand({ ...newStand, name: e.target.value })}
            className="flex-1"
          />
          <Input
            type="number"
            placeholder="Capacity"
            value={newStand.capacity || ''}
            onChange={(e) => setNewStand({ ...newStand, capacity: parseInt(e.target.value) || 0 })}
            className="w-32"
            min="1"
          />
          <Button onClick={addStand} disabled={!newStand.name || newStand.capacity === 0}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
      
      {/* Stands list */}
      <div className="space-y-2">
        {standsSetup.stands.map((stand, index) => (
          <div key={stand.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">#{index + 1}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Name</label>
                <Input
                  value={stand.name}
                  onChange={(e) => updateStand(stand.id, { name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Capacity</label>
                <Input
                  type="number"
                  value={stand.capacity}
                  onChange={(e) => updateStand(stand.id, { capacity: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                  min="1"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeStand(stand.id)}
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
          Total Stadium Capacity: {standsSetup.totalCapacity.toLocaleString()}
        </div>
        </div>
      </div>
    </div>
  )
}
