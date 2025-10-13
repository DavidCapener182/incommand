'use client'

import React from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-[60vh]">
      {children}
    </section>
  )
}
