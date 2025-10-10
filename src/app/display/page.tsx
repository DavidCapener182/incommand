'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function DisplayModePage() {
  const [currentView, setCurrentView] = useState<'incidents' | 'map' | 'analytics'>('incidents')
  const [autoRotate, setAutoRotate] = useState(true)

  useEffect(() => {
    if (!autoRotate) return
    
    const interval = setInterval(() => {
      setCurrentView(prev => {
        if (prev === 'incidents') return 'map'
        if (prev === 'map') return 'analytics'
        return 'incidents'
      })
    }, 30000) // Rotate every 30 seconds

    return () => clearInterval(interval)
  }, [autoRotate])

  return (
    <div className="h-screen bg-black text-white p-4">
      <div className="h-full flex flex-col">
        <div className="text-4xl font-bold mb-4">COMMAND CENTER - LIVE VIEW</div>
        
        <motion.div
          key={currentView}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1"
        >
          {currentView === 'incidents' && <div>Incident Wall</div>}
          {currentView === 'map' && <div>Tactical Map</div>}
          {currentView === 'analytics' && <div>Live Analytics</div>}
        </motion.div>

        <div className="mt-4 flex gap-4 justify-center">
          {(['incidents', 'map', 'analytics'] as const).map(view => (
            <button
              key={view}
              onClick={() => { setCurrentView(view); setAutoRotate(false) }}
              className={`px-6 py-3 rounded-lg ${currentView === view ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              {view.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
