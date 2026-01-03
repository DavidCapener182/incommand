/**
 * Decision Logger Component
 * Feature 3: Golden Thread Decision Logging
 * 
 * Modal component for creating and editing decisions
 */

'use client'

import React, { useState, useEffect } from 'react'
import { XMarkIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import type { Decision, DecisionCreateInput, DecisionUpdateInput, DecisionOption } from '@/types/decisions'
import { useToast } from '../Toast'

interface DecisionLoggerProps {
  eventId: string
  isOpen: boolean
  onClose: () => void
  onDecisionCreated?: (decision: Decision) => void
  initialDecision?: Decision
  linkedIncidentIds?: number[]
}

interface FormData {
  trigger_issue: string
  options: DecisionOption[]
  information_available: Record<string, any>
  decision_taken: string
  rationale: string
  decision_owner_id?: string
  decision_owner_callsign?: string
  role_level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'other'
  location: string
  follow_up_review_time: string
}

const ROLE_LEVELS: Array<{ value: string; label: string }> = [
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'other', label: 'Other' },
]

export default function DecisionLogger({
  eventId,
  isOpen,
  onClose,
  onDecisionCreated,
  initialDecision,
  linkedIncidentIds = [],
}: DecisionLoggerProps) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    trigger_issue: '',
    options: [{ option: '', pros: [], cons: [] }],
    information_available: {},
    decision_taken: '',
    rationale: '',
    role_level: 'other',
    location: '',
    follow_up_review_time: '',
  })

  // Initialize form from initialDecision if editing
  useEffect(() => {
    if (initialDecision && isOpen) {
      setFormData({
        trigger_issue: initialDecision.trigger_issue,
        options: (initialDecision.options_considered as DecisionOption[]) || [{ option: '', pros: [], cons: [] }],
        information_available: (initialDecision.information_available as Record<string, any>) || {},
        decision_taken: initialDecision.decision_taken,
        rationale: initialDecision.rationale,
        decision_owner_id: initialDecision.decision_owner_id || undefined,
        decision_owner_callsign: initialDecision.decision_owner_callsign || undefined,
        role_level: initialDecision.role_level as any,
        location: initialDecision.location || '',
        follow_up_review_time: initialDecision.follow_up_review_time || '',
      })
    } else if (isOpen) {
      // Reset form for new decision
      setFormData({
        trigger_issue: '',
        options: [{ option: '', pros: [], cons: [] }],
        information_available: {},
        decision_taken: '',
        rationale: '',
        role_level: 'other',
        location: '',
        follow_up_review_time: '',
      })
    }
  }, [initialDecision, isOpen])

  const handleOptionChange = (index: number, field: keyof DecisionOption, value: any) => {
    const newOptions = [...formData.options]
    if (field === 'option') {
      newOptions[index] = { ...newOptions[index], option: value }
    } else if (field === 'pros') {
      newOptions[index] = { ...newOptions[index], pros: Array.isArray(value) ? value : [value] }
    } else if (field === 'cons') {
      newOptions[index] = { ...newOptions[index], cons: Array.isArray(value) ? value : [value] }
    }
    setFormData({ ...formData, options: newOptions })
  }

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { option: '', pros: [], cons: [] }],
    })
  }

  const removeOption = (index: number) => {
    if (formData.options.length > 1) {
      const newOptions = formData.options.filter((_, i) => i !== index)
      setFormData({ ...formData, options: newOptions })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.trigger_issue.trim()) {
      setError('Trigger issue is required')
      return
    }
    if (!formData.decision_taken.trim()) {
      setError('Decision taken is required')
      return
    }
    if (!formData.rationale.trim()) {
      setError('Rationale is required')
      return
    }
    if (!formData.decision_owner_id && !formData.decision_owner_callsign) {
      setError('Either decision owner ID or callsign is required')
      return
    }

    setLoading(true)

    try {
      const payload: DecisionCreateInput = {
        event_id: Number(eventId),
        trigger_issue: formData.trigger_issue,
        options_considered: formData.options.filter(opt => opt.option.trim()),
        information_available: formData.information_available,
        decision_taken: formData.decision_taken,
        rationale: formData.rationale,
        decision_owner_id: formData.decision_owner_id,
        decision_owner_callsign: formData.decision_owner_callsign,
        role_level: formData.role_level,
        location: formData.location || undefined,
        follow_up_review_time: formData.follow_up_review_time || undefined,
        linked_incident_ids: linkedIncidentIds.length > 0 ? linkedIncidentIds : undefined,
      }

      if (initialDecision) {
        // Update existing decision
        const response = await fetch(`/api/decisions/${initialDecision.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update decision')
        }

        const { decision } = await response.json()
        addToast({
          type: 'success',
          title: 'Success',
          message: 'Decision updated successfully',
        })
        onDecisionCreated?.(decision)
      } else {
        // Create new decision
        const response = await fetch('/api/decisions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to create decision')
        }

        const { decision } = await response.json()
        addToast({
          type: 'success',
          title: 'Success',
          message: 'Decision created successfully',
        })
        onDecisionCreated?.(decision)
      }

      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      console.error('Error saving decision:', err)
    } finally {
      setLoading(false)
    }
  }

  // Safety check - don't render if eventId is missing or modal is closed
  if (!isOpen || !eventId) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initialDecision ? 'Edit Decision' : 'Log Decision'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Trigger Issue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trigger / Issue *
            </label>
            <textarea
              value={formData.trigger_issue}
              onChange={(e) => setFormData({ ...formData, trigger_issue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              required
              placeholder="Describe the issue or situation that triggered this decision..."
            />
          </div>

          {/* Options Considered */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Options Considered
            </label>
            {formData.options.map((option, index) => (
              <div key={index} className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Option {index + 1}
                  </span>
                  {formData.options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={option.option}
                  onChange={(e) => handleOptionChange(index, 'option', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
                  placeholder="Option description..."
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Pros</label>
                    <textarea
                      value={option.pros.join(', ')}
                      onChange={(e) => handleOptionChange(index, 'pros', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={2}
                      placeholder="Pros (comma-separated)..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Cons</label>
                    <textarea
                      value={option.cons.join(', ')}
                      onChange={(e) => handleOptionChange(index, 'cons', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={2}
                      placeholder="Cons (comma-separated)..."
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              + Add Option
            </button>
          </div>

          {/* Decision Taken */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Decision Taken *
            </label>
            <textarea
              value={formData.decision_taken}
              onChange={(e) => setFormData({ ...formData, decision_taken: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              required
              placeholder="Describe the decision that was taken..."
            />
          </div>

          {/* Rationale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rationale *
            </label>
            <textarea
              value={formData.rationale}
              onChange={(e) => setFormData({ ...formData, rationale: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={4}
              required
              placeholder="Explain the reasoning behind this decision..."
            />
          </div>

          {/* Decision Owner */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Decision Owner Callsign
              </label>
              <input
                type="text"
                value={formData.decision_owner_callsign || ''}
                onChange={(e) => setFormData({ ...formData, decision_owner_callsign: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Control-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role Level *
              </label>
              <select
                value={formData.role_level}
                onChange={(e) => setFormData({ ...formData, role_level: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                {ROLE_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location and Follow-up */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Gate A, Zone 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Follow-up Review Time
              </label>
              <input
                type="datetime-local"
                value={formData.follow_up_review_time}
                onChange={(e) => setFormData({ ...formData, follow_up_review_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : initialDecision ? 'Update Decision' : 'Save Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

