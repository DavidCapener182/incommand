'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '@/components/Toast'
import type { AssetRecord, MaintenanceSchedule, WorkOrder } from '@/types/maintenance'
import {
  createWorkOrder,
  fetchAssets,
  fetchMaintenanceEventHooks,
  fetchMaintenanceSchedules,
  fetchWorkOrders,
  scheduleMaintenanceCompletion,
  updateWorkOrderStatus,
  type CreateWorkOrderPayload
} from '@/services/maintenanceService'

const defaultWorkOrder: CreateWorkOrderPayload = {
  title: '',
  description: '',
  priority: 'medium',
  asset_id: null,
  schedule_id: null,
  due_date: ''
}

export default function MaintenancePage() {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [assets, setAssets] = useState<AssetRecord[]>([])
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [activeFilter, setActiveFilter] = useState<'open' | 'completed' | 'all'>('open')
  const [creating, setCreating] = useState(false)
  const [formState, setFormState] = useState<CreateWorkOrderPayload>(defaultWorkOrder)
  const [hooksCount, setHooksCount] = useState(0)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [assetData, scheduleData, workOrderData, hooks] = await Promise.all([
        fetchAssets(),
        fetchMaintenanceSchedules(),
        fetchWorkOrders(activeFilter === 'all' ? undefined : activeFilter === 'open' ? 'open' : 'completed'),
        fetchMaintenanceEventHooks()
      ])

      setAssets(assetData)
      setSchedules(scheduleData)
      setWorkOrders(workOrderData)
      setHooksCount(hooks.length)
    } catch (error) {
      console.error(error)
      addToast({
        type: 'error',
        title: 'Unable to load maintenance data',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    } finally {
      setLoading(false)
    }
  }, [activeFilter, addToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredWorkOrders = useMemo(() => {
    if (activeFilter === 'all') {
      return workOrders
    }
    return workOrders.filter((workOrder) => workOrder.status === (activeFilter === 'open' ? 'open' : 'completed'))
  }, [workOrders, activeFilter])

  const handleCreateWorkOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreating(true)
    try {
      await createWorkOrder({
        ...formState,
        asset_id: formState.asset_id || null,
        schedule_id: formState.schedule_id || null,
        due_date: formState.due_date ? new Date(formState.due_date).toISOString() : undefined
      })
      addToast({
        type: 'success',
        title: 'Work order created',
        message: 'The maintenance task has been scheduled.'
      })
      setFormState(defaultWorkOrder)
      await loadData()
    } catch (error) {
      console.error(error)
      addToast({
        type: 'error',
        title: 'Unable to create work order',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    } finally {
      setCreating(false)
    }
  }

  const handleCompleteSchedule = async (scheduleId: string) => {
    try {
      await scheduleMaintenanceCompletion(scheduleId)
      addToast({
        type: 'success',
        title: 'Schedule completed',
        message: 'Maintenance schedule marked as completed.'
      })
      await loadData()
    } catch (error) {
      console.error(error)
      addToast({
        type: 'error',
        title: 'Unable to update schedule',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    }
  }

  const handleWorkOrderStatus = async (workOrderId: string, status: 'completed' | 'open') => {
    try {
      await updateWorkOrderStatus(workOrderId, status)
      addToast({
        type: 'success',
        title: 'Work order updated',
        message: `Work order status set to ${status}.`
      })
      await loadData()
    } catch (error) {
      console.error(error)
      addToast({
        type: 'error',
        title: 'Unable to update work order',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    }
  }

  return (
    <main className="module-container">
      <header className="module-header">
        <div>
          <h1 className="module-title">Maintenance &amp; Asset Management</h1>
          <p className="module-subtitle">
            Track asset health, coordinate remedial work, and prepare for preventive maintenance without touching the incident database.
          </p>
        </div>
      </header>

      <section className="module-grid">
        <article className="module-card">
          <div className="module-card-header">
            <div>
              <h2 className="module-card-title">Asset Register</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{assets.length} assets monitored</p>
            </div>
          </div>
          <div className="module-card-body">
            {loading ? (
              <div className="module-empty">Loading assets…</div>
            ) : assets.length === 0 ? (
              <div className="module-empty">No assets registered yet.</div>
            ) : (
              <table className="module-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Status</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.slice(0, 6).map((asset) => (
                    <tr key={asset.id}>
                      <td className="font-medium text-gray-900 dark:text-gray-100">
                        {asset.name}
                        <div className="text-xs text-gray-500 dark:text-gray-400">Tag: {asset.asset_tag}</div>
                      </td>
                      <td>
                        <span className={asset.status === 'operational' ? 'module-pill-success' : 'module-pill-warning'}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="text-gray-700 dark:text-gray-200">{asset.location || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </article>

        <article className="module-card">
          <div className="module-card-header">
            <div>
              <h2 className="module-card-title">Create Work Order</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Mirror the task queue interface for familiar workflows.</p>
            </div>
          </div>
          <div className="module-card-body">
            <form className="module-form" onSubmit={handleCreateWorkOrder}>
              <div>
                <label>Title</label>
                <input
                  value={formState.title}
                  onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </div>
              <div>
                <label>Description</label>
                <textarea
                  value={formState.description}
                  onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label>Asset</label>
                  <select
                    className="module-select"
                    value={formState.asset_id ?? ''}
                    onChange={(event) => setFormState((prev) => ({ ...prev, asset_id: event.target.value || null }))}
                  >
                    <option value="">Unassigned</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Priority</label>
                  <select
                    className="module-select"
                    value={formState.priority ?? 'medium'}
                    onChange={(event) => setFormState((prev) => ({ ...prev, priority: event.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label>Schedule (optional)</label>
                  <select
                    className="module-select"
                    value={formState.schedule_id ?? ''}
                    onChange={(event) => setFormState((prev) => ({ ...prev, schedule_id: event.target.value || null }))}
                  >
                    <option value="">Ad-hoc</option>
                    {schedules.map((schedule) => (
                      <option key={schedule.id} value={schedule.id}>
                        Every {schedule.frequency_days} days
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Due date</label>
                  <input
                    type="date"
                    value={formState.due_date || ''}
                    onChange={(event) => setFormState((prev) => ({ ...prev, due_date: event.target.value }))}
                  />
                </div>
              </div>

              <button type="submit" className="button-primary" disabled={creating}>
                {creating ? 'Creating…' : 'Add work order'}
              </button>
            </form>
          </div>
        </article>
      </section>

      <section className="module-card">
        <div className="module-card-header">
          <div>
            <h2 className="module-card-title">Preventive Maintenance</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{hooksCount} webhook integrations ready for IoT sensors.</p>
          </div>
          <div className="module-action-bar">
            <button
              type="button"
              className={`button-secondary text-xs ${activeFilter === 'open' ? '!bg-blue-500/10 !text-blue-500' : ''}`}
              onClick={() => setActiveFilter('open')}
            >
              Open
            </button>
            <button
              type="button"
              className={`button-secondary text-xs ${activeFilter === 'completed' ? '!bg-blue-500/10 !text-blue-500' : ''}`}
              onClick={() => setActiveFilter('completed')}
            >
              Completed
            </button>
            <button
              type="button"
              className={`button-secondary text-xs ${activeFilter === 'all' ? '!bg-blue-500/10 !text-blue-500' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
          </div>
        </div>
        <div className="module-card-body space-y-4">
          {loading ? (
            <div className="module-empty">Loading work orders…</div>
          ) : filteredWorkOrders.length === 0 ? (
            <div className="module-empty">No work orders in this state.</div>
          ) : (
            <ul className="module-list">
              {filteredWorkOrders.map((workOrder) => {
                const asset = assets.find((item) => item.id === workOrder.asset_id)
                return (
                  <li key={workOrder.id} className="module-list-item">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{workOrder.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{workOrder.description || 'No description provided.'}</p>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {asset ? `Asset: ${asset.name}` : 'Unassigned asset'}
                          {workOrder.due_date && <span className="ml-2">Due {new Date(workOrder.due_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={workOrder.status === 'completed' ? 'module-pill-success' : 'module-pill-warning'}>
                          {workOrder.status}
                        </span>
                        {workOrder.status === 'completed' ? (
                          <button
                            type="button"
                            className="button-secondary text-xs"
                            onClick={() => handleWorkOrderStatus(workOrder.id, 'open')}
                          >
                            Reopen
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="button-primary text-xs"
                            onClick={() => handleWorkOrderStatus(workOrder.id, 'completed')}
                          >
                            Mark complete
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {schedules.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Upcoming schedules</h3>
              <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                {schedules.slice(0, 5).map((schedule) => {
                  const asset = assets.find((item) => item.id === schedule.asset_id)
                  return (
                    <li key={schedule.id} className="flex items-center justify-between">
                      <span>
                        {asset?.name || 'Asset'} – every {schedule.frequency_days} days
                        {schedule.next_due_date && ` (next due ${schedule.next_due_date})`}
                      </span>
                      <button
                        type="button"
                        className="button-secondary text-xs"
                        onClick={() => handleCompleteSchedule(schedule.id)}
                      >
                        Log completion
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
