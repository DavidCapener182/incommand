'use client'

import React, { useState } from 'react'

export default function GreenGuideTools() {
  const [query, setQuery] = useState('best practice for crowd control at gates')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reindexing, setReindexing] = useState(false)
  const [reindexMsg, setReindexMsg] = useState<string | null>(null)
  const [stats, setStats] = useState<{ count: number } | null>(null)

  React.useEffect(() => {
    fetch('/api/green-guide-stats')
      .then(r => r.json())
      .then(json => setStats(json?.count ? { count: json.count } : { count: 0 }))
      .catch(() => {})
  }, [])

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
    <div className="card-depth text-gray-900 dark:text-gray-100 p-6">
      <div className="mb-4">
        <a href="/green-guide" target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">Open Green Guide (PDF)</a>
      </div>
      <div className="mb-6">
        <button
          onClick={async () => {
            setReindexing(true)
            setReindexMsg(null)
            try {
              const resp = await fetch('/api/green-guide-reindex', { method: 'POST' })
              const json = await resp.json()
              if (!resp.ok) throw new Error(json?.error || 'Reindex failed')
              setReindexMsg(`Reindex started: ${json.chunks} chunk(s). ${json.note || ''}`)
            } catch (e: any) {
              setReindexMsg(e?.message || 'Reindex failed')
            } finally {
              setReindexing(false)
            }
          }}
          disabled={reindexing}
          className="px-3 py-2 bg-blue-600 text-white rounded"
        >
          {reindexing ? 'Reindexing…' : 'Quick Reindex'}
        </button>
        <div className="text-xs text-gray-600 mt-2 flex items-center gap-3">
          {reindexMsg && <span>{reindexMsg}</span>}
          {typeof stats?.count === 'number' && <span>Indexed: {stats.count} chunks</span>}
        </div>
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
          <div key={i} className="border rounded p-3 text-sm bg-white/80 dark:bg-[#1a2a57]/60">
            <div className="text-gray-700 dark:text-gray-200 mb-1">p.{r.page || '?'} {r.heading ? `• ${r.heading}` : ''}</div>
            <div className="text-gray-900 dark:text-white whitespace-pre-wrap">{r.content}</div>
          </div>
        ))}
        {(!results || results.length === 0) && !loading && (
          <div className="text-sm text-gray-500">No results</div>
        )}
      </div>
    </div>
  )
}


