import React from 'react'
import { motion } from 'framer-motion'
import { CheckIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { getIncidentTypeIcon } from '@/utils/incidentIcons'

interface ParsedIncidentData {
  incidentType?: string
  location?: string
  callsign?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  description?: string
  confidence?: number
}

interface ParsedFieldsPreviewProps {
  data: ParsedIncidentData
  onApply: () => void
  onEdit: () => void
  onCancel: () => void
  onUpdateCallsign?: (callsign: string) => void
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'text-red-600 bg-red-50 border-red-200'
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'low': return 'text-green-600 bg-green-50 border-green-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'urgent': return '🔴'
    case 'high': return '🟠'
    case 'medium': return '🟡'
    case 'low': return '🟢'
    default: return '⚪'
  }
}

export default function ParsedFieldsPreview({
  data,
  onApply,
  onEdit,
  onCancel,
  onUpdateCallsign
}: ParsedFieldsPreviewProps) {
  const iconConfig = data.incidentType ? getIncidentTypeIcon(data.incidentType) : null
  const IconComponent = iconConfig?.icon
  
  // Check if callsign is missing
  const isCallsignMissing = !data.callsign || data.callsign.trim() === ''
  
  // Disable Apply All if callsign is missing
  const canApply = !isCallsignMissing

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 text-sm">🤖</span>
          </div>
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            AI Parsed Data
          </h4>
          {data.confidence && (
            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded-full">
              {Math.round(data.confidence * 100)}% confidence
            </span>
          )}
        </div>
        <button
          onClick={onCancel}
          className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Parsed fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Incident Type */}
        {data.incidentType && (
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border">
            <div className="flex-shrink-0">
              {IconComponent && <IconComponent className="w-4 h-4 text-blue-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 dark:text-gray-400">Incident Type</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {data.incidentType}
              </div>
            </div>
          </div>
        )}

        {/* Priority */}
        {data.priority && (
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border">
            <div className="flex-shrink-0">
              <span className="text-sm">{getPriorityIcon(data.priority)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 dark:text-gray-400">Priority</div>
              <div className={`text-sm font-medium capitalize px-2 py-1 rounded-full inline-block ${getPriorityColor(data.priority)}`}>
                {data.priority}
              </div>
            </div>
          </div>
        )}

        {/* Location */}
        {data.location && (
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border">
            <div className="flex-shrink-0">
              <span className="text-sm">📍</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 dark:text-gray-400">Location</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {data.location}
              </div>
            </div>
          </div>
        )}

        {/* Callsign */}
        <div className={`flex items-center gap-2 p-2 rounded border ${
          isCallsignMissing 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' 
            : 'bg-white dark:bg-gray-800'
        }`}>
          <div className="flex-shrink-0">
            <span className="text-sm">📻</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 dark:text-gray-400">Callsign</div>
            {isCallsignMissing ? (
              <input
                type="text"
                placeholder="Enter callsign or person name..."
                className="w-full text-sm font-medium text-gray-900 dark:text-white bg-transparent border-none outline-none placeholder-gray-400"
                onBlur={(e) => onUpdateCallsign?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onUpdateCallsign?.(e.currentTarget.value)
                  }
                }}
                autoFocus
              />
            ) : (
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {data.callsign}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warning message for missing callsign */}
      {isCallsignMissing && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-600 dark:text-red-400">⚠️</span>
            <div className="text-sm text-red-700 dark:text-red-300">
              <strong>Callsign/Person required:</strong> Please enter a callsign or person name before applying the incident.
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      {data.description && (
        <div className="p-2 bg-white dark:bg-gray-800 rounded border">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</div>
          <div className="text-sm text-gray-900 dark:text-white">
            {data.description}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-blue-200 dark:border-blue-700">
        <button
          onClick={onApply}
          disabled={!canApply}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            canApply
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          <CheckIcon className="w-4 h-4" />
          Apply All
        </button>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
        >
          <PencilIcon className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </motion.div>
  )
}
