'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { VendorAccreditationStatus } from '@/types/vendor'

interface CompleteInductionButtonProps {
  token: string
  initialStatus: VendorAccreditationStatus
}

export default function CompleteInductionButton({ token, initialStatus }: CompleteInductionButtonProps) {
  const [status, setStatus] = useState<VendorAccreditationStatus>(initialStatus)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCompletion = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch(`/api/accreditations/${encodeURIComponent(token)}`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        const message = await response.json().catch(() => ({}))
        throw new Error(message?.error || 'Unable to confirm induction completion')
      }

      setStatus('pending_review')
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to confirm induction completion'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'approved') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        Induction complete. You have been approved — check in at the accreditation desk to collect your pass.
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        This accreditation request has been declined. Please contact the event control room if you believe this is in error.
      </div>
    )
  }

  if (status === 'pending_review') {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        Thank you — your induction is logged. The accreditation team will review and confirm your access shortly.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleCompletion}
        disabled={submitting}
        className="w-full rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:opacity-70"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Mark induction complete
          </span>
        ) : (
          '✅ Complete induction'
        )}
      </button>
      <p className="text-xs text-gray-500">
        By confirming, you acknowledge you have reviewed the induction briefing and agree to comply with onsite safety requirements.
      </p>
      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
