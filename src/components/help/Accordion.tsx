'use client'

import React, { useState, useId } from 'react'

export default function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div className="border border-gray-200 dark:border-[#2d437a] rounded-xl overflow-hidden">
      <button
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 bg-white/70 dark:bg-[#1e2a78]/70 hover:bg-white/90 dark:hover:bg-[#1e2a78]/90"
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
      </button>
      <div id={`${id}-panel`} hidden={!open} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-100">
        {children}
      </div>
    </div>
  )
}


