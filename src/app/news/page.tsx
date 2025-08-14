'use client'

import React, { useMemo, useState } from 'react'

type NewsType = 'Announcement' | 'Feature' | 'Maintenance' | 'Event'

export default function NewsPage() {
  const [filter, setFilter] = useState<'All' | NewsType>('All')
  const items = useMemo(() => ([
    { type: 'Announcement' as NewsType, date: '2025-07-21', title: 'New AI Insights rollout', summary: 'We have improved the accuracy and speed of the AI insights module.' },
    { type: 'Feature' as NewsType, date: '2025-07-28', title: 'Scheduler templates', summary: 'Create reusable notification templates and schedules.' },
    { type: 'Maintenance' as NewsType, date: '2025-08-02', title: 'Planned downtime', summary: 'We will perform maintenance on Sunday 02:00 UTC.' },
    { type: 'Event' as NewsType, date: '2025-08-06', title: 'CityFest Coordination', summary: 'Live updates for CityFest operations and alerts.' },
  ]), [])

  const filtered = filter === 'All' ? items : items.filter(i => i.type === filter)

  return (
    <div className="p-4 md:p-6 pb-24">
      {/* Chips */}
      <div className="sticky top-0 bg-white/90 supports-[backdrop-filter]:backdrop-blur border-b -mx-4 md:-mx-6 px-4 md:px-6 py-2 z-10">
        <div className="flex items-center gap-2 text-xs">
          {(['All','Announcement','Feature','Maintenance','Event'] as const).map(c => (
            <button key={c} type="button" onClick={() => setFilter(c)}
              className={`px-2 py-1 rounded-full border ${filter===c?'bg-white text-slate-900 border-slate-300':'text-slate-700 hover:text-slate-900'}`}
              aria-label={`Filter ${c}`}
            >{c}</button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-3">
        {filtered.map((n, idx) => (
          <article key={idx} className="rounded-xl border p-4 flex flex-col shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] px-2 py-0.5 rounded-full border text-slate-600">{n.type}</span>
              <span className="text-[11px] text-slate-500">{n.date}</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">{n.title}</h3>
            <p className="text-sm text-slate-600 line-clamp-3 mt-1">{n.summary}</p>
            <div className="mt-auto pt-3">
              <button className="text-blue-600 text-sm hover:underline" aria-label={`View details: ${n.title}`}>View details</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

