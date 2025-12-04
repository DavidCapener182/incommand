'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createFoundItem, fetchFoundItems, updateFoundItemStatus } from '@/services/lostAndFoundService'
import type { FoundItem } from '@/types/lostAndFound'
import { useToast } from '@/components/Toast'

export default function MobileLostAndFound() {
  const { addToast } = useToast()
  const [items, setItems] = useState<FoundItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState({
    description: '',
    location: '',
    storage_location: '',
  })

  const loadItems = async () => {
    setLoading(true)
    try {
      const data = await fetchFoundItems()
      setItems(data)
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Unable to load items',
        message: error?.message || 'Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter((item) =>
      (item.description || '').toLowerCase().includes(q) ||
      (item.location || '').toLowerCase().includes(q) ||
      (item.storage_location || '').toLowerCase().includes(q)
    )
  }, [items, query])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description.trim()) {
      return
    }
    setSaving(true)
    try {
      await createFoundItem({
        description: form.description,
        location: form.location,
        storage_location: form.storage_location,
      })
      addToast({
        type: 'success',
        title: 'Found item logged',
        message: 'Item stored and ready for matching.'
      })
      setForm({ description: '', location: '', storage_location: '' })
      await loadItems()
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Unable to save item',
        message: error?.message || 'Please try again.'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleMarkReturned = async (id: string) => {
    try {
      await updateFoundItemStatus(id, 'released')
      addToast({
        type: 'success',
        title: 'Item marked returned',
        message: 'The record has been updated.'
      })
      await loadItems()
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Unable to update item',
        message: error?.message || 'Please try again.'
      })
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-2xl bg-white dark:bg-[#111a30] border border-gray-200/70 dark:border-gray-800 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Log found item</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Quick intake for property</p>
          </div>
        </div>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">Description</label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              placeholder="What was found?"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">Found at</label>
              <input
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                placeholder="Location"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">Stored at</label>
              <input
                value={form.storage_location}
                onChange={(e) => setForm((prev) => ({ ...prev, storage_location: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                placeholder="Locker / office"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#2A3990] text-white py-2.5 font-semibold shadow-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save item'}
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#111a30] border border-gray-200/70 dark:border-gray-800 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Items in storage</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Search and manage property</p>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items…"
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm w-40"
          />
        </div>

        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading items…</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No items found.</div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.location ? `Found at ${item.location}` : 'Location not specified'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Stored at {item.storage_location || 'Unknown'}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                    {item.status || 'stored'}
                  </span>
                  {item.status !== 'released' && (
                    <button
                      type="button"
                      onClick={() => handleMarkReturned(item.id)}
                      className="text-xs font-semibold text-[#2A3990]"
                    >
                      Mark returned
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

