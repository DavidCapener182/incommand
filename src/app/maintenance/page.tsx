'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  CalendarClock,
  ClipboardList,
  Factory,
  Loader2,
  Wrench,
  X
} from 'lucide-react'
import { useToast } from '@/components/Toast'
import type {
  AssetRecord,
  MaintenanceSchedule,
  MaintenanceVendor,
  WorkOrder
} from '@/types/maintenance'
import {
  createAsset,
  createMaintenanceSchedule,
  createWorkOrder,
  fetchAssets,
  fetchMaintenanceEventHooks,
  fetchMaintenanceSchedules,
  fetchMaintenanceVendors,
  fetchWorkOrders,
  scheduleMaintenanceCompletion,
  toggleMaintenanceSchedule,
  updateAsset,
  updateWorkOrderDetails,
  updateWorkOrderStatus,
  type CreateAssetPayload,
  type CreateSchedulePayload,
  type CreateWorkOrderPayload,
  type UpdateWorkOrderDetailsPayload
} from '@/services/maintenanceService'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { PageWrapper } from '@/components/layout/PageWrapper'

const assetStatusOptions = [
  { value: 'operational', label: 'Operational' },
  { value: 'needs_attention', label: 'Needs attention' },
  { value: 'out_of_service', label: 'Out of service' },
  { value: 'retired', label: 'Retired' }
]

const priorityOptions = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
]

const defaultWorkOrderForm = {
  title: '',
  description: '',
  priority: 'medium',
  asset_id: '',
  schedule_id: '',
  due_date: '',
  assigned_vendor_id: ''
}

const defaultAssetForm = {
  asset_tag: '',
  name: '',
  status: 'operational',
  description: '',
  location: '',
  service_life_months: '',
  commissioned_at: ''
}

const defaultScheduleForm = {
  asset_id: '',
  frequency_days: '30',
  next_due_date: '',
  webhook_endpoint: '',
  enabled: true
}

const defaultWorkOrderDetailForm = {
  assigned_vendor_id: '',
  priority: 'medium',
  due_date: '',
  completion_notes: ''
}

type WorkOrderFilter = 'open' | 'completed' | 'all'

type AssetModalMode = 'create' | 'edit'

type ScheduleFormState = typeof defaultScheduleForm

type AssetFormState = typeof defaultAssetForm

type WorkOrderFormState = typeof defaultWorkOrderForm

type WorkOrderDetailFormState = typeof defaultWorkOrderDetailForm

export default function MaintenancePage() {
  const { addToast } = useToast()
  const addToastRef = useRef(addToast)
  addToastRef.current = addToast

  const [loading, setLoading] = useState(true)
  const [assets, setAssets] = useState<AssetRecord[]>([])
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [vendors, setVendors] = useState<MaintenanceVendor[]>([])
  const [hooksCount, setHooksCount] = useState(0)

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<WorkOrderFilter>('open')

  const [creatingWorkOrder, setCreatingWorkOrder] = useState(false)
  const [workOrderForm, setWorkOrderForm] = useState<WorkOrderFormState>(defaultWorkOrderForm)

  const [assetModalOpen, setAssetModalOpen] = useState(false)
  const [assetModalMode, setAssetModalMode] = useState<AssetModalMode>('create')
  const [assetForm, setAssetForm] = useState<AssetFormState>(defaultAssetForm)

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(defaultScheduleForm)

  const [workOrderModalId, setWorkOrderModalId] = useState<string | null>(null)
  const [workOrderDetailForm, setWorkOrderDetailForm] = useState<WorkOrderDetailFormState>(defaultWorkOrderDetailForm)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [assetData, scheduleData, workOrderData, hooks, vendorData] = await Promise.all([
        fetchAssets(),
        fetchMaintenanceSchedules(),
        fetchWorkOrders(),
        fetchMaintenanceEventHooks(),
        fetchMaintenanceVendors()
      ])

      setAssets(assetData)
      setSchedules(scheduleData)
      setWorkOrders(workOrderData)
      setHooksCount(hooks.length)
      setVendors(vendorData)

      if (assetData.length > 0) {
        if (!selectedAssetId || !assetData.some((asset) => asset.id === selectedAssetId)) {
          setSelectedAssetId(assetData[0].id)
        }
      } else {
        setSelectedAssetId(null)
      }
    } catch (error) {
      console.error(error)
      addToastRef.current({
        type: 'error',
        title: 'Unable to load maintenance data',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    } finally {
      setLoading(false)
    }
  }, [selectedAssetId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const selectedAsset = useMemo(() => {
    if (!selectedAssetId) return null
    return assets.find((asset) => asset.id === selectedAssetId) || null
  }, [assets, selectedAssetId])

  const summaryCards = useMemo(() => {
    const operational = assets.filter((asset) => asset.status === 'operational').length
    const needsAttention = assets.filter((asset) => ['needs_attention', 'out_of_service'].includes(asset.status)).length
    const openOrders = workOrders.filter((order) => order.status !== 'completed').length
    const overdueOrders = workOrders.filter((order) => {
      if (!order.due_date || order.status === 'completed') return false
      return new Date(order.due_date) < new Date()
    }).length
    const upcomingSchedules = schedules.filter((schedule) => {
      if (!schedule.next_due_date) return false
      const dueDate = new Date(schedule.next_due_date)
      const now = new Date()
      const inSevenDays = new Date()
      inSevenDays.setDate(now.getDate() + 7)
      return dueDate >= now && dueDate <= inSevenDays
    }).length
    const completedThisWeek = workOrders.filter((order) => {
      if (order.status !== 'completed' || !order.completed_at) return false
      const completedAt = new Date(order.completed_at)
      const now = new Date()
      const weekAgo = new Date()
      weekAgo.setDate(now.getDate() - 7)
      return completedAt >= weekAgo && completedAt <= now
    }).length

    return [
      {
        key: 'assets-operational',
        title: 'Operational assets',
        value: operational,
        subtitle: `${needsAttention} require attention`,
        icon: Factory,
        accent: 'bg-blue-500/10 text-blue-600 dark:text-blue-300'
      },
      {
        key: 'workorders-open',
        title: 'Open work orders',
        value: openOrders,
        subtitle: overdueOrders > 0 ? `${overdueOrders} overdue` : 'On track',
        icon: ClipboardList,
        accent: overdueOrders > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
      },
      {
        key: 'schedules-upcoming',
        title: 'Upcoming schedules',
        value: upcomingSchedules,
        subtitle: `${hooksCount} IoT hooks`,
        icon: CalendarClock,
        accent: 'bg-purple-500/10 text-purple-600 dark:text-purple-300'
      },
      {
        key: 'completed-week',
        title: 'Completed this week',
        value: completedThisWeek,
        subtitle: `${workOrders.length} total work orders`,
        icon: Activity,
        accent: 'bg-slate-500/10 text-slate-600 dark:text-slate-300'
      }
    ]
  }, [assets, workOrders, schedules, hooksCount])

  const assetWorkOrderHistory = useMemo(() => {
    if (!selectedAssetId) return []
    return workOrders
      .filter((order) => order.asset_id === selectedAssetId)
      .slice(0, 5)
  }, [workOrders, selectedAssetId])

  const activityFeed = useMemo(() => {
    return workOrders.slice(0, 10).map((order) => ({
      id: order.id,
      title: order.title,
      status: order.status,
      priority: order.priority,
      timestamp: order.updated_at || order.created_at,
      asset: assets.find((asset) => asset.id === order.asset_id)?.name || 'Unassigned'
    }))
  }, [workOrders, assets])

  const filteredWorkOrders = useMemo(() => {
    if (activeFilter === 'all') {
      return workOrders
    }
    if (activeFilter === 'open') {
      return workOrders.filter((order) => order.status !== 'completed')
    }
    return workOrders.filter((order) => order.status === 'completed')
  }, [workOrders, activeFilter])

  const openAssetModal = (mode: AssetModalMode) => {
    setAssetModalMode(mode)
    if (mode === 'create') {
      setAssetForm({
        ...defaultAssetForm,
        asset_tag: '',
        name: '',
        status: 'operational',
        commissioned_at: ''
      })
    } else if (selectedAsset) {
      setAssetForm({
        asset_tag: selectedAsset.asset_tag,
        name: selectedAsset.name,
        status: selectedAsset.status,
        description: selectedAsset.description || '',
        location: selectedAsset.location || '',
        service_life_months: selectedAsset.service_life_months ? String(selectedAsset.service_life_months) : '',
        commissioned_at: selectedAsset.commissioned_at ? selectedAsset.commissioned_at.toString().split('T')[0] : ''
      })
    }
    setAssetModalOpen(true)
  }

  const handleAssetSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const payload: CreateAssetPayload = {
        asset_tag: assetForm.asset_tag.trim(),
        name: assetForm.name.trim(),
        asset_type: 'equipment', // Default asset type
        status: assetForm.status,
        description: assetForm.description.trim() || undefined,
        location: assetForm.location.trim() || undefined,
        service_life_months: assetForm.service_life_months ? Number(assetForm.service_life_months) : null,
        commissioned_at: assetForm.commissioned_at || null
      }

      if (assetModalMode === 'create') {
        await createAsset(payload)
        addToastRef.current({
          type: 'success',
          title: 'Asset added',
          message: `${payload.name} added to the register.`
        })
      } else if (selectedAsset) {
        const { asset_tag, ...updates } = payload
        await updateAsset(selectedAsset.id, updates)
        addToastRef.current({
          type: 'success',
          title: 'Asset updated',
          message: `${payload.name} updated.`
        })
      }

      setAssetModalOpen(false)
      await loadData()
    } catch (error) {
      console.error(error)
      addToastRef.current({
        type: 'error',
        title: assetModalMode === 'create' ? 'Unable to add asset' : 'Unable to update asset',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    }
  }

  const handleScheduleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      if (!scheduleForm.asset_id) {
        throw new Error('Select an asset to schedule maintenance for.')
      }

      const payload: CreateSchedulePayload = {
        asset_id: scheduleForm.asset_id,
        schedule_name: `Maintenance for ${assets.find(a => a.id === scheduleForm.asset_id)?.name || 'Asset'}`,
        frequency_days: Number(scheduleForm.frequency_days) || 0,
        next_due_date: scheduleForm.next_due_date || null,
        webhook_endpoint: scheduleForm.webhook_endpoint || null,
        enabled: scheduleForm.enabled
      }

      if (payload.frequency_days <= 0) {
        throw new Error('Frequency must be greater than zero days.')
      }

      await createMaintenanceSchedule(payload)
      setScheduleModalOpen(false)
      setScheduleForm({ ...defaultScheduleForm, asset_id: scheduleForm.asset_id })
      addToastRef.current({
        type: 'success',
        title: 'Schedule created',
        message: 'Preventive maintenance cycle added.'
      })
      await loadData()
    } catch (error) {
      console.error(error)
      addToastRef.current({
        type: 'error',
        title: 'Unable to create schedule',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    }
  }

  const handleCreateWorkOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreatingWorkOrder(true)
    try {
      const payload: CreateWorkOrderPayload = {
        title: workOrderForm.title.trim(),
        description: workOrderForm.description.trim() || undefined,
        priority: workOrderForm.priority,
        asset_id: workOrderForm.asset_id || null,
        schedule_id: workOrderForm.schedule_id || null,
        due_date: workOrderForm.due_date ? new Date(workOrderForm.due_date).toISOString() : undefined,
        assigned_vendor_id: workOrderForm.assigned_vendor_id || null
      }

      await createWorkOrder(payload)
      setWorkOrderForm((prev) => ({ ...defaultWorkOrderForm, asset_id: prev.asset_id }))
      addToastRef.current({
        type: 'success',
        title: 'Work order created',
        message: 'Maintenance task added to the queue.'
      })
      await loadData()
    } catch (error) {
      console.error(error)
      addToastRef.current({
        type: 'error',
        title: 'Unable to create work order',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    } finally {
      setCreatingWorkOrder(false)
    }
  }

  const handleScheduleCompletion = async (scheduleId: string) => {
    try {
      await scheduleMaintenanceCompletion(scheduleId)
      addToastRef.current({
        type: 'success',
        title: 'Schedule completion logged',
        message: 'Maintenance schedule updated.'
      })
      await loadData()
    } catch (error) {
      console.error(error)
      addToastRef.current({
        type: 'error',
        title: 'Unable to update schedule',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    }
  }

  const handleScheduleToggle = async (scheduleId: string, enabled: boolean) => {
    try {
      await toggleMaintenanceSchedule(scheduleId, enabled)
      addToastRef.current({
        type: 'success',
        title: enabled ? 'Schedule enabled' : 'Schedule paused',
        message: enabled ? 'Maintenance automation resumed.' : 'Maintenance schedule paused.'
      })
      await loadData()
    } catch (error) {
      console.error(error)
      addToastRef.current({
        type: 'error',
        title: 'Unable to update schedule',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    }
  }

  const openWorkOrderModal = (workOrder: WorkOrder) => {
    setWorkOrderModalId(workOrder.id)
    setWorkOrderDetailForm({
      assigned_vendor_id: workOrder.assigned_vendor_id || '',
      priority: workOrder.priority || 'medium',
      due_date: workOrder.due_date ? workOrder.due_date.split('T')[0] : '',
      completion_notes: workOrder.completion_notes || ''
    })
  }

  const handleWorkOrderDetailSave = async () => {
    if (!workOrderModalId) return
    try {
      const payload: UpdateWorkOrderDetailsPayload = {
        assigned_vendor_id: workOrderDetailForm.assigned_vendor_id || null,
        priority: workOrderDetailForm.priority,
        due_date: workOrderDetailForm.due_date ? new Date(workOrderDetailForm.due_date).toISOString() : null
      }

      await updateWorkOrderDetails(workOrderModalId, payload)
      addToastRef.current({
        type: 'success',
        title: 'Work order updated',
        message: 'Assignment and scheduling updated.'
      })
      await loadData()
    } catch (error) {
      console.error(error)
      addToastRef.current({
        type: 'error',
        title: 'Unable to update work order',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    }
  }

  const handleWorkOrderStatusChange = async (status: string) => {
    if (!workOrderModalId) return
    try {
      await updateWorkOrderStatus(
        workOrderModalId,
        status,
        status === 'completed' ? workOrderDetailForm.completion_notes : undefined
      )
      addToastRef.current({
        type: 'success',
        title: `Status updated to ${status}`,
        message: status === 'completed' ? 'Completion logged with notes.' : 'Work order status updated.'
      })
      await loadData()
    } catch (error) {
      console.error(error)
      addToastRef.current({
        type: 'error',
        title: 'Unable to update status',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    }
  }

  const handleQuickStatusChange = async (workOrderId: string, status: string) => {
    try {
      await updateWorkOrderStatus(workOrderId, status)
      addToastRef.current({
        type: 'success',
        title: `Status updated to ${status}`,
        message: 'Work order status updated.'
      })
      await loadData()
    } catch (error) {
      console.error(error)
      addToastRef.current({
        type: 'error',
        title: 'Unable to update status',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    }
  }

  const closeWorkOrderModal = () => {
    setWorkOrderModalId(null)
    setWorkOrderDetailForm(defaultWorkOrderDetailForm)
  }

  return (
    <PageWrapper>
      <header className="module-header">
        <div>
          <h1 className="module-title">Maintenance &amp; Asset Management</h1>
          <p className="module-subtitle">
            Coordinate preventive schedules, react to incidents, and keep the asset register healthy. Everything updates in real time without
            touching the incident log.
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.key} className="module-card !p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{card.title}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{card.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.subtitle}</p>
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${card.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <section className="module-grid">
        <article className="module-card">
          <div className="module-card-header">
            <div>
              <h2 className="module-card-title">Asset register</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{assets.length} assets being monitored</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="button-secondary text-xs" onClick={() => openAssetModal('create')}>
                New asset
              </button>
              <button type="button" className="button-secondary text-xs" onClick={() => openAssetModal('edit')} disabled={!selectedAsset}>
                Edit asset
              </button>
            </div>
          </div>
          <div className="module-card-body space-y-4">
            {loading ? (
              <div className="module-empty">Loading assets…</div>
            ) : assets.length === 0 ? (
              <div className="module-empty">No assets registered yet.</div>
            ) : (
              <>
                <div className="module-action-bar">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Select asset</label>
                  <select
                    className="module-select"
                    value={selectedAssetId ?? ''}
                    onChange={(event) => setSelectedAssetId(event.target.value || null)}
                    style={{ maxWidth: '18rem' }}
                  >
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAsset ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedAsset.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Tag: {selectedAsset.asset_tag}</p>
                      </div>
                      <span
                        className={
                          selectedAsset.status === 'operational'
                            ? 'module-pill-success capitalize'
                            : selectedAsset.status === 'retired'
                            ? 'module-pill-info capitalize'
                            : 'module-pill-warning capitalize'
                        }
                      >
                        {selectedAsset.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{selectedAsset.location || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Service life</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {selectedAsset.service_life_months ? `${selectedAsset.service_life_months} months` : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Commissioned</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {selectedAsset.commissioned_at ? new Date(selectedAsset.commissioned_at).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Last update</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {selectedAsset.updated_at ? new Date(selectedAsset.updated_at).toLocaleString() : 'Never'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                      <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Recent work</p>
                      {assetWorkOrderHistory.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">No maintenance history recorded.</p>
                      ) : (
                        <ul className="mt-2 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                          {assetWorkOrderHistory.map((order) => (
                            <li key={order.id} className="flex items-center justify-between">
                              <span>
                                {order.title} • {order.status}
                              </span>
                              <span>{order.updated_at ? new Date(order.updated_at).toLocaleDateString() : ''}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="module-empty">Select an asset to view details.</div>
                )}
              </>
            )}
          </div>
        </article>

        <article className="module-card">
          <div className="module-card-header">
            <div>
              <h2 className="module-card-title">Create work order</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Dispatch reactive tasks or link to preventive schedules.</p>
            </div>
          </div>
          <div className="module-card-body">
            <form className="module-form" onSubmit={handleCreateWorkOrder}>
              <div>
                <label>Title</label>
                <input
                  value={workOrderForm.title}
                  onChange={(event) => setWorkOrderForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </div>
              <div>
                <label>Description</label>
                <textarea
                  value={workOrderForm.description}
                  onChange={(event) => setWorkOrderForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Add context for engineers or contracted vendors"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label>Asset</label>
                  <select
                    className="module-select"
                    value={workOrderForm.asset_id}
                    onChange={(event) => setWorkOrderForm((prev) => ({ ...prev, asset_id: event.target.value }))}
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
                    value={workOrderForm.priority}
                    onChange={(event) => setWorkOrderForm((prev) => ({ ...prev, priority: event.target.value }))}
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label>Link to schedule</label>
                  <select
                    className="module-select"
                    value={workOrderForm.schedule_id}
                    onChange={(event) => setWorkOrderForm((prev) => ({ ...prev, schedule_id: event.target.value }))}
                  >
                    <option value="">Ad-hoc task</option>
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
                    value={workOrderForm.due_date}
                    onChange={(event) => setWorkOrderForm((prev) => ({ ...prev, due_date: event.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label>Assigned vendor</label>
                <select
                  className="module-select"
                  value={workOrderForm.assigned_vendor_id}
                  onChange={(event) => setWorkOrderForm((prev) => ({ ...prev, assigned_vendor_id: event.target.value }))}
                >
                  <option value="">Not assigned</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.business_name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="button-primary" disabled={creatingWorkOrder}>
                {creatingWorkOrder ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </span>
                ) : (
                  'Add work order'
                )}
              </button>
            </form>
          </div>
        </article>
      </section>

      <section className="module-grid mt-6">
        <article className="module-card">
          <div className="module-card-header">
            <div>
              <h2 className="module-card-title">Maintenance schedules</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automate routine servicing and integrate with sensors or BMS webhooks.
              </p>
            </div>
            <button
              type="button"
              className="button-secondary text-xs"
              onClick={() => {
                setScheduleForm({ ...defaultScheduleForm, asset_id: selectedAssetId || '' })
                setScheduleModalOpen(true)
              }}
            >
              New schedule
            </button>
          </div>
          <div className="module-card-body space-y-3">
            {loading ? (
              <div className="module-empty">Loading schedules…</div>
            ) : schedules.length === 0 ? (
              <div className="module-empty">No scheduled maintenance yet.</div>
            ) : (
              <ul className="module-list">
                {schedules.map((schedule) => {
                  const asset = assets.find((item) => item.id === schedule.asset_id)
                  const nextDue = schedule.next_due_date ? new Date(schedule.next_due_date).toLocaleDateString() : 'Not set'
                  return (
                    <li key={schedule.id} className="module-list-item">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {asset?.name || 'Asset'} — every {schedule.frequency_days} days
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Next due {nextDue}
                              {schedule.webhook_endpoint && <span className="ml-2">Webhook connected</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="button-secondary text-xs"
                              onClick={() => handleScheduleCompletion(schedule.id)}
                            >
                              Log completion
                            </button>
                            <button
                              type="button"
                              className="button-secondary text-xs"
                              onClick={() => handleScheduleToggle(schedule.id, !schedule.enabled)}
                            >
                              {schedule.enabled ? 'Pause' : 'Resume'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </article>

        <article className="module-card">
          <div className="module-card-header">
            <div>
              <h2 className="module-card-title">Maintenance activity</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Latest changes across work orders and asset movements.</p>
            </div>
          </div>
          <div className="module-card-body">
            {loading ? (
              <div className="module-empty">Loading recent activity…</div>
            ) : activityFeed.length === 0 ? (
              <div className="module-empty">No maintenance activity recorded yet.</div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                {activityFeed.map((item) => (
                  <li key={item.id} className="py-3 flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-blue-500/10 p-2 text-blue-600 dark:text-blue-300">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.asset} • {item.priority} priority • {item.status}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
      </section>

      <section className="module-card mt-6">
        <div className="module-card-header flex-wrap gap-3">
          <div>
            <h2 className="module-card-title">Work order queue</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitor open remediation tasks, escalate vendors, and capture completion notes.
            </p>
          </div>
          <div className="flex items-center gap-2">
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
              {filteredWorkOrders.map((order) => {
                const asset = assets.find((item) => item.id === order.asset_id)
                const vendor = vendors.find((item) => item.id === order.assigned_vendor_id)
                const dueSoon = order.due_date && order.status !== 'completed' && new Date(order.due_date) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                return (
                  <li key={order.id} className="module-list-item">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{order.title}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{order.description || 'No description provided.'}</p>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-x-2">
                            <span>Asset: {asset ? asset.name : 'Unassigned'}</span>
                            <span>Priority: {order.priority}</span>
                            {order.due_date && <span>Due {new Date(order.due_date).toLocaleDateString()}</span>}
                            <span>{order.schedule_id ? 'Preventive' : 'Reactive'}</span>
                          </div>
                          {vendor && (
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Assigned vendor: {vendor.business_name}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              order.status === 'completed'
                                ? 'module-pill-success'
                                : order.status === 'in_progress'
                                ? 'module-pill-info'
                                : 'module-pill-warning'
                            }
                          >
                            {order.status.replace('_', ' ')}
                          </span>
                          {dueSoon && <span className="module-pill-danger">Due soon</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="button-secondary text-xs" onClick={() => openWorkOrderModal(order)}>
                          Review
                        </button>
                        {order.status === 'completed' ? (
                          <button type="button" className="button-secondary text-xs" onClick={() => handleQuickStatusChange(order.id, 'open')}>
                            Reopen
                          </button>
                        ) : (
                          <button type="button" className="button-primary text-xs" onClick={() => openWorkOrderModal(order)}>
                            Update status
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Asset Modal */}
      {assetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setAssetModalOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-[#1e2438] rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6">
              <button
                onClick={() => setAssetModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Factory className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white pr-12">
                    {assetModalMode === 'create' ? 'Add asset to register' : 'Update asset details'}
                  </h2>
                  <p className="text-blue-100 mt-1">
                    {assetModalMode === 'create'
                      ? 'Capture the core metadata for the asset so maintenance and lifecycle planning can start immediately.'
                      : 'Keep asset information accurate for upcoming work orders and reporting.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
              <form className="space-y-6" onSubmit={handleAssetSubmit}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Asset tag
                    </label>
                    <input
                      type="text"
                      value={assetForm.asset_tag}
                      onChange={(event) => setAssetForm((prev) => ({ ...prev, asset_tag: event.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                      disabled={assetModalMode === 'edit'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={assetForm.name}
                      onChange={(event) => setAssetForm((prev) => ({ ...prev, name: event.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Description
                  </label>
                  <textarea
                    value={assetForm.description}
                    onChange={(event) => setAssetForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Optional context, model numbers, or warranty details"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={assetForm.location}
                      onChange={(event) => setAssetForm((prev) => ({ ...prev, location: event.target.value }))}
                      placeholder="e.g. North Concourse"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Status
                    </label>
                    <select
                      value={assetForm.status}
                      onChange={(event) => setAssetForm((prev) => ({ ...prev, status: event.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {assetStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Service life (months)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={assetForm.service_life_months}
                      onChange={(event) => setAssetForm((prev) => ({ ...prev, service_life_months: event.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Commissioned
                    </label>
                    <input
                      type="date"
                      value={assetForm.commissioned_at}
                      onChange={(event) => setAssetForm((prev) => ({ ...prev, commissioned_at: event.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                  >
                    {assetModalMode === 'create' ? 'Add asset' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>New maintenance schedule</DialogTitle>
            <DialogDescription>
              Define a preventive cadence for critical infrastructure. Schedules can be paired with webhook automations.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleScheduleSubmit}>
            <div>
              <label>Asset</label>
              <select
                className="module-select"
                value={scheduleForm.asset_id}
                onChange={(event) => setScheduleForm((prev) => ({ ...prev, asset_id: event.target.value }))}
                required
              >
                <option value="">Select asset</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label>Frequency (days)</label>
                <input
                  type="number"
                  min={1}
                  value={scheduleForm.frequency_days}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, frequency_days: event.target.value }))}
                  required
                />
              </div>
              <div>
                <label>Next due date</label>
                <input
                  type="date"
                  value={scheduleForm.next_due_date}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, next_due_date: event.target.value }))}
                />
              </div>
            </div>
            <div>
              <label>Webhook endpoint</label>
              <input
                value={scheduleForm.webhook_endpoint}
                onChange={(event) => setScheduleForm((prev) => ({ ...prev, webhook_endpoint: event.target.value }))}
                placeholder="Optional URL for sensor callbacks"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="schedule-enabled"
                type="checkbox"
                checked={scheduleForm.enabled}
                onChange={(event) => setScheduleForm((prev) => ({ ...prev, enabled: event.target.checked }))}
              />
              <label htmlFor="schedule-enabled" className="text-sm text-gray-700 dark:text-gray-300">
                Enabled immediately
              </label>
            </div>
            <DialogFooter>
              <button type="submit" className="button-primary">
                Save schedule
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(workOrderModalId)} onOpenChange={(open) => (open ? null : closeWorkOrderModal())}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Work order details</DialogTitle>
            <DialogDescription>Assign vendors, adjust priority, and log completion notes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label>Assigned vendor</label>
                <select
                  className="module-select"
                  value={workOrderDetailForm.assigned_vendor_id}
                  onChange={(event) =>
                    setWorkOrderDetailForm((prev) => ({ ...prev, assigned_vendor_id: event.target.value }))
                  }
                >
                  <option value="">Not assigned</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.business_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Priority</label>
                <select
                  className="module-select"
                  value={workOrderDetailForm.priority}
                  onChange={(event) =>
                    setWorkOrderDetailForm((prev) => ({ ...prev, priority: event.target.value }))
                  }
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label>Due date</label>
              <input
                type="date"
                value={workOrderDetailForm.due_date}
                onChange={(event) => setWorkOrderDetailForm((prev) => ({ ...prev, due_date: event.target.value }))}
              />
            </div>
            <button type="button" className="button-secondary" onClick={handleWorkOrderDetailSave}>
              Save assignment
            </button>
            <div>
              <label>Completion notes</label>
              <textarea
                value={workOrderDetailForm.completion_notes}
                onChange={(event) => setWorkOrderDetailForm((prev) => ({ ...prev, completion_notes: event.target.value }))}
                placeholder="Optional closeout or verification notes"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="button-secondary text-xs" onClick={() => handleWorkOrderStatusChange('open')}>
                Mark open
              </button>
              <button
                type="button"
                className="button-secondary text-xs"
                onClick={() => handleWorkOrderStatusChange('in_progress')}
              >
                In progress
              </button>
              <button
                type="button"
                className="button-primary text-xs"
                onClick={() => handleWorkOrderStatusChange('completed')}
              >
                Mark complete
              </button>
            </div>
            <DialogFooter>
              <button type="button" className="button-secondary" onClick={closeWorkOrderModal}>
                Close
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
