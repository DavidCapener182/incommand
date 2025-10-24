'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '@/components/Toast'
import { PageWrapper } from '@/components/layout/PageWrapper'
import type { FoundItem, LostFoundMatch, LostItem } from '@/types/lostAndFound'
import {
  confirmMatch,
  createFoundItem,
  createLostReport,
  fetchFoundItems,
  fetchLostFoundMatches,
  fetchLostItems,
  updateFoundItemStatus,
  updateLostItemStatus,
  type CreateFoundItemPayload,
  type CreateLostReportPayload
} from '@/services/lostAndFoundService'

const defaultLostForm: CreateLostReportPayload = {
  reporter_name: '',
  contact_email: '',
  contact_phone: '',
  description: '',
  keywords: [],
  location: '',
  photo_url: ''
}

const defaultFoundForm: CreateFoundItemPayload = {
  description: '',
  keywords: [],
  location: '',
  storage_location: '',
  photo_url: ''
}

export default function LostAndFoundPage() {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [lostItems, setLostItems] = useState<LostItem[]>([])
  const [foundItems, setFoundItems] = useState<FoundItem[]>([])
  const [matches, setMatches] = useState<LostFoundMatch[]>([])
  const [lostForm, setLostForm] = useState<CreateLostReportPayload>(defaultLostForm)
  const [foundForm, setFoundForm] = useState<CreateFoundItemPayload>(defaultFoundForm)
  const [submittingLost, setSubmittingLost] = useState(false)
  const [submittingFound, setSubmittingFound] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [lostData, foundData, matchData] = await Promise.all([
        fetchLostItems('awaiting'),
        fetchFoundItems('stored'),
        fetchLostFoundMatches()
      ])

      setLostItems(lostData)
      setFoundItems(foundData)
      setMatches(matchData)
    } catch (error) {
      console.error(error)
      addToast({
        type: 'error',
        title: 'Unable to load lost & found data',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const recentMatches = useMemo(() => matches.slice(0, 5), [matches])

  const handleLostSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmittingLost(true)
    try {
      await createLostReport({
        ...lostForm,
        keywords: lostForm.keywords?.filter(Boolean)
      })
      addToast({
        type: 'success',
        title: 'Lost item recorded',
        message: 'Guest report logged for follow up.'
      })
      setLostForm(defaultLostForm)
      await loadData()
    } catch (error) {
      console.error(error)
      addToast({
        type: 'error',
        title: 'Unable to log lost item',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    } finally {
      setSubmittingLost(false)
    }
  }

  const handleFoundSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmittingFound(true)
    try {
      await createFoundItem({
        ...foundForm,
        keywords: foundForm.keywords?.filter(Boolean)
      })
      addToast({
        type: 'success',
        title: 'Found item stored',
        message: 'Property logged and ready for matching.'
      })
      setFoundForm(defaultFoundForm)
      await loadData()
    } catch (error) {
      console.error(error)
      addToast({
        type: 'error',
        title: 'Unable to log found item',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    } finally {
      setSubmittingFound(false)
    }
  }

  const handleLostStatus = async (lostId: string, status: string) => {
    try {
      await updateLostItemStatus(lostId, status)
      addToast({
        type: 'success',
        title: 'Lost item updated',
        message: `Status set to ${status}.`
      })
      await loadData()
    } catch (error) {
      console.error(error)
      addToast({
        type: 'error',
        title: 'Unable to update lost item',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    }
  }

  const handleFoundStatus = async (foundId: string, status: string) => {
    try {
      await updateFoundItemStatus(foundId, status)
      addToast({
        type: 'success',
        title: 'Found item updated',
        message: `Status set to ${status}.`
      })
      await loadData()
    } catch (error) {
      console.error(error)
      addToast({
        type: 'error',
        title: 'Unable to update found item',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    }
  }

  const handleMatchStatus = async (matchId: string, status: 'confirmed' | 'dismissed') => {
    try {
      await confirmMatch(matchId, status)
      addToast({
        type: 'success',
        title: 'Match updated',
        message: `Match ${status}.`
      })
      await loadData()
    } catch (error) {
      console.error(error)
      addToast({
        type: 'error',
        title: 'Unable to update match',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })
    }
  }

  return (
    <PageWrapper>
      <header className="module-header">
        <div>
          <h1 className="module-title">Lost &amp; Found</h1>
          <p className="module-subtitle">
            Capture lost property reports, log recovered items, and reconcile matches with a clear audit trail and GDPR compliant retention.
          </p>
        </div>
      </header>

      <section className="module-grid">
        <article className="module-card">
          <div className="module-card-header">
            <div>
              <h2 className="module-card-title">Guest Lost Report</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Log guest submissions from kiosk or web form.</p>
            </div>
          </div>
          <div className="module-card-body">
            <form className="module-form" onSubmit={handleLostSubmit}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label>Guest name</label>
                  <input
                    value={lostForm.reporter_name}
                    onChange={(event) => setLostForm((prev) => ({ ...prev, reporter_name: event.target.value }))}
                  />
                </div>
                <div>
                  <label>Contact email</label>
                  <input
                    type="email"
                    value={lostForm.contact_email}
                    onChange={(event) => setLostForm((prev) => ({ ...prev, contact_email: event.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label>Contact phone</label>
                <input
                  value={lostForm.contact_phone}
                  onChange={(event) => setLostForm((prev) => ({ ...prev, contact_phone: event.target.value }))}
                />
              </div>
              <div>
                <label>Description</label>
                <textarea
                  value={lostForm.description}
                  onChange={(event) => setLostForm((prev) => ({ ...prev, description: event.target.value }))}
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label>Keywords</label>
                  <input
                    placeholder="comma separated"
                    value={lostForm.keywords?.join(', ') || ''}
                    onChange={(event) => setLostForm((prev) => ({ ...prev, keywords: event.target.value.split(',').map((value) => value.trim()) }))}
                  />
                </div>
                <div>
                  <label>Location</label>
                  <input
                    value={lostForm.location}
                    onChange={(event) => setLostForm((prev) => ({ ...prev, location: event.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label>Photo URL</label>
                <input
                  value={lostForm.photo_url}
                  onChange={(event) => setLostForm((prev) => ({ ...prev, photo_url: event.target.value }))}
                />
              </div>
              <button type="submit" className="button-primary" disabled={submittingLost}>
                {submittingLost ? 'Logging…' : 'Log lost item'}
              </button>
            </form>
          </div>
        </article>

        <article className="module-card">
          <div className="module-card-header">
            <div>
              <h2 className="module-card-title">Found Item Intake</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Record found property and storage details.</p>
            </div>
          </div>
          <div className="module-card-body">
            <form className="module-form" onSubmit={handleFoundSubmit}>
              <div>
                <label>Description</label>
                <textarea
                  value={foundForm.description}
                  onChange={(event) => setFoundForm((prev) => ({ ...prev, description: event.target.value }))}
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label>Keywords</label>
                  <input
                    placeholder="comma separated"
                    value={foundForm.keywords?.join(', ') || ''}
                    onChange={(event) => setFoundForm((prev) => ({ ...prev, keywords: event.target.value.split(',').map((value) => value.trim()) }))}
                  />
                </div>
                <div>
                  <label>Found location</label>
                  <input
                    value={foundForm.location}
                    onChange={(event) => setFoundForm((prev) => ({ ...prev, location: event.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label>Storage location</label>
                <input
                  value={foundForm.storage_location}
                  onChange={(event) => setFoundForm((prev) => ({ ...prev, storage_location: event.target.value }))}
                />
              </div>
              <div>
                <label>Photo URL</label>
                <input
                  value={foundForm.photo_url}
                  onChange={(event) => setFoundForm((prev) => ({ ...prev, photo_url: event.target.value }))}
                />
              </div>
              <button type="submit" className="button-primary" disabled={submittingFound}>
                {submittingFound ? 'Saving…' : 'Log found item'}
              </button>
            </form>
          </div>
        </article>
      </section>

      <section className="module-card">
        <div className="module-card-header">
          <div>
            <h2 className="module-card-title">Active Records</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Prioritise reconciliation with automated fuzzy matching and manual review.
            </p>
          </div>
        </div>
        <div className="module-card-body space-y-4">
          {loading ? (
            <div className="module-empty">Loading lost and found items…</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Lost items awaiting match</h3>
                {lostItems.length === 0 ? (
                  <div className="module-empty">No outstanding guest reports.</div>
                ) : (
                  <ul className="module-list">
                    {lostItems.map((item) => (
                      <li key={item.id} className="module-list-item">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.description}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.location || 'Location not specified'}</p>
                          </div>
                          <button
                            type="button"
                            className="button-secondary text-xs"
                            onClick={() => handleLostStatus(item.id, 'closed')}
                          >
                            Close
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Found items in storage</h3>
                {foundItems.length === 0 ? (
                  <div className="module-empty">No unreturned found items.</div>
                ) : (
                  <ul className="module-list">
                    {foundItems.map((item) => (
                      <li key={item.id} className="module-list-item">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.description}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Stored at {item.storage_location || 'Unknown location'}</p>
                          </div>
                          <button
                            type="button"
                            className="button-secondary text-xs"
                            onClick={() => handleFoundStatus(item.id, 'released')}
                          >
                            Release
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Suggested matches</h3>
            {recentMatches.length === 0 ? (
              <div className="module-empty">No suggested matches yet. Matches appear here when keyword or AI matching succeeds.</div>
            ) : (
              <ul className="module-list">
                {recentMatches.map((match) => {
                  const lost = lostItems.find((item) => item.id === match.lost_item_id)
                  const found = foundItems.find((item) => item.id === match.found_item_id)
                  return (
                    <li key={match.id} className="module-list-item">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {lost?.description || 'Lost item'} ↔ {found?.description || 'Found item'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Confidence {match.match_score ? `${Math.round((match.match_score || 0) * 100)}%` : 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="button-primary text-xs"
                            onClick={() => handleMatchStatus(match.id, 'confirmed')}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="button-secondary text-xs"
                            onClick={() => handleMatchStatus(match.id, 'dismissed')}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </PageWrapper>
  )
}
