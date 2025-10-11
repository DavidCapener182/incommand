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

  // Load night mode setting from localStorage on mount
  useEffect(() => {
    const savedSetting = localStorage.getItem('nightModeAlwaysOn')
    if (savedSetting === 'true') {
      setIsNightModeAlwaysOn(true)
      setIsNightModeActive(true)
      // Force dark mode
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  // Monitor system dark mode preference when not in always-on mode
  useEffect(() => {
    if (!isNightModeAlwaysOn && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        setIsNightModeActive(e.matches)
        if (e.matches) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }

      // Set initial state
      setIsNightModeActive(mediaQuery.matches)
      if (mediaQuery.matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      // Listen for changes
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [isNightModeAlwaysOn])

  const toggleNightModeAlwaysOn = () => {
    const newValue = !isNightModeAlwaysOn
    setIsNightModeAlwaysOn(newValue)
    
    // Save to localStorage
    localStorage.setItem('nightModeAlwaysOn', newValue.toString())
    
    if (newValue) {
      // Enable night mode always on
      setIsNightModeActive(true)
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else if (typeof window !== 'undefined') {
      // Revert to system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      setIsNightModeActive(mediaQuery.matches)
      if (mediaQuery.matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      document.documentElement.removeAttribute('data-theme')
    }
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
