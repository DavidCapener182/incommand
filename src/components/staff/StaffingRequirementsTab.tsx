'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { StaffingDiscipline } from '@/lib/database/staffing'
import { DISCIPLINE_META, resolveDisciplines } from '@/lib/staffing/discipline'
import { Card } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

interface StaffingRequirementsTabProps {
  eventId?: string | null
  companyId?: string | null
  eventType?: string | null
}

interface DisciplineRoleState {
  id: string | null
  discipline: StaffingDiscipline
  planned_count: number
  actual_count: number
  label: string
}

const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 })
const signedNumberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
  signDisplay: 'exceptZero',
})

export function StaffingRequirementsTab({ eventId, companyId, eventType }: StaffingRequirementsTabProps) {
  const [roles, setRoles] = useState<DisciplineRoleState[]>([])
  const [activeDiscipline, setActiveDiscipline] = useState<StaffingDiscipline>('security')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const requiredDisciplines = useMemo(() => resolveDisciplines(eventType), [eventType])

  useEffect(() => {
    if (!eventId || !companyId) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [{ data: roleRows, error: rolesError }, { data: actualRows, error: actualsError }] = await Promise.all([
          (supabase as any)
            .from('staffing_roles')
            .select('id, discipline, planned_count')
            .eq('company_id', companyId)
            .eq('event_id', eventId),
          (supabase as any)
            .from('staffing_actuals')
            .select('role_id, actual_count')
            .eq('company_id', companyId)
            .eq('event_id', eventId),
        ])

        if (rolesError) throw rolesError
        if (actualsError) throw actualsError

        const actualRowsArray = (actualRows ?? []) as any[];
        const roleRowsArray = (roleRows ?? []) as any[];
        const actualMap = new Map(actualRowsArray.map((row: any) => [row.role_id, row.actual_count ?? 0]))
        const existingRoles = roleRowsArray.map((role: any) => {
          const discipline = (role.discipline as StaffingDiscipline) || 'security'
          return {
            id: role.id,
            discipline,
            planned_count: role.planned_count ?? 0,
            actual_count: actualMap.get(role.id) ?? 0,
            label: DISCIPLINE_META[discipline].label,
          }
        })

        const merged: DisciplineRoleState[] = requiredDisciplines.map((discipline) => {
          const match = existingRoles.find((role) => role.discipline === discipline)
          return (
            match ?? {
              id: null,
              discipline,
              planned_count: 0,
              actual_count: 0,
              label: DISCIPLINE_META[discipline].label,
            }
          )
        })

        setRoles(merged)
        setActiveDiscipline(merged[0]?.discipline ?? 'security')
      } catch (err: any) {
        console.error('Failed to load staffing roles', err)
        setError('Unable to load staffing requirements for this event.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [companyId, eventId, requiredDisciplines])

  const selectedRole = roles.find((role) => role.discipline === activeDiscipline)

  const mutateRole = (discipline: StaffingDiscipline, partial: Partial<DisciplineRoleState>) => {
    setRoles((prev) =>
      prev.map((role) => (role.discipline === discipline ? { ...role, ...partial } : role))
    )
  }

  const savePlannedCount = async (role: DisciplineRoleState, value: number) => {
    if (!eventId || !companyId) return
    setSaving('planned')
    setError(null)
    try {
      if (role.id) {
        const { error: updateError } = await (supabase as any)
          .from('staffing_roles')
          .update({ planned_count: value })
          .eq('id', (role as any).id)
          .eq('company_id', companyId)
          .eq('event_id', eventId)

        if (updateError) throw updateError
      } else {
        const { data: inserted, error: insertError } = await (supabase as any)
          .from('staffing_roles')
          .insert({
            company_id: companyId,
            event_id: eventId,
            name: DISCIPLINE_META[role.discipline].label,
            planned_count: value,
            discipline: role.discipline,
            icon: DISCIPLINE_META[role.discipline].icon,
            color: DISCIPLINE_META[role.discipline].color,
          })
          .select()
          .single()

        if (insertError) throw insertError
        mutateRole(role.discipline, { id: inserted.id })
      }
    } catch (err: any) {
      console.error('Failed to update planned staffing count', err)
      setError('Unable to save requested staffing count. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  const saveActualCount = async (role: DisciplineRoleState, value: number) => {
    if (!eventId || !companyId) return
    if (!role.id) {
      await savePlannedCount(role, role.planned_count)
    }
    setSaving('actual')
    setError(null)
    try {
      if (!role.id) {
        throw new Error('Role ID is required')
      }

      const { data: existing, error: selectError } = await (supabase as any)
        .from('staffing_actuals')
        .select('id')
        .eq('company_id', companyId)
        .eq('event_id', eventId)
        .eq('role_id', (role as any).id)
        .maybeSingle()

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError
      }

      const existingData = existing as any;
      if (existingData) {
        const { error: updateError } = await (supabase as any)
          .from('staffing_actuals')
          .update({ actual_count: value, recorded_at: new Date().toISOString() })
          .eq('id', existingData.id)

        if (updateError) throw updateError
      } else {
        if (!companyId) {
          throw new Error('Company ID is required')
        }
        const { error: insertError } = await (supabase as any).from('staffing_actuals').insert({
          company_id: companyId,
          event_id: eventId,
          role_id: (role as any).id,
          actual_count: value,
          recorded_by: 'staffing-centre',
        })

        if (insertError) throw insertError
      }
    } catch (err: any) {
      console.error('Failed to update actual staffing count', err)
      setError('Unable to save actual staffing count. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  const handleNumberChange = (
    value: string,
    discipline: StaffingDiscipline,
    field: 'planned_count' | 'actual_count'
  ) => {
    const nextValue = Math.max(0, Number(value) || 0)
    mutateRole(discipline, { [field]: nextValue } as Partial<DisciplineRoleState>)
  }

  if (!eventId || !companyId) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Select an event to configure staffing requirements.
        </p>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="flex items-center gap-3 p-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading staffing requirements…</span>
      </Card>
    )
  }

  if (!selectedRole) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">No staffing disciplines configured yet.</p>
      </Card>
    )
  }

  const fulfillment =
    selectedRole.planned_count > 0
      ? Math.round((selectedRole.actual_count / selectedRole.planned_count) * 100)
      : selectedRole.actual_count > 0
        ? 100
        : 0

  const gapCount = selectedRole.actual_count - selectedRole.planned_count

  return (
    <div className="space-y-4">
      {requiredDisciplines.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {requiredDisciplines.map((discipline) => (
            <button
              key={discipline}
              onClick={() => setActiveDiscipline(discipline)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                activeDiscipline === discipline
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-200'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
              }`}
            >
              {DISCIPLINE_META[discipline].label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase text-muted-foreground">Discipline</p>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {selectedRole.label}
            </h3>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
              fulfillment >= 100 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
            }`}
          >
            {fulfillment >= 100 ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {fulfillment}% fulfilled
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Requested Staff
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={selectedRole.planned_count}
                onChange={(event) =>
                  handleNumberChange(event.target.value, selectedRole.discipline, 'planned_count')
                }
                onBlur={() => savePlannedCount(selectedRole, selectedRole.planned_count)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-lg font-semibold shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => savePlannedCount(selectedRole, selectedRole.planned_count)}
                disabled={saving === 'planned'}
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200"
              >
                {saving === 'planned' ? 'Saving…' : 'Save'}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the total number of {selectedRole.label.toLowerCase()} personnel requested for this event.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Confirmed On-Site
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={selectedRole.actual_count}
                onChange={(event) =>
                  handleNumberChange(event.target.value, selectedRole.discipline, 'actual_count')
                }
                onBlur={() => saveActualCount(selectedRole, selectedRole.actual_count)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-lg font-semibold shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={() => saveActualCount(selectedRole, selectedRole.actual_count)}
                disabled={saving === 'actual'}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200"
              >
                {saving === 'actual' ? 'Saving…' : 'Save'}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Track the actual number of {selectedRole.label.toLowerCase()} staff checked in on the day.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-center dark:border-gray-700 dark:bg-gray-900/40">
            <p className="text-xs uppercase text-muted-foreground">Requested</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {numberFormatter.format(selectedRole.planned_count)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-center dark:border-gray-700 dark:bg-gray-900/40">
            <p className="text-xs uppercase text-muted-foreground">Confirmed</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {numberFormatter.format(selectedRole.actual_count)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-center dark:border-gray-700 dark:bg-gray-900/40">
            <p className="text-xs uppercase text-muted-foreground">Gap</p>
            <p
              className={`text-2xl font-bold ${
                gapCount < 0
                  ? 'text-red-600 dark:text-red-300'
                  : gapCount > 0
                    ? 'text-green-600 dark:text-green-300'
                    : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {signedNumberFormatter.format(gapCount)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

