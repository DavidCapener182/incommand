'use client'

import React from 'react'
import Dashboard from '../components/Dashboard'

export default function HomePage() {
  const isSplash = false // Replace with actual logic to determine splash screen

  return (
    <main>
      <Dashboard />
      {/* {showFloatingButtons && !isSplash && (
        <div className="floating-buttons">...</div>
      )} */}
    </main>
  )
} 
