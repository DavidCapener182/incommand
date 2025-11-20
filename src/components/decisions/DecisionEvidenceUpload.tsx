/**
 * Decision Evidence Upload Component
 * Feature 3: Golden Thread Decision Logging
 * 
 * Component for uploading evidence files to decisions
 */

'use client'

import React, { useState, useRef } from 'react'
import { XMarkIcon, PhotoIcon, DocumentIcon, PaperClipIcon } from '@heroicons/react/24/outline'
import type { DecisionEvidence } from '@/types/decisions'
import { useToast } from '../Toast'

interface DecisionEvidenceUploadProps {
  decisionId: string
  onEvidenceAdded?: (evidence: DecisionEvidence) => void
  onClose?: () => void
}

const EVIDENCE_TYPES = [
  { value: 'screenshot', label: 'Screenshot' },
  { value: 'cctv_still', label: 'CCTV Still' },
  { value: 'radio_transcript', label: 'Radio Transcript' },
  { value: 'email', label: 'Email' },
  { value: 'message', label: 'Message' },
  { value: 'document', label: 'Document' },
  { value: 'audio_recording', label: 'Audio Recording' },
  { value: 'video', label: 'Video' },
  { value: 'other', label: 'Other' },
]

export default function DecisionEvidenceUpload({
  decisionId,
  onEvidenceAdded,
  onClose,
}: DecisionEvidenceUploadProps) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    evidence_type: 'other' as string,
    title: '',
    description: '',
    external_reference: '',
    captured_at: new Date().toISOString().slice(0, 16),
  })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }
    setFile(selectedFile)

    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    if (!file && !formData.external_reference.trim()) {
      setError('Either a file or external reference is required')
      return
    }

    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('evidence_type', formData.evidence_type)
      formDataToSend.append('title', formData.title)
      if (formData.description) formDataToSend.append('description', formData.description)
      if (formData.external_reference) formDataToSend.append('external_reference', formData.external_reference)
      formDataToSend.append('captured_at', new Date(formData.captured_at).toISOString())
      if (file) formDataToSend.append('file', file)

      const response = await fetch(`/api/decisions/${decisionId}/evidence`, {
        method: 'POST',
        body: formDataToSend,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload evidence')
      }

      const { evidence } = await response.json()
      addToast({
        type: 'success',
        title: 'Success',
        message: 'Evidence added successfully',
      })
      onEvidenceAdded?.(evidence)
      onClose?.()
    } catch (err: any) {
      setError(err.message || 'Failed to upload evidence')
      console.error('Error uploading evidence:', err)
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = () => {
    if (!file) return <PaperClipIcon className="h-12 w-12 text-gray-400" />
    if (file.type.startsWith('image/')) return <PhotoIcon className="h-12 w-12 text-gray-400" />
    return <DocumentIcon className="h-12 w-12 text-gray-400" />
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add Evidence
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Evidence Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Evidence Type *
            </label>
            <select
              value={formData.evidence_type}
              onChange={(e) => setFormData({ ...formData, evidence_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              {EVIDENCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., Screenshot of dashboard at 14:30"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Additional details about this evidence..."
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              File Upload
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                accept="image/*,.pdf,.doc,.docx,.txt,audio/*,video/*"
                className="hidden"
              />
              {preview ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">{file?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {((file?.size || 0) / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : file ? (
                <div className="space-y-2">
                  {getFileIcon()}
                  <p className="text-sm text-gray-600 dark:text-gray-400">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {((file.size || 0) / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getFileIcon()}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isDragActive ? 'Drop file here' : 'Drag & drop file here, or click to select'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Max 10MB. Images, PDFs, documents, audio, video
                  </p>
                </div>
              )}
            </div>
            {file && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                  setPreview(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Remove file
              </button>
            )}
          </div>

          {/* External Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              External Reference (Alternative to file upload)
            </label>
            <input
              type="text"
              value={formData.external_reference}
              onChange={(e) => setFormData({ ...formData, external_reference: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., CCTV System ID, Radio Channel, etc."
            />
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Use this if the evidence is stored in an external system
            </p>
          </div>

          {/* Captured At */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Captured At
            </label>
            <input
              type="datetime-local"
              value={formData.captured_at}
              onChange={(e) => setFormData({ ...formData, captured_at: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                disabled={loading}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Add Evidence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

