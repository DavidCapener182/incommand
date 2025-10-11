'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PlusIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  CogIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { triggerHaptic } from '@/utils/hapticFeedback'
import { 
  MetricWidget, 
  TrendWidget, 
  ComparisonWidget,
  ProgressWidget,
  StatGridWidget,
  AlertWidget 
} from './AnalyticsWidgetLibrary'
import MobileOptimizedChart from '../MobileOptimizedChart'

interface DashboardWidget {
  id: string
  type: 'metric' | 'trend' | 'comparison' | 'progress' | 'chart' | 'grid' | 'alert'
  title: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  data: any
  config?: any
}

interface CustomDashboardBuilderProps {
  eventId: string
  onSave?: (dashboard: DashboardWidget[]) => void
  onCancel?: () => void
  className?: string
}

const WIDGET_TYPES = [
  { type: 'metric', label: 'Metric', icon: '📊' },
  { type: 'trend', label: 'Trend', icon: '📈' },
  { type: 'comparison', label: 'Comparison', icon: '⚖️' },
  { type: 'progress', label: 'Progress', icon: '🎯' },
  { type: 'chart', label: 'Chart', icon: '📉' },
  { type: 'grid', label: 'Stats Grid', icon: '🔢' },
  { type: 'alert', label: 'Alert', icon: '⚠️' }
]

const GRID_SIZE = 50 // Grid cell size in pixels
const MAX_COLUMNS = 6
const MAX_ROWS = 8

export default function CustomDashboardBuilder({ 
  eventId, 
  onSave,
  onCancel,
  className = '' 
}: CustomDashboardBuilderProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null)
  const [isAddingWidget, setIsAddingWidget] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Add new widget
  const addWidget = useCallback((type: DashboardWidget['type']) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type,
      title: `${WIDGET_TYPES.find(w => w.type === type)?.label} Widget`,
      position: { x: 0, y: 0 },
      size: { width: 2, height: 2 },
      data: generateSampleData(type)
    }

    setWidgets(prev => [...prev, newWidget])
    setIsAddingWidget(false)
    triggerHaptic.medium()
  }, [])

  // Delete widget
  const deleteWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id))
    setSelectedWidget(null)
    triggerHaptic.light()
  }, [])

  // Update widget
  const updateWidget = useCallback((id: string, updates: Partial<DashboardWidget>) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, ...updates } : w
    ))
  }, [])

  // Move widget
  const moveWidget = useCallback((id: string, position: { x: number; y: number }) => {
    updateWidget(id, { position })
  }, [updateWidget])

  // Resize widget
  const resizeWidget = useCallback((id: string, size: { width: number; height: number }) => {
    updateWidget(id, { size })
  }, [updateWidget])

  // Save dashboard
  const saveDashboard = useCallback(() => {
    onSave?.(widgets)
    triggerHaptic.success()
  }, [widgets, onSave])

  // Render widget based on type
  const renderWidget = (widget: DashboardWidget) => {
    const commonProps = {
      key: widget.id,
      className: `absolute border-2 transition-all ${
        selectedWidget === widget.id 
          ? 'border-blue-500 shadow-lg' 
          : 'border-transparent hover:border-gray-300'
      }`
    }

    switch (widget.type) {
      case 'metric':
        return (
          <div {...commonProps}>
            <MetricWidget
              title={widget.title}
              value={widget.data.value}
              subtitle={widget.data.subtitle}
            />
          </div>
        )

      case 'trend':
        return (
          <div {...commonProps}>
            <TrendWidget
              title={widget.title}
              value={widget.data.value}
              change={widget.data.change}
              changeLabel={widget.data.changeLabel}
            />
          </div>
        )

      case 'comparison':
        return (
          <div {...commonProps}>
            <ComparisonWidget
              title={widget.title}
              current={widget.data.current}
              previous={widget.data.previous}
              currentLabel={widget.data.currentLabel}
              previousLabel={widget.data.previousLabel}
              unit={widget.data.unit}
            />
          </div>
        )

      case 'progress':
        return (
          <div {...commonProps}>
            <ProgressWidget
              title={widget.title}
              current={widget.data.current}
              target={widget.data.target}
              unit={widget.data.unit}
            />
          </div>
        )

      case 'chart':
        return (
          <div {...commonProps}>
            <MobileOptimizedChart
              data={widget.data.chartData || []}
              title={widget.title}
              type={widget.data.chartType || 'line'}
              height={200}
            />
          </div>
        )

      case 'grid':
        return (
          <div {...commonProps}>
            <StatGridWidget
              title={widget.title}
              stats={widget.data.stats}
              columns={widget.data.columns}
            />
          </div>
        )

      case 'alert':
        return (
          <div {...commonProps}>
            <AlertWidget
              title={widget.title}
              message={widget.data.message}
              severity={widget.data.severity}
            />
          </div>
        )

      default:
        return null
    }
    }

    return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Dashboard Builder
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`p-2 rounded-lg transition-colors ${
              isEditing 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={saveDashboard}
            className="p-2 bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
          >
            <CheckIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onCancel}
            className="p-2 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {/* Grid Background */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
          }}
        />

        {/* Widgets */}
        <div className="relative w-full h-full">
          {widgets.map(widget => (
            <motion.div
              key={widget.id}
              className="absolute cursor-pointer"
              style={{
                left: widget.position.x * GRID_SIZE,
                top: widget.position.y * GRID_SIZE,
                width: widget.size.width * GRID_SIZE,
                height: widget.size.height * GRID_SIZE
              }}
              onClick={() => setSelectedWidget(widget.id)}
              drag={isEditing}
              dragMomentum={false}
              dragElastic={0}
              onDragStart={() => setDraggedWidget(widget.id)}
              onDragEnd={(_, info) => {
                const newPosition = {
                  x: Math.round(info.point.x / GRID_SIZE),
                  y: Math.round(info.point.y / GRID_SIZE)
                }
                moveWidget(widget.id, newPosition)
                setDraggedWidget(null)
              }}
              whileDrag={{ scale: 1.05, zIndex: 1000 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              {renderWidget(widget)}
            </motion.div>
          ))}
        </div>

        {/* Add Widget Button */}
        <motion.button
          onClick={() => setIsAddingWidget(true)}
          className="absolute bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <PlusIcon className="h-6 w-6" />
        </motion.button>
      </div>

      {/* Widget Type Selector */}
      <AnimatePresence>
        {isAddingWidget && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-x-0 bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Add Widget
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {WIDGET_TYPES.map(widgetType => (
                      <button
                  key={widgetType.type}
                  onClick={() => addWidget(widgetType.type as DashboardWidget['type'])}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-2xl">{widgetType.icon}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {widgetType.label}
                  </span>
                      </button>
              ))}
            </div>
            <button
              onClick={() => setIsAddingWidget(false)}
              className="w-full mt-4 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Properties Panel */}
      {selectedWidget && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Widget Properties
              </h3>
            <button
              onClick={() => deleteWidget(selectedWidget)}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Widget Configuration */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
                  </label>
                  <input
                    type="text"
                value={widgets.find(w => w.id === selectedWidget)?.title || ''}
                onChange={(e) => updateWidget(selectedWidget, { title: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Position
                  </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="X"
                  value={widgets.find(w => w.id === selectedWidget)?.position.x || 0}
                  onChange={(e) => updateWidget(selectedWidget, { 
                    position: { 
                      ...widgets.find(w => w.id === selectedWidget)?.position || { x: 0, y: 0 },
                      x: parseInt(e.target.value) || 0
                    }
                  })}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                    <input
                  type="number"
                  placeholder="Y"
                  value={widgets.find(w => w.id === selectedWidget)?.position.y || 0}
                  onChange={(e) => updateWidget(selectedWidget, { 
                    position: { 
                      ...widgets.find(w => w.id === selectedWidget)?.position || { x: 0, y: 0 },
                      y: parseInt(e.target.value) || 0
                    }
                  })}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Width"
                  value={widgets.find(w => w.id === selectedWidget)?.size.width || 2}
                  onChange={(e) => updateWidget(selectedWidget, { 
                    size: { 
                      ...widgets.find(w => w.id === selectedWidget)?.size || { width: 2, height: 2 },
                      width: parseInt(e.target.value) || 2
                    }
                  })}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Height"
                  value={widgets.find(w => w.id === selectedWidget)?.size.height || 2}
                  onChange={(e) => updateWidget(selectedWidget, { 
                    size: { 
                      ...widgets.find(w => w.id === selectedWidget)?.size || { width: 2, height: 2 },
                      height: parseInt(e.target.value) || 2
                    }
                  })}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
                </div>
        </motion.div>
      )}
    </div>
  )
}

// Generate sample data for widgets
function generateSampleData(type: DashboardWidget['type']) {
  switch (type) {
    case 'metric':
      return {
        value: Math.floor(Math.random() * 100),
        subtitle: 'Current value'
      }

    case 'trend':
      return {
        value: Math.floor(Math.random() * 50),
        change: (Math.random() - 0.5) * 20,
        changeLabel: 'vs last period'
      }

    case 'comparison':
      return {
        current: Math.floor(Math.random() * 100),
        previous: Math.floor(Math.random() * 100),
        currentLabel: 'Current',
        previousLabel: 'Previous',
        unit: ''
      }

    case 'progress':
      return {
        current: Math.floor(Math.random() * 100),
        target: 100,
        unit: '%'
      }

    case 'chart':
      return {
        chartType: 'line',
        chartData: Array.from({ length: 12 }, (_, i) => ({
          x: i,
          y: Math.floor(Math.random() * 50) + 10,
          label: `${i}:00`
        }))
      }

    case 'grid':
      return {
        stats: [
          { label: 'A', value: Math.floor(Math.random() * 100) },
          { label: 'B', value: Math.floor(Math.random() * 100) },
          { label: 'C', value: Math.floor(Math.random() * 100) },
          { label: 'D', value: Math.floor(Math.random() * 100) }
        ],
        columns: 2
      }

    case 'alert':
      return {
        message: 'This is a sample alert message.',
        severity: 'info'
      }

    default:
      return {}
  }
}