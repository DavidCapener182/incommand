'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircleIcon, XMarkIcon, PencilSquareIcon } from '@heroicons/react/24/outline'

interface ParsedField {
  label: string
  value: string
  icon?: React.ReactNode
}

interface ParsedFieldsPreviewProps {
  fields: ParsedField[]
  onApply: () => void
  onEdit: () => void
  onCancel: () => void
  isLoading?: boolean
}

export default function ParsedFieldsPreview({
  fields,
  onApply,
  onEdit,
  onCancel,
  isLoading = false
}: ParsedFieldsPreviewProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 p-6"
      >
        <div className="flex items-center justify-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-blue-700 dark:text-blue-300 font-medium">
            AI is parsing your input...
          </span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-800 p-6 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
            Parsed Information
          </h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Parsed Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {fields.map((field, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700"
          >
            <div className="flex items-start gap-2">
              {field.icon && (
                <div className="text-green-600 dark:text-green-400 mt-0.5">
                  {field.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {field.label}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                  {field.value || (
                    <span className="text-gray-400 dark:text-gray-500 italic">
                      Not detected
                    </span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <motion.button
          type="button"
          onClick={onApply}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <CheckCircleIcon className="h-5 w-5" />
          Apply to Form
        </motion.button>
        <motion.button
          type="button"
          onClick={onEdit}
          className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 rounded-lg transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <PencilSquareIcon className="h-5 w-5" />
          Edit Manually
        </motion.button>
      </div>

      <p className="mt-3 text-xs text-center text-gray-600 dark:text-gray-400">
        Review the parsed information and apply it to the form, or edit manually if needed.
      </p>
    </motion.div>
  )
}

