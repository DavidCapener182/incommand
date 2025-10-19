'use client'

import React, { useState, useEffect } from 'react'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  TagIcon,
  ClockIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline'
import { 
  metricBuilder, 
  type CustomMetric, 
  type MetricTemplate,
  type MetricCalculation
} from '@/lib/customMetrics/metricBuilder'

interface CustomMetricBuilderProps {
  eventId?: string
  onMetricCreated?: (metric: CustomMetric) => void
  onMetricUpdated?: (metric: CustomMetric) => void
  className?: string
}

const CATEGORIES = [
  { value: 'operational', label: 'Operational', color: 'bg-blue-100 text-blue-800' },
  { value: 'quality', label: 'Quality', color: 'bg-green-100 text-green-800' },
  { value: 'compliance', label: 'Compliance', color: 'bg-purple-100 text-purple-800' },
  { value: 'performance', label: 'Performance', color: 'bg-orange-100 text-orange-800' },
  { value: 'financial', label: 'Financial', color: 'bg-yellow-100 text-yellow-800' }
]

const DATA_SOURCES = [
  { value: 'incidents', label: 'Incidents' },
  { value: 'logs', label: 'Logs' },
  { value: 'staff', label: 'Staff' },
  { value: 'events', label: 'Events' },
  { value: 'combined', label: 'Combined' }
]

const AGGREGATIONS = [
  { value: 'sum', label: 'Sum' },
  { value: 'average', label: 'Average' },
  { value: 'count', label: 'Count' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'median', label: 'Median' },
  { value: 'custom', label: 'Custom Formula' }
]

const TIME_WINDOWS = [
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'event', label: 'Full Event' },
  { value: 'custom', label: 'Custom Range' }
]

const VISUALIZATION_TYPES = [
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'gauge', label: 'Gauge', icon: '⏱️' },
  { value: 'line', label: 'Line Chart', icon: '📈' },
  { value: 'bar', label: 'Bar Chart', icon: '📊' },
  { value: 'pie', label: 'Pie Chart', icon: '🥧' },
  { value: 'area', label: 'Area Chart', icon: '📉' },
  { value: 'scatter', label: 'Scatter Plot', icon: '⚪' }
]

export default function CustomMetricBuilder({ 
  eventId, 
  onMetricCreated, 
  onMetricUpdated, 
  className = '' 
}: CustomMetricBuilderProps) {
  const [metrics, setMetrics] = useState<CustomMetric[]>([])
  const [templates, setTemplates] = useState<MetricTemplate[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMetric, setEditingMetric] = useState<CustomMetric | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<MetricTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'my-metrics' | 'templates'>('my-metrics')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'operational' as CustomMetric['category'],
    formula: '',
    dataSource: 'incidents' as CustomMetric['dataSource'],
    aggregation: 'average' as CustomMetric['aggregation'],
    timeWindow: 'day' as CustomMetric['timeWindow'],
    visualization: {
      type: 'gauge' as CustomMetric['visualization']['type'],
      color: '#3B82F6',
      size: 'medium' as CustomMetric['visualization']['size'],
      showTrend: true,
      showComparison: true
    },
    tags: [] as string[],
    isPublic: false
  })

  const [newTag, setNewTag] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Load metrics and templates
  useEffect(() => {
    loadMetrics()
    loadTemplates()
  }, [])

  const loadMetrics = () => {
    const allMetrics = metricBuilder.getAllMetrics()
    setMetrics(allMetrics)
  }

  const loadTemplates = () => {
    const allTemplates = metricBuilder.getTemplates()
    setTemplates(allTemplates)
  }

  const handleCreateMetric = async () => {
    setLoading(true)
    try {
      const validation = metricBuilder.validateMetric(formData)
      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        return
      }

      const newMetric = metricBuilder.createMetric({
        ...formData,
        filters: [],
        thresholds: [],
        createdBy: 'current-user' // This would come from auth context
      })

      setMetrics(prev => [...prev, newMetric])
      onMetricCreated?.(newMetric)
      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error creating metric:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMetric = async () => {
    if (!editingMetric) return

    setLoading(true)
    try {
      const validation = metricBuilder.validateMetric(formData)
      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        return
      }

      const updatedMetric = metricBuilder.updateMetric(editingMetric.id, formData)
      if (updatedMetric) {
        setMetrics(prev => prev.map(m => m.id === editingMetric.id ? updatedMetric : m))
        onMetricUpdated?.(updatedMetric)
        resetForm()
        setEditingMetric(null)
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error('Error updating metric:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMetric = (metricId: string) => {
    if (confirm('Are you sure you want to delete this metric?')) {
      metricBuilder.deleteMetric(metricId)
      setMetrics(prev => prev.filter(m => m.id !== metricId))
    }
  }

  const handleCreateFromTemplate = (template: MetricTemplate) => {
    try {
      const newMetric = metricBuilder.createFromTemplate(template.id, {
        name: `${template.name} (Custom)`,
        createdBy: 'current-user',
        isPublic: false
      })

      setMetrics(prev => [...prev, newMetric])
      onMetricCreated?.(newMetric)
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Error creating metric from template:', error)
    }
  }

  const handleEditMetric = (metric: CustomMetric) => {
    setEditingMetric(metric)
    setFormData({
      name: metric.name,
      description: metric.description,
      category: metric.category,
      formula: metric.formula,
      dataSource: metric.dataSource,
      aggregation: metric.aggregation,
      timeWindow: metric.timeWindow,
      visualization: metric.visualization,
      tags: metric.tags,
      isPublic: metric.isPublic
    })
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'operational',
      formula: '',
      dataSource: 'incidents',
      aggregation: 'average',
      timeWindow: 'day',
      visualization: {
        type: 'gauge',
        color: '#3B82F6',
        size: 'medium',
        showTrend: true,
        showComparison: true
      },
      tags: [],
      isPublic: false
    })
    setEditingMetric(null)
    setSelectedTemplate(null)
    setValidationErrors([])
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openTemplateModal = (template: MetricTemplate) => {
    setSelectedTemplate(template)
  }

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 p-6 card-depth ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Cog6ToothIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Custom Metric Builder</h2>
            <p className="text-gray-600 dark:text-gray-400">Create and manage your own KPIs</p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Metric</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab('my-metrics')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'my-metrics'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          My Metrics ({metrics.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'templates'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Templates ({templates.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'my-metrics' ? (
        <div className="space-y-4">
          {metrics.length === 0 ? (
            <div className="text-center py-12">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No custom metrics</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first custom metric to get started</p>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Create Your First Metric
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((metric) => (
                <div key={metric.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{metric.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{metric.description}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORIES.find(c => c.value === metric.category)?.color || 'bg-gray-100 text-gray-800'}`}>
                          {CATEGORIES.find(c => c.value === metric.category)?.label}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {VISUALIZATION_TYPES.find(v => v.value === metric.visualization.type)?.icon}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {metric.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                        {metric.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                            +{metric.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditMetric(metric)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit metric"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMetric(metric.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete metric"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Updated {new Date(metric.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{template.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORIES.find(c => c.value === template.category)?.color || 'bg-gray-100 text-gray-800'}`}>
                        {CATEGORIES.find(c => c.value === template.category)?.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {template.industry}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleCreateFromTemplate(template)}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto card-modal">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingMetric ? 'Edit Metric' : 'Create New Metric'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="text-sm text-red-800 dark:text-red-200">
                    <strong>Please fix the following errors:</strong>
                    <ul className="mt-1 list-disc list-inside">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Form */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Metric Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Average Response Time"
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
                    rows={3}
                    placeholder="Describe what this metric measures..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as CustomMetric['category'] }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {CATEGORIES.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data Source
                    </label>
                    <select
                      value={formData.dataSource}
                      onChange={(e) => setFormData(prev => ({ ...prev, dataSource: e.target.value as CustomMetric['dataSource'] }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {DATA_SOURCES.map(source => (
                        <option key={source.value} value={source.value}>
                          {source.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Formula
                  </label>
                  <input
                    type="text"
                    value={formData.formula}
                    onChange={(e) => setFormData(prev => ({ ...prev, formula: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., {response_time} or {count} * 0.5"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Use field names in curly braces: {`{field_name}`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Aggregation
                    </label>
                    <select
                      value={formData.aggregation}
                      onChange={(e) => setFormData(prev => ({ ...prev, aggregation: e.target.value as CustomMetric['aggregation'] }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {AGGREGATIONS.map(agg => (
                        <option key={agg.value} value={agg.value}>
                          {agg.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time Window
                    </label>
                    <select
                      value={formData.timeWindow}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeWindow: e.target.value as CustomMetric['timeWindow'] }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {TIME_WINDOWS.map(window => (
                        <option key={window.value} value={window.value}>
                          {window.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Visualization Type
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {VISUALIZATION_TYPES.map(type => (
                      <button
                        key={type.value}
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          visualization: { ...prev.visualization, type: type.value as CustomMetric['visualization']['type'] }
                        }))}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          formData.visualization.type === type.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-2xl mb-1">{type.icon}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Add a tag..."
                    />
                    <button
                      onClick={addTag}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Make this metric public</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingMetric ? handleUpdateMetric : handleCreateMetric}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Saving...' : editingMetric ? 'Update Metric' : 'Create Metric'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
