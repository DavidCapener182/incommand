'use client'

import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import Fuse from 'fuse.js'

import { useToast } from './Toast'

const RECIPIENT_ROLES = [
  {
    value: 'manager',
    label: 'Duty Manager',
    description: 'Overall event lead responsible for major decisions',
  },
  {
    value: 'security_lead',
    label: 'Security Lead',
    description: 'Heads the security response team on site',
  },
  {
    value: 'control_room',
    label: 'Control Room',
    description: 'Coordinates multi-team response from the ops room',
  },
] as const

type RecipientRoleValue = (typeof RECIPIENT_ROLES)[number]['value']

type NotifyVia = 'email' | 'sms' | 'both'

type EscalationResponse = {
  escalation_id: string
  escalated_at: string
  escalated_by: string | null
  notification_status: 'pending' | 'sent' | 'failed'
  notify_via: NotifyVia
  recipient_role: RecipientRoleValue
}

interface EscalationModalProps {
  incidentId: string
  incidentType?: string | null
  incidentPriority?: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: (response: EscalationResponse) => void
}

const MAX_COMMENT_LENGTH = 500

export function EscalationModal({
  incidentId,
  incidentType,
  incidentPriority,
  isOpen,
  onClose,
  onSuccess,
}: EscalationModalProps) {
  const { addToast } = useToast()
  const commentRef = useRef<HTMLTextAreaElement | null>(null)
  const [comment, setComment] = useState('')
  const [commentTouched, setCommentTouched] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<typeof RECIPIENT_ROLES[number] | null>(RECIPIENT_ROLES[0])
  const [notifyVia, setNotifyVia] = useState<NotifyVia>('email')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fuse = useMemo(
    () =>
      new Fuse<typeof RECIPIENT_ROLES[number]>(RECIPIENT_ROLES, {
        keys: ['label', 'description', 'value'],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    []
  )

  useEffect(() => {
    if (isOpen) {
      setComment('')
      setCommentTouched(false)
      setSearchTerm('')
      setErrorMessage(null)
      setNotifyVia('email')
      setSelectedRole(RECIPIENT_ROLES[0])
      setTimeout(() => commentRef.current?.focus(), 0)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (event: KeyboardEvent) => {
      const isCmdEnter = (event.metaKey || event.ctrlKey) && event.key === 'Enter'
      if (isCmdEnter && !isSubmitting && comment.trim().length > 0 && selectedRole) {
        event.preventDefault()
        void handleSubmit()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [comment, handleSubmit, isOpen, isSubmitting, selectedRole])

  const filteredRoles = useMemo(() => {
    const term = searchTerm.trim()
    if (!term) {
      return RECIPIENT_ROLES
    }
    const results = fuse.search(term)
    if (results.length === 0) {
      return []
    }
    return results.map(({ item }) => item)
  }, [fuse, searchTerm])

  const remainingChars = MAX_COMMENT_LENGTH - comment.length
  const isCommentTooLong = remainingChars < 0
  const hasComment = comment.trim().length > 0
  const commentValidationError = !hasComment
    ? 'Comment is required'
    : isCommentTooLong
      ? 'Comment must be 500 characters or fewer'
      : null
  const isSubmitDisabled = isSubmitting || !selectedRole || !!commentValidationError

  const handleSubmit = async () => {
    setCommentTouched(true)
    if (isSubmitDisabled) return
    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      const response = await fetch(`/api/v1/incidents/${incidentId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: comment.trim(),
          recipient_role: selectedRole?.value,
          notify_via: notifyVia,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const detail = data?.error?.message || data?.error || 'Failed to escalate incident'
        throw new Error(detail)
      }

      onSuccess?.(data)
      addToast({
        type: 'success',
        title: 'Escalation Logged',
        message: `Escalated to ${selectedRole?.label} via ${notifyVia.toUpperCase()}.`,
      })
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to escalate incident'
      setErrorMessage(message)
      addToast({
        type: 'error',
        title: 'Escalation Failed',
        message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-[#182447]">
                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">
                  Escalate Incident
                </Dialog.Title>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                  Incident {incidentType ? `${incidentType} · ` : ''}
                  {incidentPriority ? `Priority ${incidentPriority}` : ''}
                </p>

                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="escalation-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Escalation comment
                    </label>
                    <textarea
                      id="escalation-comment"
                      ref={commentRef}
                      value={comment}
                      onChange={(event) => {
                        setComment(event.target.value.slice(0, MAX_COMMENT_LENGTH + 10))
                        if (!commentTouched) {
                          setCommentTouched(true)
                        }
                      }}
                      onBlur={() => setCommentTouched(true)}
                      rows={4}
                      className={`mt-2 block w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-[#2d437a] dark:bg-[#0f172a] dark:text-gray-100 ${
                        commentTouched && commentValidationError
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="Provide context for the escalation…"
                      aria-describedby="escalation-comment-help escalation-comment-error"
                      aria-invalid={commentTouched && !!commentValidationError}
                    />
                    <div className="mt-1 flex items-center justify-between text-xs" aria-live="polite">
                      <span id="escalation-comment-help" className={isCommentTooLong ? 'text-red-600' : 'text-gray-500'}>
                        {isCommentTooLong
                          ? `${-remainingChars} characters over the limit`
                          : `${remainingChars} characters remaining`}
                      </span>
                      <span className="text-gray-400">Cmd/Ctrl + Enter to submit</span>
                    </div>
                    {commentTouched && commentValidationError && (
                      <p
                        id="escalation-comment-error"
                        role="alert"
                        className="mt-1 text-xs font-medium text-red-600"
                      >
                        {commentValidationError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Escalate to
                    </label>
                    <div className="mt-2">
                      <div className="mb-2">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                          placeholder="Search roles…"
                          aria-label="Search escalation roles"
                          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-[#2d437a] dark:bg-[#0f172a] dark:text-gray-100"
                        />
                      </div>
                      <Listbox value={selectedRole} onChange={setSelectedRole}>
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-default rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-left text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-[#2d437a] dark:bg-[#0f172a] dark:text-gray-100">
                            <span className="block truncate">{selectedRole?.label}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-[#0f172a]">
                              {filteredRoles.length === 0 && (
                                <div className="px-3 py-2 text-gray-500 dark:text-gray-300">No roles found</div>
                              )}
                              {filteredRoles.map((role) => (
                                <Listbox.Option
                                  key={role.value}
                                  className={({ active }) =>
                                    `relative cursor-default select-none px-3 py-2 ${
                                      active ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200' : 'text-gray-900 dark:text-gray-100'
                                    }`
                                  }
                                  value={role}
                                >
                                  {({ selected }) => (
                                    <div className="flex items-start gap-2">
                                      {selected ? (
                                        <span className="mt-0.5 text-blue-600 dark:text-blue-300">
                                          <CheckIcon className="h-4 w-4" />
                                        </span>
                                      ) : (
                                        <span className="mt-0.5 h-4 w-4" />
                                      )}
                                      <div>
                                        <p className="text-sm font-medium">{role.label}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-300">{role.description}</p>
                                      </div>
                                    </div>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Notify via</span>
                    <div className="flex flex-wrap gap-3 text-sm">
                      {[{ value: 'email', label: 'Email' }, { value: 'sms', label: 'SMS' }, { value: 'both', label: 'Email + SMS' }].map((option) => (
                        <label key={option.value} className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition ${
                          notifyVia === option.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30'
                            : 'border-gray-300 text-gray-600 dark:border-[#2d437a] dark:text-gray-300'
                        }`}>
                          <input
                            type="radio"
                            name="notifyVia"
                            value={option.value}
                            checked={notifyVia === option.value}
                            onChange={() => setNotifyVia(option.value as NotifyVia)}
                            className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {errorMessage && (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/30 dark:text-red-200"
                    >
                      {errorMessage}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-[#2d437a] dark:text-gray-200 dark:hover:bg-[#1e2b52]"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
                    onClick={() => void handleSubmit()}
                    disabled={isSubmitDisabled}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting && (
                      <svg
                        className="h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                    )}
                    <span>{isSubmitting ? 'Escalating…' : 'Escalate Incident'}</span>
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default EscalationModal
