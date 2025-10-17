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
      <div className="card-depth p-4">
        {children}
      </div>
    </section>
  )
}


