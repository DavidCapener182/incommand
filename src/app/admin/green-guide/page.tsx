'use client'

import React, { useState } from 'react'

export default function AdminGreenGuidePage() {
  const [query, setQuery] = useState('best practice for crowd control at gates')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runSearch = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch('/api/green-guide-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, topK: 5 })
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json?.error || 'Search failed')
      setResults(json.results || [])
    } catch (e: any) {
      setError(e?.message || 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Green Guide Tools</h1>
      <div className="mb-4">
        <a href="/green-guide" target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">Open Green Guide (PDF)</a>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border rounded px-3 py-2 text-sm"
          placeholder="Search prompt (e.g., best practice for show stop)"
        />
        <button onClick={runSearch} disabled={loading} className="px-3 py-2 bg-emerald-600 text-white rounded">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      <div className="space-y-3">
        {results.map((r, i) => (
          <div key={i} className="border rounded p-3 text-sm">
            <div className="text-gray-700 mb-1">p.{r.page || '?'} {r.heading ? `• ${r.heading}` : ''}</div>
            <div className="text-gray-900 whitespace-pre-wrap">{r.content}</div>
          </div>
        ))}
        {(!results || results.length === 0) && !loading && (
          <div className="text-sm text-gray-500">No results</div>
        )}
      </div>
    </div>
  )
}


