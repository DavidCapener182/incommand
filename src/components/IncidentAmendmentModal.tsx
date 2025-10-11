/**
 * Incident Amendment Modal
 * Allows users to create non-destructive amendments to incident logs
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { Fragment } from 'react'
import { 
  XMarkIcon, 
  CheckIcon,
  ChevronUpDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import {
  AuditableIncidentLog,
  ChangeType,
  AmendableField,
  AMENDABLE_FIELDS,
  FIELD_LABELS,
  CHANGE_TYPE_CONFIG,
  AmendmentFormState
} from '@/types/auditableLog'
import { validateAmendmentRequest } from '@/lib/auditableLogging'
import { useToast } from './Toast'

interface IncidentAmendmentModalProps {
  isOpen: boolean
  onClose: () => void
  incident: AuditableIncidentLog
  onAmendmentCreated?: () => void
}

export default function IncidentAmendmentModal({
  isOpen,
  onClose,
  incident,
  onAmendmentCreated
}: IncidentAmendmentModalProps) {
  const { addToast } = useToast()
  
  const [formState, setFormState] = useState<AmendmentFormState>({
    fieldToAmend: 'occurrence',
    currentValue: '',
    newValue: '',
    changeType: 'amendment',
    changeReason: '',
    isValid: false,
    validationErrors: {}
  })

  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update current value when field selection changes
  useEffect(() => {
    if (incident && formState.fieldToAmend) {
      const value = (incident as any)[formState.fieldToAmend]
      setFormState(prev => ({
        ...prev,
        currentValue: value || '',
        newValue: '',
        validationErrors: {}
      }))
    }
  }, [formState.fieldToAmend, incident])

  // Validate form
  useEffect(() => {
    const validation = validateAmendmentRequest(
      formState.fieldToAmend,
      formState.newValue,
      formState.changeReason
    )

    const errors: Record<string, string> = {}
    validation.errors.forEach(error => {
      if (error.includes('New value')) {
        errors.newValue = error
      } else if (error.includes('reason')) {
        errors.changeReason = error
      } else {
        errors.general = error
      }
    })

    setFormState(prev => ({
      ...prev,
      isValid: validation.isValid,
      validationErrors: errors
    }))
  }, [formState.fieldToAmend, formState.newValue, formState.changeReason])

  // Clear error when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!formState.isValid) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please correct the errors before submitting'
      })
      return
    }

    setLoading(true)

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Call amendment API
      const response = await fetch(`/api/v1/incidents/${incident.id}/amend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          field_changed: formState.fieldToAmend,
          new_value: formState.newValue,
          change_reason: formState.changeReason,
          change_type: formState.changeType
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create amendment')
      }

      addToast({
        type: 'success',
        title: 'Amendment Created',
        message: `Successfully amended ${FIELD_LABELS[formState.fieldToAmend as AmendableField]}`
      })

      // Reset form
      setFormState({
        fieldToAmend: 'occurrence',
        currentValue: '',
        newValue: '',
        changeType: 'amendment',
        changeReason: '',
        isValid: false,
        validationErrors: {}
      })

      setShowConfirmation(false)

      // Call callback
      if (onAmendmentCreated) {
        onAmendmentCreated()
      }

      // Close modal
      onClose()
    } catch (error: any) {
      console.error('Amendment error:', error)
      const errorMessage = error.message || 'An error occurred while creating the amendment'
      setError(errorMessage)
      addToast({
        type: 'error',
        title: 'Amendment Failed',
        message: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (showConfirmation) {
      setShowConfirmation(false)
      setError(null)
    } else {
      setFormState({
        fieldToAmend: 'occurrence',
        currentValue: '',
        newValue: '',
        changeType: 'amendment',
        changeReason: '',
        isValid: false,
        validationErrors: {}
      })
      setError(null)
      onClose()
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={handleCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-[#23408e] p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="div"
                  className="flex items-center justify-between border-b border-gray-200 dark:border-[#2d437a] pb-4 mb-6"
                >
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Amend Incident Log
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Log #{incident.log_number}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    onClick={handleCancel}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                {!showConfirmation ? (
                  /* Amendment Form */
                  <div className="space-y-6">
                    {/* Info Alert */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-semibold mb-1">Non-Destructive Amendment</p>
                        <p>
                          This creates a revision record. The original value is preserved in the audit trail. 
                          All amendments are tracked with full attribution.
                        </p>
                      </div>
                    </div>

                    {/* Field Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Field to Amend
                      </label>
                      <Listbox
                        value={formState.fieldToAmend}
                        onChange={(value) => setFormState(prev => ({ ...prev, fieldToAmend: value }))}
                      >
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white dark:bg-[#182447] py-3 pl-4 pr-10 text-left border border-gray-300 dark:border-[#2d437a] focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <span className="block truncate text-gray-900 dark:text-gray-100">
                              {FIELD_LABELS[formState.fieldToAmend as AmendableField]}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                            </span>
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-[#182447] py-1 shadow-lg border border-gray-300 dark:border-[#2d437a]">
                            {AMENDABLE_FIELDS.map((field) => (
                              <Listbox.Option
                                key={field}
                                value={field}
                                className={({ active }) =>
                                  `cursor-pointer select-none relative py-2 pl-10 pr-4 ${
                                    active ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                                  }`
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'} text-gray-900 dark:text-gray-100`}>
                                      {FIELD_LABELS[field]}
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                                        <CheckIcon className="h-5 w-5" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    </div>

                    {/* Current Value (Read-Only) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Current Value
                      </label>
                      <div className="bg-gray-100 dark:bg-[#1a2a57] rounded-lg p-3 border border-gray-300 dark:border-[#2d437a]">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {formState.currentValue || '(empty)'}
                        </p>
                      </div>
                    </div>

                    {/* New Value */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        New Value *
                      </label>
                      <textarea
                        value={formState.newValue}
                        onChange={(e) => setFormState(prev => ({ ...prev, newValue: e.target.value }))}
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter the new value..."
                      />
                      {formState.validationErrors.newValue && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {formState.validationErrors.newValue}
                        </p>
                      )}
                    </div>

                    {/* Change Type */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Change Type
                      </label>
                      <Listbox
                        value={formState.changeType}
                        onChange={(value) => setFormState(prev => ({ ...prev, changeType: value }))}
                      >
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white dark:bg-[#182447] py-3 pl-4 pr-10 text-left border border-gray-300 dark:border-[#2d437a] focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <span className="block truncate text-gray-900 dark:text-gray-100">
                              {CHANGE_TYPE_CONFIG[formState.changeType].label} - {CHANGE_TYPE_CONFIG[formState.changeType].description}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                            </span>
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-[#182447] py-1 shadow-lg border border-gray-300 dark:border-[#2d437a]">
                            {(Object.keys(CHANGE_TYPE_CONFIG) as ChangeType[]).map((type) => (
                              <Listbox.Option
                                key={type}
                                value={type}
                                className={({ active }) =>
                                  `cursor-pointer select-none relative py-2 pl-10 pr-4 ${
                                    active ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                                  }`
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <div className="text-gray-900 dark:text-gray-100">
                                      <div className={`font-semibold ${selected ? 'font-bold' : ''}`}>
                                        {CHANGE_TYPE_CONFIG[type].label}
                                      </div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {CHANGE_TYPE_CONFIG[type].description}
                                      </div>
                                    </div>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                                        <CheckIcon className="h-5 w-5" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    </div>

                    {/* Change Reason */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Reason for Amendment *
                      </label>
                      <textarea
                        value={formState.changeReason}
                        onChange={(e) => setFormState(prev => ({ ...prev, changeReason: e.target.value }))}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Explain why this amendment is necessary (minimum 10 characters)..."
                      />
                      {formState.validationErrors.changeReason && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {formState.validationErrors.changeReason}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        This reason will be permanently recorded in the audit trail
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 px-4 py-3 bg-gray-200 dark:bg-[#1a2a57] text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-[#182447] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmation(true)}
                        disabled={!formState.isValid}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Preview Amendment
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Confirmation View */
                  <div className="space-y-6">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-semibold mb-1">Confirm Amendment</p>
                        <p>
                          Please review the changes below. This amendment will be permanently recorded in the audit trail.
                        </p>
                      </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-800 dark:text-red-200">
                          <p className="font-semibold mb-1">❌ Amendment Failed</p>
                          <p>{error}</p>
                          <button
                            onClick={() => setError(null)}
                            className="mt-2 text-xs underline hover:no-underline"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Amendment Summary */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Field Being Amended:
                        </h4>
                        <p className="text-gray-900 dark:text-gray-100">
                          {FIELD_LABELS[formState.fieldToAmend as AmendableField]}
                        </p>
                      </div>

                      <div className="bg-gray-50 dark:bg-[#1a2a57] rounded-lg p-4 space-y-3">
                        <div>
                          <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
                            Current Value:
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 bg-red-50 dark:bg-red-900/20 p-3 rounded border-l-4 border-red-500">
                            {formState.currentValue || '(empty)'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">
                            New Value:
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 p-3 rounded border-l-4 border-green-500">
                            {formState.newValue}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Change Type:
                        </h4>
                        <p className="text-gray-900 dark:text-gray-100">
                          {CHANGE_TYPE_CONFIG[formState.changeType].label}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Reason:
                        </h4>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {formState.changeReason}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Confirmation Actions */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowConfirmation(false)}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-gray-200 dark:bg-[#1a2a57] text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-[#182447] transition-colors disabled:opacity-50"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Creating Amendment...</span>
                          </>
                        ) : (
                          <>
                            <CheckIcon className="h-5 w-5" />
                            <span>Confirm Amendment</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

