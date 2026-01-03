/**
 * Decision Details Component
 * Feature 3: Golden Thread Decision Logging
 * 
 * Detailed view of a single decision with evidence and annotations
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  XMarkIcon, 
  LockClosedIcon, 
  ArrowDownTrayIcon,
  PhotoIcon,
  DocumentIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline'
import type { DecisionWithRelations } from '@/types/decisions'
import DecisionEvidenceUpload from './DecisionEvidenceUpload'
import { useToast } from '../Toast'

interface DecisionDetailsProps {
  decisionId: string
  onClose?: () => void
  onDecisionUpdated?: () => void
}

export default function DecisionDetails({
  decisionId,
  onClose,
  onDecisionUpdated,
}: DecisionDetailsProps) {
  const { addToast } = useToast()
  const [decision, setDecision] = useState<DecisionWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false)
  const [showAnnotationForm, setShowAnnotationForm] = useState(false)
  const [annotationText, setAnnotationText] = useState('')
  const [annotationType, setAnnotationType] = useState<'note' | 'clarification' | 'correction' | 'follow_up' | 'inquiry_response'>('note')
  const [submittingAnnotation, setSubmittingAnnotation] = useState(false)
  const [lockingDecision, setLockingDecision] = useState(false)

  const fetchDecision = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/decisions/${decisionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch decision')
      }

      const data = await response.json()
      setDecision(data.decision)
    } catch (err: any) {
      setError(err.message || 'Failed to load decision')
      console.error('Error fetching decision:', err)
    } finally {
      setLoading(false)
    }
  }, [decisionId])

  useEffect(() => {
    fetchDecision()
  }, [fetchDecision])

  const handleLockDecision = async () => {
    if (!confirm('Are you sure you want to lock this decision? Once locked, it cannot be edited.')) {
      return
    }

    setLockingDecision(true)
    try {
      const response = await fetch(`/api/decisions/${decisionId}/lock`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to lock decision')
      }

      const { decision: updatedDecision } = await response.json()
      setDecision(updatedDecision)
      addToast({
        type: 'success',
        title: 'Success',
        message: 'Decision locked successfully',
      })
      onDecisionUpdated?.()
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to lock decision',
      })
    } finally {
      setLockingDecision(false)
    }
  }

  const handleAddAnnotation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!annotationText.trim()) return

    setSubmittingAnnotation(true)
    try {
      const response = await fetch(`/api/decisions/${decisionId}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annotation_text: annotationText,
          annotation_type: annotationType,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add annotation')
      }

      addToast({
        type: 'success',
        title: 'Success',
        message: 'Annotation added successfully',
      })
      setAnnotationText('')
      setShowAnnotationForm(false)
      fetchDecision() // Refresh to show new annotation
      onDecisionUpdated?.()
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to add annotation',
      })
    } finally {
      setSubmittingAnnotation(false)
    }
  }

  const handleDownloadInquiryPack = async (format: 'json' | 'html' = 'json') => {
    try {
      const response = await fetch(`/api/decisions/${decisionId}/inquiry-pack?format=${format}`)
      if (!response.ok) {
        throw new Error('Failed to generate inquiry pack')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inquiry-pack-${decisionId}-${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      addToast({
        type: 'success',
        title: 'Success',
        message: 'Inquiry pack downloaded',
      })
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to download inquiry pack',
      })
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'screenshot':
      case 'cctv_still':
        return <PhotoIcon className="h-5 w-5" />
      case 'document':
      case 'email':
        return <DocumentIcon className="h-5 w-5" />
      default:
        return <PaperClipIcon className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading decision...</p>
        </div>
      </div>
    )
  }

  if (error || !decision) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md">
          <p className="text-red-600 dark:text-red-400">{error || 'Decision not found'}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
            >
              Close
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Decision Details
            </h2>
            {decision.is_locked && (
              <div className="flex items-center gap-1 text-green-600">
                <LockClosedIcon className="h-5 w-5" />
                <span className="text-sm">Locked</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadInquiryPack('json')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Download Inquiry Pack (JSON)"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Decision Info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Timestamp</label>
              <p className="text-gray-900 dark:text-white">{formatTimestamp(decision.timestamp)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Trigger / Issue</label>
              <p className="text-gray-900 dark:text-white mt-1">{decision.trigger_issue}</p>
            </div>

            {/* Options Considered */}
            {decision.options_considered && Array.isArray(decision.options_considered) && decision.options_considered.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">Options Considered</label>
                <div className="space-y-3">
                  {decision.options_considered.map((option: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white mb-2">{option.option}</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-green-600 dark:text-green-400 font-medium">Pros:</span>
                          <ul className="list-disc list-inside mt-1 text-gray-600 dark:text-gray-400">
                            {option.pros?.map((pro: string, i: number) => (
                              <li key={i}>{pro}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="text-red-600 dark:text-red-400 font-medium">Cons:</span>
                          <ul className="list-disc list-inside mt-1 text-gray-600 dark:text-gray-400">
                            {option.cons?.map((con: string, i: number) => (
                              <li key={i}>{con}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Decision Taken</label>
              <p className="text-gray-900 dark:text-white mt-1">{decision.decision_taken}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Rationale</label>
              <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">{decision.rationale}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Decision Owner</label>
                <p className="text-gray-900 dark:text-white">
                  {decision.decision_owner_callsign || decision.decision_owner_id || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Role Level</label>
                <p className="text-gray-900 dark:text-white capitalize">{decision.role_level}</p>
              </div>
            </div>

            {decision.location && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</label>
                <p className="text-gray-900 dark:text-white">{decision.location}</p>
              </div>
            )}

            {decision.follow_up_review_time && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Follow-up Review Time</label>
                <p className="text-gray-900 dark:text-white">{formatTimestamp(decision.follow_up_review_time)}</p>
              </div>
            )}
          </div>

          {/* Evidence */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Evidence ({decision.evidence?.length || 0})
              </h3>
              {!decision.is_locked && (
                <button
                  onClick={() => setShowEvidenceUpload(true)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + Add Evidence
                </button>
              )}
            </div>
            {decision.evidence && decision.evidence.length > 0 ? (
              <div className="space-y-2">
                {decision.evidence.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-start gap-3"
                  >
                    {getEvidenceIcon(evidence.evidence_type)}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{evidence.title}</p>
                      {evidence.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{evidence.description}</p>
                      )}
                      {evidence.file_url && (
                        <a
                          href={evidence.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 mt-1 inline-block"
                        >
                          View File
                        </a>
                      )}
                      {evidence.external_reference && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Reference: {evidence.external_reference}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-500">No evidence attached</p>
            )}
          </div>

          {/* Annotations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Annotations ({decision.annotations?.length || 0})
              </h3>
              <button
                onClick={() => setShowAnnotationForm(!showAnnotationForm)}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                + Add Annotation
              </button>
            </div>

            {showAnnotationForm && (
              <form onSubmit={handleAddAnnotation} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Annotation Type
                  </label>
                  <select
                    value={annotationType}
                    onChange={(e) => setAnnotationType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="note">Note</option>
                    <option value="clarification">Clarification</option>
                    <option value="correction">Correction</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="inquiry_response">Inquiry Response</option>
                  </select>
                </div>
                <textarea
                  value={annotationText}
                  onChange={(e) => setAnnotationText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-3"
                  rows={3}
                  placeholder="Enter annotation..."
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submittingAnnotation}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submittingAnnotation ? 'Adding...' : 'Add Annotation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAnnotationForm(false)
                      setAnnotationText('')
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {decision.annotations && decision.annotations.length > 0 ? (
              <div className="space-y-3">
                {decision.annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                        {annotation.annotation_type}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {formatTimestamp(annotation.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-white">{annotation.annotation_text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-500">No annotations</p>
            )}
          </div>

          {/* Linked Incidents */}
          {decision.linked_incidents && decision.linked_incidents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Linked Incidents ({decision.linked_incidents.length})
              </h3>
              <div className="space-y-2">
                {decision.linked_incidents.map((incident: any) => (
                  <div
                    key={incident.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{incident.incident_type}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{incident.location}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lock Button */}
          {!decision.is_locked && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLockDecision}
                disabled={lockingDecision}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <LockClosedIcon className="h-5 w-5" />
                {lockingDecision ? 'Locking...' : 'Lock Decision'}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Once locked, this decision cannot be edited but annotations can still be added.
              </p>
            </div>
          )}
        </div>

        {/* Evidence Upload Modal */}
        {showEvidenceUpload && (
          <DecisionEvidenceUpload
            decisionId={decisionId}
            onEvidenceAdded={() => {
              setShowEvidenceUpload(false)
              fetchDecision()
              onDecisionUpdated?.()
            }}
            onClose={() => setShowEvidenceUpload(false)}
          />
        )}
      </div>
    </div>
  )
}

