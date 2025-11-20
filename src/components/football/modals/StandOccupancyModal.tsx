'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StandsSetup, StandConfig } from '@/types/football'
import { Plus, Trash2, GripVertical, ChevronDown } from 'lucide-react'
import { useEventContext } from '@/contexts/EventContext'
import { supabase } from '@/lib/supabase'
import { predictStandFlow, type StandFlowPrediction, STAND_COUNTDOWN_OFFSETS } from '@/lib/analytics/crowdFlowPrediction'
import { useCompanyEventContext } from '@/hooks/useCompanyEventContext'

const buildContextQuery = (ctx: { companyId: string; eventId: string }) =>
  `?company_id=${ctx.companyId}&event_id=${ctx.eventId}`

const deriveCountdownBucket = (kickoffTime: Date | null) => {
  if (!kickoffTime) return null
  const minutesToKickoff = Math.round((kickoffTime.getTime() - Date.now()) / 60000)
  if (minutesToKickoff >= 55) return 60
  if (minutesToKickoff >= 45) return 50
  if (minutesToKickoff >= 35) return 40
  if (minutesToKickoff >= 25) return 30
  if (minutesToKickoff >= 15) return 20
  if (minutesToKickoff >= 5) return 10
  if (minutesToKickoff >= 0) return 0
  return null
}

interface StandOccupancyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

// Current Tab Component
function StandOccupancyCurrent({ onSave }: { onSave?: () => void }) {
  const { eventId, eventData } = useEventContext()
  const { context, loading: contextLoading } = useCompanyEventContext(eventId)
  const [standsSetup, setStandsSetup] = useState<StandsSetup | null>(null)
  const [loading, setLoading] = useState(true)
  const [thresholds, setThresholds] = useState({
    default_green_threshold: 90,
    default_amber_threshold: 97,
    default_red_threshold: 100,
    stand_overrides: {} as Record<string, { amber?: number; red?: number }>
  })
  const [standPredictions, setStandPredictions] = useState<Record<string, StandFlowPrediction>>({})
  const [showPredictions, setShowPredictions] = useState(false)

  const kickoffTime = useMemo(() => {
    if (eventData?.start_datetime) {
      return new Date(eventData.start_datetime)
    }
    if (eventData?.event_date && eventData?.main_act_start_time) {
      const time = eventData.main_act_start_time.includes(':')
        ? eventData.main_act_start_time
        : `${eventData.main_act_start_time}:00`
      return new Date(`${eventData.event_date}T${time.length === 5 ? `${time}:00` : time}`)
    }
    return null
  }, [eventData?.start_datetime, eventData?.event_date, eventData?.main_act_start_time])

  const computeHorizonMinutes = useCallback(() => {
    if (!kickoffTime) return 60
    const minutesUntilKickoff = Math.max(0, Math.round((kickoffTime.getTime() - Date.now()) / 60000))
    const padded = Math.ceil(minutesUntilKickoff / 10) * 10 + 10
    return Math.min(Math.max(60, padded), 360)
  }, [kickoffTime])

  const loadData = useCallback(async (ctx: { companyId: string; eventId: string }) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/football/stands${buildContextQuery(ctx)}`)
      if (res.ok) {
        const data = await res.json()
        setStandsSetup(data.standsSetup)

        if (eventId && data.standsSetup?.stands) {
          const predictions: Record<string, StandFlowPrediction> = {}
          const horizonMinutes = computeHorizonMinutes()
          for (const stand of data.standsSetup.stands) {
            try {
              const prediction = await predictStandFlow(
                supabase,
                eventId,
                stand.id,
                stand.name,
                stand.capacity,
                horizonMinutes,
                stand.current || 0,
                ctx.companyId,
                kickoffTime || undefined
              )
              predictions[stand.name] = prediction
            } catch (err) {
              console.error(`Failed to predict flow for stand ${stand.name}:`, err)
            }
          }
          setStandPredictions(predictions)
        }
      }
    } catch (error) {
      console.error('Failed to load stands data:', error)
    } finally {
      setLoading(false)
    }
  }, [eventId, computeHorizonMinutes])

  const loadThresholds = useCallback(async (ctx: { companyId: string; eventId: string }) => {
    try {
      const res = await fetch(`/api/football/thresholds${buildContextQuery(ctx)}`)
      if (res.ok) {
        const data = await res.json()
        setThresholds({
          default_green_threshold: data.default_green_threshold || 90,
          default_amber_threshold: data.default_amber_threshold || 97,
          default_red_threshold: data.default_red_threshold || 100,
          stand_overrides: data.stand_overrides || {},
        })
      }
    } catch (error) {
      console.error('Failed to load thresholds:', error)
    }
  }, [])

  useEffect(() => {
    if (!context) return
    loadData(context)
    loadThresholds(context)
  }, [context, kickoffTime, computeHorizonMinutes, loadData, loadThresholds])

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

  const handleCurrentOccupancyChange = async (standId: string, current: number) => {
    if (!standsSetup || !context) return

    const bucket = deriveCountdownBucket(kickoffTime)

    const updatedStands = standsSetup.stands.map((stand) =>
      stand.id === standId
        ? {
            ...stand,
            current,
            snapshots:
              bucket == null
                ? stand.snapshots
                : {
                    ...(stand.snapshots ?? {}),
                    [bucket]: current,
                  },
          }
        : stand
    )

    setStandsSetup({ ...standsSetup, stands: updatedStands })

    try {
      await fetch(`/api/football/stands${buildContextQuery(context)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          standId,
          occupancy: current,
          recordedBy: 'stand-occupancy',
          countdownBucket: bucket,
        }),
      })
    } catch (error) {
      console.error('Failed to auto-save occupancy:', error)
    }
  }

  const countdownOffsets = useMemo(
    () => STAND_COUNTDOWN_OFFSETS.filter((offset) => offset >= 0).sort((a, b) => b - a),
    []
  )

  const countdownSummary = useMemo(() => {
    if (!standsSetup?.stands?.length) return []

    return countdownOffsets
      .map((offset) => {
        let totalPredicted = 0
        let totalCapacity = 0
        let contributing = 0

        for (const stand of standsSetup.stands) {
          totalCapacity += stand.capacity || 0
          const snapshotValue = stand.snapshots?.[offset] ?? null
          if (snapshotValue != null) {
            totalPredicted += snapshotValue
            contributing++
            continue
          }

          const prediction = standPredictions[stand.name]?.predictedOccupancy.find(
            (entry) => entry.minutesAhead === offset
          )
          if (prediction) {
            totalPredicted += prediction.predictedOccupancy
            contributing++
          }
        }

        if (contributing === 0 || totalCapacity === 0) {
          return null
        }

        return {
          key: offset,
          label: offset === 0 ? 'Kick-off' : `${offset}m to KO`,
          timeLabel: kickoffTime
            ? new Date(kickoffTime.getTime() - offset * 60000).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : undefined,
          occupancy: Math.round(totalPredicted),
          percentage: Math.min(100, Math.round((totalPredicted / totalCapacity) * 100)),
        }
      })
      .filter(Boolean) as Array<{
        key: number
        label: string
        timeLabel?: string
        occupancy: number
        percentage: number
      }>
  }, [standsSetup, standPredictions, kickoffTime, countdownOffsets])

  const standPredictionRows = useMemo(() => {
    if (!standsSetup?.stands?.length) return []
    return standsSetup.stands.map((stand) => ({
      id: stand.id,
      name: stand.name,
      capacity: stand.capacity,
      snapshots: stand.snapshots ?? {},
      predictions: standPredictions[stand.name]?.predictedOccupancy ?? [],
    }))
  }, [standsSetup, standPredictions])

  if (contextLoading || !context) {
    return <div className="p-4 text-center">Loading event context…</div>
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  if (!standsSetup) {
    return <div className="p-4 text-center text-red-600">Failed to load stands data</div>
  }

  return (
    <div className="space-y-4 pr-2">
      <div className="text-sm text-muted-foreground mb-4">
        Edit live occupancy numbers. Changes are saved automatically.
      </div>
      
      {countdownSummary.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-muted/30">
          <button
            type="button"
            onClick={() => setShowPredictions((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
          >
            <span>Predicted attendance (countdown to kick-off)</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showPredictions ? 'rotate-180' : ''}`}
            />
          </button>
          {showPredictions && (
            <div className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:grid-cols-3">
                {countdownSummary.map((entry) => (
                  <div key={entry.key} className="flex items-center justify-between text-gray-900 dark:text-gray-100">
                    <span className="text-gray-600 dark:text-gray-300">
                      {entry.label}{' '}
                      {entry.timeLabel && <span className="text-muted-foreground text-xs">({entry.timeLabel})</span>}
                    </span>
                    <span className="font-semibold">
                      {entry.occupancy.toLocaleString()} ({entry.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {standPredictionRows.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-900/20 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-semibold py-1 pr-4">Stand</th>
                {countdownOffsets.map((offset) => (
                  <th key={offset} className="text-right font-semibold px-2">
                    {offset === 0 ? 'KO' : `${offset}m`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {standPredictionRows.map((row) => (
                <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-1 pr-4 font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                  {countdownOffsets.map((offset) => {
                    const snapshotValue = row.snapshots?.[offset] ?? null
                    const entry = row.predictions.find((prediction) => prediction.minutesAhead === offset)
                    const displayValue = snapshotValue ?? entry?.predictedOccupancy ?? null
                    const percentage =
                      displayValue != null && row.capacity > 0
                        ? Math.min(100, (displayValue / row.capacity) * 100)
                        : null

                    return (
                      <td key={offset} className="text-right px-2 py-1 text-gray-700 dark:text-gray-200">
                        {displayValue != null && percentage != null
                          ? `${displayValue.toLocaleString()} (${percentage.toFixed(0)}%)${
                              snapshotValue != null ? ' • actual' : ''
                            }`
                          : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="grid gap-2 md:grid-cols-2">
        {standsSetup.stands.map((stand) => {
          const percent = stand.capacity ? Math.min(100, ((stand.current || 0) / stand.capacity) * 100) : 0
          const colorClass = getColorForStand(stand.name, percent)
          const prediction = standPredictions[stand.name]
          const hasHighRisk = prediction?.predictedOccupancy.some(
            (p) => p.riskLevel === 'high' || p.riskLevel === 'critical'
          )

          return (
            <div key={stand.id} className="border rounded-lg p-2.5 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                  {stand.name}
                  {hasHighRisk && <span className="text-amber-500 text-xs">⚠</span>}
                </div>
                <div className="flex items-center gap-1 ml-auto text-sm text-gray-600">
                  <Input
                    type="number"
                    value={stand.current || 0}
                    onChange={(e) => handleCurrentOccupancyChange(stand.id, parseInt(e.target.value) || 0)}
                    className="h-7 w-24 text-sm"
                    min="0"
                    max={stand.capacity}
                  />
                  <span>people</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {stand.current?.toLocaleString() || 0} / {stand.capacity.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colorClass} rounded-full transition-all duration-300`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>

              <div className="text-[11px] text-muted-foreground flex flex-wrap gap-2">
                <span className="font-semibold text-gray-900">{percent.toFixed(1)}% occupied</span>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="border-t pt-4">
        <div className="text-sm font-medium">
          Total: {standsSetup.stands.reduce((sum, s) => sum + (s.current || 0), 0).toLocaleString()} / {standsSetup.totalCapacity.toLocaleString()}
        </div>
      </div>
    </div>
  )
}

// Setup Tab Component
function StandOccupancySetup({ onSave }: { onSave?: () => void }) {
  const { eventId, eventData } = useEventContext()
  const { context } = useCompanyEventContext(eventId)
  const [standsSetup, setStandsSetup] = useState<StandsSetup | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newStand, setNewStand] = useState<Partial<StandConfig>>({ name: '', capacity: 0 })
  const [initialStands, setInitialStands] = useState<StandConfig[]>([])
  const [thresholds, setThresholds] = useState({
    default_green_threshold: 90,
    default_amber_threshold: 97,
    default_red_threshold: 100,
    stand_overrides: {} as Record<string, { amber?: number; red?: number }>
  })
  const [editingStandOverride, setEditingStandOverride] = useState<string | null>(null)

  const loadData = async (ctx: { companyId: string; eventId: string }) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/football/stands${buildContextQuery(ctx)}`)
      if (res.ok) {
        const data = await res.json()
        setStandsSetup(data.standsSetup)
        setInitialStands(data.standsSetup?.stands ?? [])
      }
    } catch (error) {
      console.error('Failed to load stands data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadThresholds = async (ctx: { companyId: string; eventId: string }) => {
    try {
      const res = await fetch(`/api/football/thresholds${buildContextQuery(ctx)}`)
      if (res.ok) {
        const data = await res.json()
        setThresholds({
          default_green_threshold: data.default_green_threshold || 90,
          default_amber_threshold: data.default_amber_threshold || 97,
          default_red_threshold: data.default_red_threshold || 100,
          stand_overrides: data.stand_overrides || {},
        })
      }
    } catch (error) {
      console.error('Failed to load thresholds:', error)
    }
  }

  useEffect(() => {
    if (!context) return
    loadData(context)
    loadThresholds(context)
  }, [context])

  const saveThresholds = async () => {
    if (!context) return
    setSaving(true)
    try {
      await fetch(`/api/football/thresholds${buildContextQuery(context)}`, {
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
    if (!standsSetup || !context) return

    setSaving(true)
    const query = buildContextQuery(context)
    try {
      // Handle Create/Update
      for (const [index, stand] of standsSetup.stands.entries()) {
        const payload = {
          id: stand.id,
          name: stand.name,
          capacity: stand.capacity,
          order_index: stand.order ?? index + 1,
        }

        const action: 'create' | 'update' =
          !stand.id || stand.id.startsWith('stand-') || !initialStands.find((s) => s.id === stand.id)
            ? 'create'
            : 'update'

        const res = await fetch(`/api/football/stands${query}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            data: payload,
          }),
        })

        if (!res.ok) {
          const msg = await res.text()
          throw new Error(`Failed to ${action} stand ${stand.name}: ${res.status} ${msg}`)
        }
      }

      // Handle Deletions
      for (const stand of initialStands) {
        if (!standsSetup.stands.find((s) => s.id === stand.id)) {
          const res = await fetch(`/api/football/stands${query}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'delete',
              data: { id: stand.id },
            }),
          })
          if (!res.ok) {
            const msg = await res.text()
            throw new Error(`Failed to delete stand ${stand.name}: ${res.status} ${msg}`)
          }
        }
      }

      await loadData(context)
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
    setStandsSetup({ ...standsSetup, stands: updatedStands, totalCapacity })
  }

  const updateStand = (standId: string, updates: Partial<StandConfig>) => {
    if (!standsSetup) return
    const updatedStands = standsSetup.stands.map(stand =>
      stand.id === standId ? { ...stand, ...updates } : stand
    )
    const totalCapacity = updatedStands.reduce((sum, s) => sum + s.capacity, 0)
    setStandsSetup({ ...standsSetup, stands: updatedStands, totalCapacity })
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
            Configure color thresholds for occupancy indicators.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Green Threshold (%)</label>
            <Input
              type="number"
              value={thresholds.default_green_threshold}
              onChange={(e) => setThresholds({ ...thresholds, default_green_threshold: parseInt(e.target.value) || 90 })}
              min="0"
              max="100"
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Amber Threshold (%)</label>
            <Input
              type="number"
              value={thresholds.default_amber_threshold}
              onChange={(e) => setThresholds({ ...thresholds, default_amber_threshold: parseInt(e.target.value) || 97 })}
              min="0"
              max="100"
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Red Threshold (%)</label>
            <Input
              type="number"
              value={thresholds.default_red_threshold}
              onChange={(e) => setThresholds({ ...thresholds, default_red_threshold: parseInt(e.target.value) || 100 })}
              min="0"
              max="100"
              className="w-full"
            />
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
                                  [stand.name]: { ...override, amber: value }
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
                                  [stand.name]: { ...override, red: value }
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
        <div className="flex items-start justify-between gap-4 mb-4">
          <p className="text-sm text-muted-foreground">
            Configure stand names, capacities, and order. Use the modal Save Changes button to persist updates.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => context && loadData(context)}
            disabled={saving}
          >
            Reset
          </Button>
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
      
      {/* Save Button for Setup Changes */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving Changes...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  )
}

// Main Modal Component
export default function StandOccupancyModal({ isOpen, onClose, onSave }: StandOccupancyModalProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'current' | 'setup'>('current')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || typeof document === 'undefined') {
    return <></>
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9998]"
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stand-occupancy-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                <h2 id="stand-occupancy-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
                  Stand Occupancy
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'current' | 'setup')} className="flex flex-col h-full">
                  <div className="px-6 pt-4 shrink-0">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-lg">
                      <TabsTrigger value="current" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Current Status</TabsTrigger>
                      <TabsTrigger value="setup" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Configuration</TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 pb-6 mt-4 custom-scrollbar">
                    <TabsContent value="current" className="mt-0 h-full">
                      <StandOccupancyCurrent onSave={onSave} />
                    </TabsContent>
                    <TabsContent value="setup" className="mt-0 h-full">
                      <StandOccupancySetup onSave={onSave} />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}