'use client'

import React, { useState, useEffect } from 'react'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  ArrowsPointingOutIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { metricBuilder, type CustomMetric, type MetricCalculation } from '@/lib/customMetrics/metricBuilder'

interface DashboardLayout {
  id: string
  name: string
  description: string
  widgets: DashboardWidget[]
  createdAt: string
  updatedAt: string
  createdBy: string
  isPublic: boolean
}

interface DashboardWidget {
  id: string
  metricId: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  title?: string
  config?: any
}

interface CustomDashboardBuilderProps {
  eventId?: string
  onDashboardCreated?: (dashboard: DashboardLayout) => void
  className?: string
}

const WIDGET_SIZES = [
  { value: 'small', label: 'Small', width: 1, height: 1, icon: '📱' },
  { value: 'medium', label: 'Medium', width: 2, height: 1, icon: '📊' },
  { value: 'large', label: 'Large', width: 2, height: 2, icon: '📈' },
  { value: 'wide', label: 'Wide', width: 3, height: 1, icon: '📋' },
  { value: 'tall', label: 'Tall', width: 1, height: 2, icon: '📏' }
]

export default function CustomDashboardBuilder({ 
  eventId, 
  onDashboardCreated, 
  className = '' 
}: CustomDashboardBuilderProps) {
  const [dashboards, setDashboards] = useState<DashboardLayout[]>([])
  const [metrics, setMetrics] = useState<CustomMetric[]>([])
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [currentDashboard, setCurrentDashboard] = useState<DashboardLayout | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<CustomMetric | null>(null)
  const [draggedWidget, setDraggedWidget] = useState<DashboardWidget | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false
  })

  // Load data
  useEffect(() => {
    loadDashboards()
    loadMetrics()
  }, [])

  const loadDashboards = () => {
    // In a real app, this would load from a database
    const mockDashboards: DashboardLayout[] = [
      {
        id: 'dashboard-1',
        name: 'Operations Overview',
        description: 'Key operational metrics for daily monitoring',
        widgets: [
          {
            id: 'widget-1',
            metricId: 'metric-1',
            position: { x: 0, y: 0 },
            size: { width: 2, height: 1 },
            title: 'Response Time'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user',
        isPublic: false
      }
    ]
    setDashboards(mockDashboards)
  }

  const loadMetrics = () => {
    const allMetrics = metricBuilder.getAllMetrics()
    setMetrics(allMetrics)
  }

  const handleCreateDashboard = () => {
    const newDashboard: DashboardLayout = {
      id: `dashboard-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      widgets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user',
      isPublic: formData.isPublic
    }

    setDashboards(prev => [...prev, newDashboard])
    setCurrentDashboard(newDashboard)
    setIsBuilderOpen(true)
    setFormData({ name: '', description: '', isPublic: false })
    onDashboardCreated?.(newDashboard)
  }

  const handleDeleteDashboard = (dashboardId: string) => {
    if (confirm('Are you sure you want to delete this dashboard?')) {
      setDashboards(prev => prev.filter(d => d.id !== dashboardId))
      if (currentDashboard?.id === dashboardId) {
        setCurrentDashboard(null)
        setIsBuilderOpen(false)
      }
    }
  }

  const handleEditDashboard = (dashboard: DashboardLayout) => {
    setCurrentDashboard(dashboard)
    setIsBuilderOpen(true)
  }

  const addWidget = (metric: CustomMetric, size: typeof WIDGET_SIZES[0]) => {
    if (!currentDashboard) return

    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      metricId: metric.id,
      position: { x: 0, y: 0 },
      size: { width: size.width, height: size.height },
      title: metric.name
    }

    const updatedDashboard = {
      ...currentDashboard,
      widgets: [...currentDashboard.widgets, newWidget],
      updatedAt: new Date().toISOString()
    }

    setCurrentDashboard(updatedDashboard)
    setDashboards(prev => prev.map(d => d.id === currentDashboard.id ? updatedDashboard : d))
  }

  const removeWidget = (widgetId: string) => {
    if (!currentDashboard) return

    const updatedDashboard = {
      ...currentDashboard,
      widgets: currentDashboard.widgets.filter(w => w.id !== widgetId),
      updatedAt: new Date().toISOString()
    }

    setCurrentDashboard(updatedDashboard)
    setDashboards(prev => prev.map(d => d.id === currentDashboard.id ? updatedDashboard : d))
  }

  const updateWidgetPosition = (widgetId: string, position: { x: number; y: number }) => {
    if (!currentDashboard) return

    const updatedDashboard = {
      ...currentDashboard,
      widgets: currentDashboard.widgets.map(w => 
        w.id === widgetId ? { ...w, position } : w
      ),
      updatedAt: new Date().toISOString()
    }

    setCurrentDashboard(updatedDashboard)
    setDashboards(prev => prev.map(d => d.id === currentDashboard.id ? updatedDashboard : d))
  }

  const handleDragStart = (widget: DashboardWidget, event: React.DragEvent) => {
    setDraggedWidget(widget)
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    })
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    if (!draggedWidget) return

    const gridSize = 100 // 100px per grid unit
    const x = Math.round((event.clientX - event.currentTarget.getBoundingClientRect().left - dragOffset.x) / gridSize)
    const y = Math.round((event.clientY - event.currentTarget.getBoundingClientRect().top - dragOffset.y) / gridSize)

    updateWidgetPosition(draggedWidget.id, { x: Math.max(0, x), y: Math.max(0, y) })
    setDraggedWidget(null)
  }

  const renderWidget = (widget: DashboardWidget) => {
    const metric = metrics.find(m => m.id === widget.metricId)
    if (!metric) return null

    const style = {
      left: `${widget.position.x * 100}px`,
      top: `${widget.position.y * 100}px`,
      width: `${widget.size.width * 100}px`,
      height: `${widget.size.height * 100}px`
    }

    return (
      <div
        key={widget.id}
        className="absolute bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
        style={style}
        draggable
        onDragStart={(e) => handleDragStart(widget, e)}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900 dark:text-white text-sm">
            {widget.title || metric.name}
          </h3>
          <button
            onClick={() => removeWidget(widget.id)}
            className="text-gray-400 hover:text-red-600 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
          {/* This would show the actual calculated value */}
          --
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {metric.description}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Squares2X2Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Custom Dashboard Builder</h2>
            <p className="text-gray-600 dark:text-gray-400">Create and customize your own dashboards</p>
          </div>
        </div>
        <button
          onClick={() => setCurrentDashboard(null)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>New Dashboard</span>
        </button>
      </div>

      {/* Dashboard List */}
      {!isBuilderOpen && (
        <div className="space-y-4">
          {dashboards.length === 0 ? (
            <div className="text-center py-12">
              <Squares2X2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No custom dashboards</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first custom dashboard to get started</p>
              <button
                onClick={() => setCurrentDashboard(null)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Create Your First Dashboard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboards.map((dashboard) => (
                <div key={dashboard.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{dashboard.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{dashboard.description}</p>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {dashboard.widgets.length} widgets
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditDashboard(dashboard)}
                        className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                        title="Edit dashboard"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDashboard(dashboard.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete dashboard"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Updated {new Date(dashboard.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dashboard Builder */}
      {isBuilderOpen && (
        <div className="space-y-6">
          {/* Builder Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentDashboard ? `Editing: ${currentDashboard.name}` : 'Create New Dashboard'}
              </h3>
              {currentDashboard && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentDashboard.widgets.length} widgets
                </p>
              )}
            </div>
            <button
              onClick={() => setIsBuilderOpen(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Close Builder
            </button>
          </div>

          {/* Dashboard Creation Form */}
          {!currentDashboard && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dashboard Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Operations Overview"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={2}
                    placeholder="Describe what this dashboard is for..."
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Make this dashboard public</span>
                  </label>
                </div>
                <button
                  onClick={handleCreateDashboard}
                  disabled={!formData.name.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-medium transition-colors"
                >
                  Create Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Widget Palette */}
          {currentDashboard && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Available Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {metrics.map((metric) => (
                  <div key={metric.id} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm">{metric.name}</h5>
                      <div className="flex gap-1">
                        {WIDGET_SIZES.slice(0, 3).map((size) => (
                          <button
                            key={size.value}
                            onClick={() => addWidget(metric, size)}
                            className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                            title={`Add ${size.label} widget`}
                          >
                            <span className="text-xs">{size.icon}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{metric.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dashboard Canvas */}
          {currentDashboard && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Dashboard Canvas</h4>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Drag widgets to reposition
                </div>
              </div>
              <div
                className="relative bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg min-h-[400px]"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {currentDashboard.widgets.map(renderWidget)}
                {currentDashboard.widgets.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <div className="text-center">
                      <ArrowsPointingOutIcon className="h-12 w-12 mx-auto mb-2" />
                      <p>Add widgets from the palette above</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
