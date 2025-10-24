'use client'

import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Loader2, QrCode, Send, ShieldCheck, Users, Trash2 } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { DomainSetupDebugCard } from '@/components/ui/DebugCard'
import type {
  VendorAccreditation,
  VendorAccessLevel,
  VendorProfile,
  VendorInductionEvent
} from '@/types/vendor'
import {
  fetchVendorAccreditations,
  fetchVendorAccessLevels,
  fetchVendorProfiles,
  submitVendorApplication,
  fetchVendorInductionEvents,
  updateVendorAccreditationIdentity,
  updateVendorAccreditationStatus,
  issueVendorPass,
  deleteVendor,
  deleteVendorAccreditation
} from '@/services/vendorService'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

const defaultFormState = {
  business_name: '',
  service_type: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  access_level_ids: [] as string[],
  notes: ''
}

const idDocumentPresets = ['Passport', "Driver's licence", 'Other ID']

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Not recorded'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Not recorded'
  }
  return date.toLocaleString()
}

export default function VendorPortalPage() {
  const { addToast } = useToast()
  const addToastRef = useRef(addToast)
  addToastRef.current = addToast
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [vendors, setVendors] = useState<VendorProfile[]>([])
  const [accreditations, setAccreditations] = useState<VendorAccreditation[]>([])
  const [accessLevels, setAccessLevels] = useState<VendorAccessLevel[]>([])
  const [inductionEvents, setInductionEvents] = useState<VendorInductionEvent[]>([])
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [formState, setFormState] = useState(defaultFormState)
  const [applicationModalOpen, setApplicationModalOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewingAccreditationId, setReviewingAccreditationId] = useState<string | null>(null)
  const [reviewForm, setReviewForm] = useState({
    accreditation_number: '',
    id_document_type: '',
    id_document_reference: ''
  })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [deleteVendorModalOpen, setDeleteVendorModalOpen] = useState(false)
  const [deleteAccreditationModalOpen, setDeleteAccreditationModalOpen] = useState(false)
  const [deletingVendorId, setDeletingVendorId] = useState<string | null>(null)
  const [deletingAccreditationId, setDeletingAccreditationId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [profileData, accreditationData, accessLevelData, inductionEventData] = await Promise.all([
        fetchVendorProfiles(),
        fetchVendorAccreditations(),
        fetchVendorAccessLevels(),
        fetchVendorInductionEvents()
      ])

      setVendors(profileData)
      setAccreditations(accreditationData)
      setAccessLevels(accessLevelData)
      setInductionEvents(inductionEventData)

      if (!selectedVendorId && profileData.length > 0) {
        setSelectedVendorId(profileData[0].id)
      }
    } catch (error) {
      console.error(error)
      addToastRef.current({
        type: 'error',
        title: 'Unable to load vendors',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    } finally {
      setLoading(false)
    }
  }, [selectedVendorId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => vendor.id === selectedVendorId) || null,
    [vendors, selectedVendorId]
  )

  const awaitingInduction = useMemo(
    () => accreditations.filter((accreditation) => accreditation.status === 'new'),
    [accreditations]
  )

  const pendingAccreditations = useMemo(() => (
    accreditations
      .filter((accreditation) => accreditation.status === 'pending_review')
      .sort((a, b) => {
        const aTime = a.induction_completed_at ? new Date(a.induction_completed_at).getTime() : 0
        const bTime = b.induction_completed_at ? new Date(b.induction_completed_at).getTime() : 0
        return bTime - aTime
      })
  ), [accreditations])

  const approvedAccreditations = useMemo(
    () => accreditations.filter((accreditation) => accreditation.status === 'approved'),
    [accreditations]
  )

  const reviewingAccreditation = useMemo(
    () => accreditations.find((item) => item.id === reviewingAccreditationId) || null,
    [accreditations, reviewingAccreditationId]
  )

  const reviewingVendor = useMemo(() => {
    if (!reviewingAccreditation) {
      return null
    }
    return vendors.find((vendor) => vendor.id === reviewingAccreditation.vendor_id) || null
  }, [reviewingAccreditation, vendors])

  const activityFeed = useMemo(() => {
    if (inductionEvents.length === 0) {
      return []
    }

    return inductionEvents.slice(0, 10).map((event) => {
      const vendorName = event.accreditation?.vendor?.business_name || 'Unknown vendor'
      const timestamp = formatDateTime(event.created_at)
      let title = 'Induction update'
      let description = `${vendorName} event recorded.`
      let icon: 'email' | 'link' | 'complete' | 'pass' = 'link'

      switch (event.event_type) {
        case 'email_sent':
          title = 'Induction email sent'
          description = `${vendorName} received induction instructions.`
          icon = 'email'
          break
        case 'email_failed':
          title = 'Email delivery issue'
          description = `Failed to reach ${vendorName}. Check email configuration.`
          icon = 'email'
          break
        case 'completed':
          title = 'Induction complete'
          description = `${vendorName} acknowledged induction.`
          icon = 'complete'
          break
        case 'pass_issued':
          title = 'Digital pass issued'
          description = `${vendorName} assigned accreditation credentials.`
          icon = 'pass'
          break
        case 'link_opened':
        default:
          title = 'Induction link opened'
          description = `${vendorName} accessed their induction link.`
          icon = 'link'
          break
      }

      return {
        id: event.id,
        title,
        description,
        timestamp,
        icon
      }
    })
  }, [inductionEvents])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await submitVendorApplication(formState)
      addToast({
        type: 'success',
        title: 'Application submitted',
        message: 'Vendor accreditation recorded. Induction email sent.'
      })
      setFormState(defaultFormState)
      setApplicationModalOpen(false)
      await loadData()
    } catch (error) {
      console.error(error)
      addToast({
        type: 'error',
        title: 'Unable to submit application',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const openReviewModal = (accreditation: VendorAccreditation) => {
    setReviewingAccreditationId(accreditation.id)
    setReviewForm({
      accreditation_number: accreditation.accreditation_number ?? '',
      id_document_type: accreditation.id_document_type ?? '',
      id_document_reference: accreditation.id_document_reference ?? ''
    })
    setReviewModalOpen(true)
  }

  const handleGenerateAccreditationNumber = () => {
    const generated = `ACC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    setReviewForm((prev) => ({ ...prev, accreditation_number: generated }))
  }

  const handleReviewAction = async (status: 'approved' | 'rejected') => {
    if (!reviewingAccreditation) {
      return
    }

    if (status === 'approved' && !reviewForm.accreditation_number.trim()) {
      addToast({
        type: 'error',
        title: 'Accreditation number required',
        message: 'Generate or enter an accreditation number before approving.'
      })
      return
    }

    setReviewSubmitting(true)
    try {
      await updateVendorAccreditationIdentity(reviewingAccreditation.id, {
        accreditation_number: reviewForm.accreditation_number.trim() || null,
        id_document_type: reviewForm.id_document_type.trim() || null,
        id_document_reference: reviewForm.id_document_reference.trim() || null
      })

      if (status === 'approved') {
        const randomToken = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10)
        const environmentUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
        const baseUrl = environmentUrl ? environmentUrl.replace(/\/$/, '') : 'https://incommand.app'
        const passUrl = `${baseUrl}/passes/${reviewingAccreditation.id}`

        await issueVendorPass(reviewingAccreditation.id, passUrl, randomToken)
      }

      await updateVendorAccreditationStatus(
        reviewingAccreditation.id,
        status,
        status === 'approved' ? undefined : 'Rejected during review'
      )

      addToast({
        type: status === 'approved' ? 'success' : 'warning',
        title: `Accreditation ${status === 'approved' ? 'approved' : 'rejected'}`,
        message: reviewingVendor?.business_name
          ? `${reviewingVendor.business_name} marked as ${status.replace('_', ' ')}.`
          : `Accreditation ${status}.`
      })

      setReviewModalOpen(false)
      await loadData()
    } catch (error) {
      console.error(error)
      addToast({
        type: 'error',
        title: 'Unable to update accreditation',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleDeleteVendor = async () => {
    if (!deletingVendorId) return

    setDeleting(true)
    try {
      await deleteVendor(deletingVendorId)
      addToast({
        type: 'success',
        title: 'Vendor deleted',
        message: 'Vendor and all associated data have been removed.'
      })
      setDeleteVendorModalOpen(false)
      setDeletingVendorId(null)
      await loadData()
    } catch (error) {
      console.error(error)
      addToast({
        type: 'error',
        title: 'Unable to delete vendor',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteAccreditation = async () => {
    if (!deletingAccreditationId) return

    setDeleting(true)
    try {
      await deleteVendorAccreditation(deletingAccreditationId)
      addToast({
        type: 'success',
        title: 'Accreditation deleted',
        message: 'Accreditation has been permanently removed.'
      })
      setDeleteAccreditationModalOpen(false)
      setDeletingAccreditationId(null)
      await loadData()
    } catch (error) {
      console.error(error)
      addToast({
        type: 'error',
        title: 'Unable to delete accreditation',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteVendorModal = (vendorId: string) => {
    setDeletingVendorId(vendorId)
    setDeleteVendorModalOpen(true)
  }

  const openDeleteAccreditationModal = (accreditationId: string) => {
    setDeletingAccreditationId(accreditationId)
    setDeleteAccreditationModalOpen(true)
  }

  return (
    <>
      <main className="module-container">
        <DomainSetupDebugCard />

        <header className="module-header">
          <div>
            <h1 className="module-title">Vendor Management &amp; Accreditation</h1>
            <p className="module-subtitle">
              Coordinate accreditation requests end-to-end – from onboarding to induction completion and final approval.
            </p>
          </div>
        </header>

        <section className="module-grid">
          <article className="module-card">
            <div className="module-card-header">
              <div>
                <h2 className="module-card-title">Vendor Directory</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{vendors.length} registered vendors</p>
              </div>
            </div>
            <div className="module-card-body">
              {loading ? (
                <div className="module-empty">Loading vendor directory…</div>
              ) : vendors.length === 0 ? (
                <div className="module-empty">No vendors have been registered yet.</div>
              ) : (
                <div className="space-y-3">
                  <div className="module-action-bar">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Select vendor</label>
                    <select
                      value={selectedVendorId ?? ''}
                      onChange={(event) => setSelectedVendorId(event.target.value)}
                      className="module-select"
                      style={{ maxWidth: '16rem' }}
                    >
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.business_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedVendor ? (
                    <div className="space-y-4">
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="text-gray-500 dark:text-gray-400">Service type</dt>
                          <dd className="text-gray-900 dark:text-gray-100 font-medium">{selectedVendor.service_type || 'Not provided'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 dark:text-gray-400">Contract expiry</dt>
                          <dd className="text-gray-900 dark:text-gray-100 font-medium">{selectedVendor.contract_expires_on || 'Not set'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 dark:text-gray-400">Primary contact</dt>
                          <dd className="text-gray-900 dark:text-gray-100 font-medium">{selectedVendor.contact_name || 'Unknown'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 dark:text-gray-400">Insurance</dt>
                          <dd className="text-gray-900 dark:text-gray-100 font-medium">{selectedVendor.insurance_expires_on || 'Not provided'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 dark:text-gray-400">Email</dt>
                          <dd className="text-gray-900 dark:text-gray-100 font-medium">{selectedVendor.contact_email || 'Not provided'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                          <dd>
                            <span className="module-pill-info capitalize">{selectedVendor.status}</span>
                          </dd>
                        </div>
                      </dl>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                          onClick={() => openDeleteVendorModal(selectedVendor.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete vendor
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="module-empty">Select a vendor to view profile details.</div>
                  )}
                </div>
              )}
            </div>
          </article>

          <article className="module-card">
            <div className="module-card-header items-start">
              <div>
                <h2 className="module-card-title">Accreditation Intake</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Capture vendor or staff applications who require controlled access without full platform accounts.
                </p>
              </div>
              <button type="button" className="button-secondary text-sm" onClick={() => setApplicationModalOpen(true)}>
                New application
              </button>
            </div>
            <div className="module-card-body space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Launch the form to send an automated induction link. Applicants complete induction before entering the review queue.
              </p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Awaiting induction</dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-semibold">{awaitingInduction.length}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Pending review</dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-semibold">{pendingAccreditations.length}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Approved</dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-semibold">{approvedAccreditations.length}</dd>
                </div>
              </dl>
            </div>
          </article>
        </section>

        <section className="module-card">
          <div className="module-card-header flex-wrap gap-3">
            <div>
              <h2 className="module-card-title">Accreditation Queue</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Monitor induction progress and finalise approvals with ID verification and accreditation numbers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="module-pill-warning">{pendingAccreditations.length} awaiting review</span>
              <span className="module-pill-info">{awaitingInduction.length} awaiting induction</span>
            </div>
          </div>
          <div className="module-card-body space-y-6">
            {awaitingInduction.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Awaiting induction</h3>
                <ul className="module-list">
                  {awaitingInduction.map((accreditation) => {
                    const vendor = vendors.find((item) => item.id === accreditation.vendor_id)
                    return (
                      <li key={accreditation.id} className="module-list-item">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {vendor?.business_name || 'Unknown vendor'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Induction link sent {formatDateTime(accreditation.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="module-pill-info">Waiting on applicant</span>
                            <button
                              type="button"
                              className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                              onClick={() => openDeleteAccreditationModal(accreditation.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Pending review</h3>
              {pendingAccreditations.length === 0 ? (
                <div className="module-empty">No pending accreditations. Vendors are up to date.</div>
              ) : (
                <ul className="module-list">
                  {pendingAccreditations.map((accreditation) => {
                    const vendor = vendors.find((item) => item.id === accreditation.vendor_id)
                    return (
                      <li key={accreditation.id} className="module-list-item">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {vendor?.business_name || 'Unknown vendor'}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Induction completed {formatDateTime(accreditation.induction_completed_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="button-primary text-xs"
                                onClick={() => openReviewModal(accreditation)}
                              >
                                Review &amp; verify
                              </button>
                              <button
                                type="button"
                                className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                                onClick={() => openDeleteAccreditationModal(accreditation.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            Access requested:{' '}
                            {accreditation.access_levels && accreditation.access_levels.length > 0
                              ? accreditation.access_levels.map((level) => level.name).join(', ')
                              : 'No levels selected'}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {approvedAccreditations.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Recently approved</h3>
                <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                  {approvedAccreditations.slice(0, 5).map((accreditation) => {
                    const vendor = vendors.find((item) => item.id === accreditation.vendor_id)
                    return (
                      <li key={accreditation.id} className="flex items-center justify-between">
                        <span>{vendor?.business_name || 'Unknown vendor'}</span>
                        <span className="module-pill-success">Accreditation #{accreditation.accreditation_number || 'N/A'}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section className="module-card">
          <div className="module-card-header">
            <div>
              <h2 className="module-card-title">Accreditation Activity</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monitor induction events and pass issuance in real time.</p>
            </div>
          </div>
          <div className="module-card-body">
            {activityFeed.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                {activityFeed.map((item) => (
                  <li key={item.id} className="py-3 flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-blue-600/10 p-2 text-blue-600 dark:text-blue-300">
                      {item.icon === 'email' && <Send className="h-4 w-4" />}
                      {item.icon === 'link' && <Users className="h-4 w-4" />}
                      {item.icon === 'complete' && <ShieldCheck className="h-4 w-4" />}
                      {item.icon === 'pass' && <QrCode className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{item.timestamp}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="module-empty">No recent induction activity yet.</div>
            )}
          </div>
        </section>
      </main>

      <button
        type="button"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        onClick={() => setApplicationModalOpen(true)}
        aria-label="Create new accreditation"
      >
        <span className="text-3xl leading-none">+</span>
      </button>

      <Dialog open={applicationModalOpen} onOpenChange={setApplicationModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>New accreditation application</DialogTitle>
            <DialogDescription>
              Capture vendor or contractor details. An induction link is sent automatically after submission.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label>Business name</label>
              <input
                value={formState.business_name}
                onChange={(event) => setFormState((prev) => ({ ...prev, business_name: event.target.value }))}
                required
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label>Service type</label>
                <input
                  value={formState.service_type}
                  onChange={(event) => setFormState((prev) => ({ ...prev, service_type: event.target.value }))}
                />
              </div>
              <div>
                <label>Contact name</label>
                <input
                  value={formState.contact_name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, contact_name: event.target.value }))}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label>Contact email</label>
                <input
                  type="email"
                  value={formState.contact_email}
                  onChange={(event) => setFormState((prev) => ({ ...prev, contact_email: event.target.value }))}
                  required
                />
              </div>
              <div>
                <label>Contact phone</label>
                <input
                  value={formState.contact_phone}
                  onChange={(event) => setFormState((prev) => ({ ...prev, contact_phone: event.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Requested access levels</label>
              {accessLevels.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4 text-sm text-gray-500 dark:text-gray-400">
                  No access levels configured. Populate <code>vendor_access_levels</code> in Supabase to enable selections.
                </div>
              ) : (
                <select
                  multiple
                  value={formState.access_level_ids}
                  onChange={(event) => {
                    const selected = Array.from(event.target.selectedOptions).map((option) => option.value)
                    setFormState((prev) => ({ ...prev, access_level_ids: selected }))
                  }}
                  className="module-select mt-2 h-32"
                >
                  {accessLevels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Hold Ctrl (Windows) or ⌘ (macOS) to select multiple access types.
              </p>
            </div>
            <div>
              <label>Notes</label>
              <textarea
                value={formState.notes}
                onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Optional context for reviewers"
              />
            </div>
            <DialogFooter>
              <button type="submit" className="button-primary" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Submitting…</span>
                ) : (
                  'Submit application'
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Review accreditation</DialogTitle>
            <DialogDescription>
              Confirm ID details and accreditation number before approving access.
            </DialogDescription>
          </DialogHeader>

          {reviewingAccreditation && (
            <div className="space-y-5">
              <section className="rounded-lg bg-gray-50 dark:bg-gray-900/60 p-4 text-sm text-gray-700 dark:text-gray-300">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Applicant summary</h3>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Business</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100">{reviewingVendor?.business_name || 'Unknown vendor'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Service type</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100">{reviewingVendor?.service_type || 'Not provided'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Access request</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100">
                      {reviewingAccreditation.access_levels && reviewingAccreditation.access_levels.length > 0
                        ? reviewingAccreditation.access_levels.map((level) => level.name).join(', ')
                        : 'No levels selected'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Induction completed</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDateTime(reviewingAccreditation.induction_completed_at)}
                    </dd>
                  </div>
                </dl>
              </section>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">ID document type</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {idDocumentPresets.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setReviewForm((prev) => ({ ...prev, id_document_type: option }))}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          reviewForm.id_document_type === option
                            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-600/20'
                            : 'border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <input
                    className="mt-2"
                    placeholder="Custom type (optional)"
                    value={reviewForm.id_document_type}
                    onChange={(event) => setReviewForm((prev) => ({ ...prev, id_document_type: event.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">ID reference number</label>
                  <input
                    value={reviewForm.id_document_reference}
                    onChange={(event) => setReviewForm((prev) => ({ ...prev, id_document_reference: event.target.value }))}
                    placeholder="e.g. Passport 123456789"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Accreditation number</label>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={reviewForm.accreditation_number}
                      onChange={(event) => setReviewForm((prev) => ({ ...prev, accreditation_number: event.target.value }))}
                      placeholder="Generate or enter accreditation number"
                    />
                    <button type="button" className="button-secondary whitespace-nowrap" onClick={handleGenerateAccreditationNumber}>
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Approved entries move to the cleared list immediately.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    className="button-danger"
                    onClick={() => handleReviewAction('rejected')}
                    disabled={reviewSubmitting}
                  >
                    {reviewSubmitting ? 'Processing…' : 'Reject'}
                  </button>
                  <button
                    type="button"
                    className="button-primary"
                    onClick={() => handleReviewAction('approved')}
                    disabled={reviewSubmitting}
                  >
                    {reviewSubmitting ? 'Processing…' : 'Approve'}
                  </button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Vendor Confirmation Dialog */}
      <Dialog open={deleteVendorModalOpen} onOpenChange={setDeleteVendorModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Vendor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this vendor? This action cannot be undone and will remove all associated accreditations and data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              className="button-secondary"
              onClick={() => setDeleteVendorModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button-danger"
              onClick={handleDeleteVendor}
              disabled={deleting}
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                'Delete vendor'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Accreditation Confirmation Dialog */}
      <Dialog open={deleteAccreditationModalOpen} onOpenChange={setDeleteAccreditationModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Accreditation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this accreditation? This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              className="button-secondary"
              onClick={() => setDeleteAccreditationModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button-danger"
              onClick={handleDeleteAccreditation}
              disabled={deleting}
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                'Delete accreditation'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
