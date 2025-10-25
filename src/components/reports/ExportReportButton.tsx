'use client'

import { useState } from 'react'

type Report = {
  title?: string
  subtitle?: string
  generatedAt?: string
  sections?: Array<{ heading: string; body?: string }>
  metadata?: Record<string, string | number | boolean>
}

export default function ExportReportButton({ getReport }: { getReport: () => Report }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    try {
      setLoading(true)
      setError(null)
      const report = getReport()

      const res = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report }),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Export failed')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `incommand-report-${new Date().toISOString().slice(0,10)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e.message ?? 'Failed to export')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="btn btn-primary" // your existing button class
      >
        {loading ? 'Generating…' : 'Export PDF'}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  )
}
