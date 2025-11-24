'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PlusIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  FolderIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { CARD_REGISTRY, getCardsByCategory, getCardById, type CardMetadata } from '@/lib/analytics/cardRegistry'
import { getCategories } from '@/lib/analytics/cardRegistry'
import CustomDashboardViewer from './CustomDashboardViewer'

interface CustomDashboardBuilderProps {
  eventId: string
  onSave?: (dashboard: any) => void
  onCancel?: () => void
  className?: string
}

interface SavedDashboard {
  id: string
  name: string
  description: string | null
  card_ids: string[]
  layout_config: any
  is_default: boolean
  created_at: string
  updated_at: string
}

export default function CustomDashboardBuilder({ 
  eventId, 
  onSave,
  onCancel,
  className = '' 
}: CustomDashboardBuilderProps) {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([])
  const [dashboardName, setDashboardName] = useState('')
  const [dashboardDescription, setDashboardDescription] = useState('')
  const [savedDashboards, setSavedDashboards] = useState<SavedDashboard[]>([])
  const [selectedDashboard, setSelectedDashboard] = useState<SavedDashboard | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all')
  const [viewMode, setViewMode] = useState<'builder' | 'viewer'>('builder')

  // Load user and company info
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setUserId(user.id)

        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .maybeSingle()

        if (profile?.company_id) {
          setCompanyId(profile.company_id)
        }
      } catch (error) {
        console.error('Error loading user info:', error)
      }
    }

    loadUserInfo()
  }, [])

  // Load saved dashboards
  useEffect(() => {
    if (!userId) return

    const loadDashboards = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('custom_dashboards' as any)
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error

        setSavedDashboards((data || []) as unknown as SavedDashboard[])
        
        // Load default dashboard if exists
        const defaultDashboard = (data || []).find((d: any) => d.is_default) as SavedDashboard | undefined
        if (defaultDashboard) {
          setSelectedDashboard(defaultDashboard)
          setSelectedCardIds(defaultDashboard.card_ids || [])
          setDashboardName(defaultDashboard.name)
          setDashboardDescription(defaultDashboard.description || '')
        }
      } catch (error) {
        console.error('Error loading dashboards:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboards()
  }, [userId])

  // Toggle card selection
  const toggleCard = useCallback((cardId: string) => {
    setSelectedCardIds(prev => 
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    )
  }, [])

  // Save dashboard
  const saveDashboard = useCallback(async () => {
    if (!userId || !companyId || !dashboardName.trim()) {
      alert('Please enter a dashboard name')
      return
    }

    setIsSaving(true)
    try {
      const dashboardData = {
        user_id: userId,
        company_id: companyId,
        name: dashboardName.trim(),
        description: dashboardDescription.trim() || null,
        card_ids: selectedCardIds,
        layout_config: {},
        is_default: selectedDashboard?.is_default || false
      }

      if (selectedDashboard) {
        // Update existing dashboard
        const { error } = await supabase
          .from('custom_dashboards' as any)
          .update(dashboardData)
          .eq('id', selectedDashboard.id)

        if (error) throw error
      } else {
        // Create new dashboard
        const { error } = await supabase
          .from('custom_dashboards' as any)
          .insert(dashboardData)

        if (error) throw error
      }

      // Reload dashboards
      const { data } = await supabase
        .from('custom_dashboards' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      setSavedDashboards((data || []) as unknown as SavedDashboard[])
      // Reload the selected dashboard
      const updated = (data || []).find((d: any) => 
        selectedDashboard ? d.id === selectedDashboard.id : d.name === dashboardData.name
      ) as SavedDashboard | undefined
      if (updated) {
        setSelectedDashboard(updated)
      }
      onSave?.(dashboardData)
      alert('Dashboard saved successfully!')
    } catch (error) {
      console.error('Error saving dashboard:', error)
      alert('Failed to save dashboard')
    } finally {
      setIsSaving(false)
    }
  }, [userId, companyId, dashboardName, dashboardDescription, selectedCardIds, selectedDashboard, onSave])

  // Load dashboard
  const loadDashboard = useCallback((dashboard: SavedDashboard) => {
    setSelectedDashboard(dashboard)
    setSelectedCardIds(dashboard.card_ids || [])
    setDashboardName(dashboard.name)
    setDashboardDescription(dashboard.description || '')
    setViewMode('viewer')
  }, [])

  // Delete dashboard
  const deleteDashboard = useCallback(async (dashboardId: string) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return

    try {
      const { error } = await supabase
        .from('custom_dashboards' as any)
        .delete()
        .eq('id', dashboardId)

      if (error) throw error

      setSavedDashboards(prev => prev.filter(d => d.id !== dashboardId))
      if (selectedDashboard?.id === dashboardId) {
        setSelectedDashboard(null)
        setSelectedCardIds([])
        setDashboardName('')
        setDashboardDescription('')
      }
    } catch (error) {
      console.error('Error deleting dashboard:', error)
      alert('Failed to delete dashboard')
    }
  }, [selectedDashboard])

  // Create new dashboard
  const createNewDashboard = useCallback(() => {
    setSelectedDashboard(null)
    setSelectedCardIds([])
    setDashboardName('')
    setDashboardDescription('')
  }, [])

  // Filter cards
  const filteredCards = CARD_REGISTRY.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         card.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || card.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...getCategories()]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Show viewer if a dashboard is selected and in viewer mode
  if (viewMode === 'viewer' && selectedDashboard) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedDashboard.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {selectedDashboard.description || 'Custom dashboard'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('builder')}
              className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              title="Edit Dashboard"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="p-2 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                title="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <CustomDashboardViewer
            dashboardId={selectedDashboard.id}
            eventId={eventId}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Custom Dashboard Builder
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Select cards to display on your custom dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={createNewDashboard}
            className="p-2 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="New Dashboard"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
          <button
            onClick={saveDashboard}
            disabled={isSaving || !dashboardName.trim()}
            className="p-2 bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save Dashboard"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
              title="Cancel"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Card Selection */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Dashboard Info */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dashboard Name *
              </label>
              <input
                type="text"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="My Custom Dashboard"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={dashboardDescription}
                onChange={(e) => setDashboardDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Search and Filter */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Card List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Available Cards ({filteredCards.length})
            </div>
            {filteredCards.map(card => {
              const isSelected = selectedCardIds.includes(card.id)
              return (
                <motion.button
                  key={card.id}
                  onClick={() => toggleCard(card.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && <CheckIcon className="h-4 w-4 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {card.icon && <span className="text-lg">{card.icon}</span>}
                        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {card.name}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {card.description}
                      </div>
                      <div className="mt-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {card.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Right Side - Preview and Saved Dashboards */}
        <div className="flex-1 flex flex-col">
          {/* Selected Cards Count */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Selected: {selectedCardIds.length} card{selectedCardIds.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedCardIds.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <FolderIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No cards selected</p>
                  <p className="text-sm mt-1">Select cards from the left to build your dashboard</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCardIds.map(cardId => {
                  const card = getCardById(cardId)
                  if (!card) return null
                  
                  return (
                    <div
                      key={cardId}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {card.icon && <span>{card.icon}</span>}
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {card.name}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {card.description}
                      </div>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                        Preview will show here when viewing the dashboard
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Saved Dashboards */}
          {savedDashboards.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Saved Dashboards
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {savedDashboards.map(dashboard => (
                  <div
                    key={dashboard.id}
                    className={`flex items-center justify-between p-2 rounded-lg border ${
                      selectedDashboard?.id === dashboard.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <button
                      onClick={() => loadDashboard(dashboard)}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {dashboard.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {dashboard.card_ids.length} cards
                      </div>
                    </button>
                    <button
                      onClick={() => deleteDashboard(dashboard.id)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
