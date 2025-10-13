'use client'

import React from 'react'

export default function TipCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200/60 dark:border-blue-800/40 text-sm">
      {children}
    </div>
  )
}


