'use client'

import React from 'react'

export default function TutorialSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="mb-8" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        {title}
      </h2>
      <div className="bg-white/90 dark:bg-[#1e2a78]/90 backdrop-blur-lg rounded-2xl border border-gray-200/60 dark:border-[#2d437a]/50 p-4">
        {children}
      </div>
    </section>
  )
}


