'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '@/components/Toast'
import type { VendorAccreditation, VendorAccessLevel, VendorProfile } from '@/types/vendor'
import {
  fetchVendorAccreditations,
  fetchVendorAccessLevels,
  fetchVendorProfiles,
  submitVendorApplication,
  updateVendorAccreditationStatus
} from '@/services/vendorService'

const defaultFormState = {
  business_name: '',
  service_type: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  access_level_ids: [] as string[],
  notes: ''
}

export default function VendorPortalPage() {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [vendors, setVendors] = useState<VendorProfile[]>([])
  const [accreditations, setAccreditations] = useState<VendorAccreditation[]>([])
  const [accessLevels, setAccessLevels] = useState<VendorAccessLevel[]>([])
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [formState, setFormState] = useState(defaultFormState)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [profileData, accreditationData, accessLevelData] = await Promise.all([
        fetchVendorProfiles(),
        fetchVendorAccreditations(),
        fetchVendorAccessLevels()
      ])

      setVendors(profileData)
      setAccreditations(accreditationData)
      setAccessLevels(accessLevelData)
      if (!selectedVendorId && profileData.length > 0) {
        setSelectedVendorId(profileData[0].id)
      }
    } catch (error) {
      console.error(error)
      addToast({
        type: 'error',
        title: 'Unable to load vendors',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    } finally {
      setLoading(false)
    }
  }, [addToast, selectedVendorId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const selectedVendor = useMemo(() => vendors.find((vendor) => vendor.id === selectedVendorId) || null, [vendors, selectedVendorId])

  const pendingAccreditations = useMemo(
    () => accreditations.filter((accreditation) => accreditation.status === 'pending'),
    [accreditations]
  )

  const approvedAccreditations = useMemo(
    () => accreditations.filter((accreditation) => accreditation.status === 'approved'),
    [accreditations]
  )

  const handleStatusChange = async (accreditationId: string, status: 'approved' | 'rejected') => {
    try {
      await updateVendorAccreditationStatus(accreditationId, status, status === 'approved' ? undefined : 'Rejected via portal')
      addToast({
        type: 'success',
        title: `Accreditation ${status}`,
        message: `Accreditation ${accreditationId.slice(0, 8)} marked as ${status}.`
      })
      await loadData()
    } catch (error) {
      console.error(error)
      addToast({
        type: 'error',
        title: 'Unable to update accreditation',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await submitVendorApplication(formState)
      addToast({
        type: 'success',
        title: 'Application submitted',
        message: 'Vendor application recorded and pending review.'
      })
      setFormState(defaultFormState)
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

  return (
    <main className="module-container">
      <header className="module-header">
        <div>
          <h1 className="module-title">Vendor Management &amp; Accreditation</h1>
          <p className="module-subtitle">
            Coordinate vendor access, track accreditation progress, and distribute induction materials without impacting incident workflows.
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
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Service Type</dt>
                      <dd className="text-gray-900 dark:text-gray-100 font-medium">{selectedVendor.service_type || 'Not provided'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Contract Expiry</dt>
                      <dd className="text-gray-900 dark:text-gray-100 font-medium">{selectedVendor.contract_expires_on || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Primary Contact</dt>
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
                ) : (
                  <div className="module-empty">Select a vendor to view profile details.</div>
                )}
              </div>
            )}
          </div>
        </article>

        <article className="module-card">
          <div className="module-card-header">
            <div>
              <h2 className="module-card-title">New Accreditation Application</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Capture vendor onboarding requests and access needs.</p>
            </div>
          </div>
          <div className="module-card-body">
            <form className="module-form" onSubmit={handleSubmit}>
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
                <label>Requested access levels</label>
                <div className="space-y-2">
                  {accessLevels.length === 0 ? (
                    <small>No access levels configured yet.</small>
                  ) : (
                    accessLevels.map((level) => (
                      <label key={level.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <input
                          type="checkbox"
                          checked={formState.access_level_ids.includes(level.id)}
                          onChange={(event) => {
                            setFormState((prev) => {
                              const next = new Set(prev.access_level_ids)
                              if (event.target.checked) {
                                next.add(level.id)
                              } else {
                                next.delete(level.id)
                              }
                              return { ...prev, access_level_ids: Array.from(next) }
                            })
                          }}
                        />
                        <span className="font-medium text-gray-800 dark:text-gray-100">{level.name}</span>
                        {level.description && <span className="text-xs text-gray-500 dark:text-gray-400">{level.description}</span>}
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label>Notes</label>
                <textarea
                  value={formState.notes}
                  onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Optional context for reviewers"
                />
              </div>

              <button type="submit" className="button-primary" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit application'}
              </button>
            </form>
          </div>
        </article>
      </section>

      <section className="module-card">
        <div className="module-card-header">
          <div>
            <h2 className="module-card-title">Accreditation Queue</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Review outstanding applications and maintain a unified audit trail.
            </p>
          </div>
          <span className="module-pill-warning">{pendingAccreditations.length} awaiting review</span>
        </div>
        <div className="module-card-body space-y-4">
          {pendingAccreditations.length === 0 ? (
            <div className="module-empty">No pending accreditations. Vendors are up to date.</div>
          ) : (
            <ul className="module-list">
              {pendingAccreditations.map((accreditation) => {
                const vendor = vendors.find((item) => item.id === accreditation.vendor_id)
                return (
                  <li key={accreditation.id} className="module-list-item">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {vendor?.business_name || 'Unknown vendor'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Submitted {new Date(accreditation.submitted_at ?? '').toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="button-secondary text-xs"
                          onClick={() => handleStatusChange(accreditation.id, 'approved')}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="button-danger text-xs"
                          onClick={() => handleStatusChange(accreditation.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      Access requested:{' '}
                      {accreditation.access_levels && accreditation.access_levels.length > 0
                        ? accreditation.access_levels.map((level) => level.name).join(', ')
                        : 'No levels selected'}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {approvedAccreditations.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Recently approved</h3>
              <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                {approvedAccreditations.slice(0, 5).map((accreditation) => {
                  const vendor = vendors.find((item) => item.id === accreditation.vendor_id)
                  return (
                    <li key={accreditation.id} className="flex items-center justify-between">
                      <span>{vendor?.business_name || 'Unknown vendor'}</span>
                      <span className="module-pill-success">Approved</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
