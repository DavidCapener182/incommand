'use client'

import React from 'react'
import dynamic from 'next/dynamic'

// Dynamically import client component to ensure hydration on new route
const GreenGuideTools = dynamic(() => import('@/components/admin/GreenGuideTools'), { ssr: false })

export default function AdminGreenGuidePage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Green Guide Tools</h1>
      <GreenGuideTools />
    </div>
  )
}


