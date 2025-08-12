'use client'

import React, { useState, useEffect } from 'react'
import { useRole } from '../../../../hooks/useRole'
import { supabase } from '../../../../lib/supabase'
import { NotificationTemplate, TEMPLATE_CATEGORIES } from '../../../../types/settings'
import { 
  DocumentTextIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  BellIcon
} from '@heroicons/react/24/outline'

interface TemplateFormData {
  template_name: string
  subject: string
  body: string
  category: 'incident' | 'system' | 'user' | 'general'
  is_active: boolean
  variables: string[]
}

const NotificationTemplatesPage: React.FC = () => {
  const { isAdmin } = useRole()
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<Record<string, any>>({})
  
  const [formData, setFormData] = useState<TemplateFormData>({
    template_name: '',
    subject: '',
    body: '',
    category: 'general',
    is_active: true,
    variables: []
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading templates:', error)
        return
      }

      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      template_name: '',
      subject: '',
      body: '',
      category: 'general',
      is_active: true,
      variables: []
    })
    setEditingTemplate(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAdmin) {
      alert('Only administrators can manage templates')
      return
    }

    try {
      const templateData = {
        ...formData,
        variables: formData.variables.filter(v => v.trim() !== '')
      }

      if (editingTemplate) {
        const { error } = await supabase
          .from('notification_templates')
          .update({
            ...templateData,
            version: editingTemplate.version + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTemplate.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('notification_templates')
          .insert([templateData])

        if (error) throw error
      }

      await loadTemplates()
      resetForm()
      setShowForm(false)
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template')
    }
  }

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template)
    setFormData({
      template_name: template.template_name,
      subject: template.subject,
      body: template.body,
      category: template.category,
      is_active: template.is_active,
      variables: template.variables
    })
    setShowForm(true)
  }

  const handleDelete = async (templateId: string) => {
    if (!isAdmin) {
      alert('Only administrators can delete templates')
      return
    }

    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error

      await loadTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template')
    }
  }

  const handlePreview = (template: NotificationTemplate) => {
    // Generate sample data for preview
    const sampleData: Record<string, any> = {}
    template.variables.forEach(variable => {
      switch (variable) {
        case 'user_name':
          sampleData[variable] = 'John Doe'
          break
        case 'incident_type':
          sampleData[variable] = 'Medical Emergency'
          break
        case 'venue_name':
          sampleData[variable] = 'Main Stadium'
          break
        case 'incident_id':
          sampleData[variable] = 'INC-2024-001'
          break
        case 'location':
          sampleData[variable] = 'Section A, Row 15'
          break
        case 'priority':
          sampleData[variable] = 'High'
          break
        case 'date':
          sampleData[variable] = new Date().toLocaleDateString()
          break
        case 'total_incidents':
          sampleData[variable] = '5'
          break
        case 'resolved_incidents':
          sampleData[variable] = '3'
          break
        case 'pending_incidents':
          sampleData[variable] = '2'
          break
        case 'start_time':
          sampleData[variable] = '10:00 PM'
          break
        case 'end_time':
          sampleData[variable] = '12:00 AM'
          break
        case 'reason':
          sampleData[variable] = 'System maintenance and updates'
          break
        default:
          sampleData[variable] = `[${variable}]`
      }
    })
    
    setPreviewData(sampleData)
    setFormData({
      template_name: template.template_name,
      subject: template.subject,
      body: template.body,
      category: template.category,
      is_active: template.is_active,
      variables: template.variables
    })
    setShowPreview(true)
  }

  const renderTemplate = (template: string, variables: Record<string, any>) => {
    let rendered = template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      rendered = rendered.replace(regex, value)
    })
    return rendered
  }

  const extractVariables = (text: string) => {
    const regex = /{{([^}]+)}}/g
    const variables: string[] = []
    let match
    
    while ((match = regex.exec(text)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1])
      }
    }
    
    return variables
  }

  const handleBodyChange = (body: string) => {
    setFormData(prev => ({
      ...prev,
      body,
      variables: extractVariables(body)
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <DocumentTextIcon className="h-8 w-8 mr-3 text-blue-600" />
            Notification Templates
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage notification templates for different types of alerts and messages
          </p>
        </div>

        {/* Template List */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Templates ({templates.length})
            </h2>
            {isAdmin && (
              <button
                onClick={() => {
                  resetForm()
                  setShowForm(true)
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <PlusIcon className="h-4 w-4 inline mr-2" />
                New Template
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {template.template_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {template.category}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {template.is_active && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </span>
                    )}
                    {template.is_admin_managed && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Admin
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject:
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {template.subject}
                  </p>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Variables:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable) => (
                      <span
                        key={variable}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>v{template.version}</span>
                  <span>{new Date(template.updated_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <button
                    onClick={() => handlePreview(template)}
                    className="flex-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    <EyeIcon className="h-3 w-3 inline mr-1" />
                    Preview
                  </button>
                  {isAdmin && !template.is_admin_managed && (
                    <>
                      <button
                        onClick={() => handleEdit(template)}
                        className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      >
                        <PencilIcon className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="px-3 py-1.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-sm font-medium rounded-md hover:bg-red-200 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No templates found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {isAdmin ? 'Create your first notification template to get started.' : 'No notification templates are available.'}
              </p>
            </div>
          )}
        </div>

        {/* Template Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {editingTemplate ? 'Edit Template' : 'New Template'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false)
                      resetForm()
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Template Name
                      </label>
                      <input
                        type="text"
                        value={formData.template_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Incident Alert"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {TEMPLATE_CATEGORIES.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., New Incident Reported - {{incident_type}}"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Body
                    </label>
                    <textarea
                      value={formData.body}
                      onChange={(e) => handleBodyChange(e.target.value)}
                      required
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your template content. Use {{variable_name}} for dynamic content."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Detected Variables
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {formData.variables.map((variable) => (
                        <span
                          key={variable}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {variable}
                        </span>
                      ))}
                      {formData.variables.length === 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          No variables detected. Use {{variable_name}} format to add variables.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Active
                    </label>
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false)
                        resetForm()
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      {editingTemplate ? 'Update Template' : 'Create Template'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                    <BellIcon className="h-5 w-5 mr-2" />
                    Template Preview
                  </h2>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {renderTemplate(formData.subject, previewData)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Body
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                        {renderTemplate(formData.body, previewData)}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sample Data Used
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(previewData).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                            <span className="text-gray-900 dark:text-white font-mono">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationTemplatesPage
