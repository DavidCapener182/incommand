'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface NightModeContextType {
  isNightModeAlwaysOn: boolean
  toggleNightModeAlwaysOn: () => void
  isNightModeActive: boolean
}

const NightModeContext = createContext<NightModeContextType | undefined>(undefined)

export function NightModeProvider({ children }: { children: React.ReactNode }) {
  const [isNightModeAlwaysOn, setIsNightModeAlwaysOn] = useState(false)
  const [isNightModeActive, setIsNightModeActive] = useState(false)

  // Dark mode removed: never apply dark to document
  useEffect(() => {
    if (typeof window === 'undefined') return
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.documentElement.removeAttribute('data-theme')
  }, [])

  const toggleNightModeAlwaysOn = () => {
    // No-op: dark mode has been removed
  }

  return (
    <NightModeContext.Provider value={{
      isNightModeAlwaysOn,
      toggleNightModeAlwaysOn,
      isNightModeActive
    }}>
      {children}
    </NightModeContext.Provider>
  )
}

export function useNightMode() {
  const context = useContext(NightModeContext)
  if (context === undefined) {
    throw new Error('useNightMode must be used within a NightModeProvider')
  }
  return context
}
