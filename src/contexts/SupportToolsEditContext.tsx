'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

interface PendingChanges {
  [cardId: string]: {
    type: 'stand' | 'staffing' | 'crowd' | 'transport' | 'fixture'
    data: any
  }
}

interface SupportToolsEditContextType {
  isEditMode: boolean
  toggleEditMode: () => void
  pendingChanges: PendingChanges
  addPendingChange: (cardId: string, type: 'stand' | 'staffing' | 'crowd' | 'transport' | 'fixture', data: any) => void
  clearPendingChanges: () => void
  saveAllChanges: () => Promise<void>
  cancelAllChanges: () => void
  hasPendingChanges: boolean
}

const SupportToolsEditContext = createContext<SupportToolsEditContextType | undefined>(undefined)

const STORAGE_KEY = 'support-tools-edit-mode'

export function SupportToolsEditContextProvider({ children }: { children: React.ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({})

  // Load edit mode preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'true') {
      setIsEditMode(true)
    }
  }, [])

  // Persist edit mode preference
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isEditMode))
  }, [isEditMode])

  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev)
    // Clear pending changes when exiting edit mode without saving
    if (isEditMode) {
      setPendingChanges({})
    }
  }, [isEditMode])

  const addPendingChange = useCallback((
    cardId: string,
    type: 'stand' | 'staffing' | 'crowd' | 'transport' | 'fixture',
    data: any
  ) => {
    setPendingChanges(prev => ({
      ...prev,
      [cardId]: { type, data }
    }))
  }, [])

  const clearPendingChanges = useCallback(() => {
    setPendingChanges({})
  }, [])

  const saveAllChanges = useCallback(async () => {
    const entries = Object.entries(pendingChanges)
    if (entries.length === 0) return

    try {
      // Save each card's changes to its respective API endpoint
      const savePromises = entries.map(async ([cardId, change]) => {
        const { type, data } = change
        let endpoint = ''
        let method = 'POST'

        switch (type) {
          case 'stand':
            endpoint = '/api/football/stands'
            break
          case 'staffing':
            endpoint = '/api/football/staffing'
            break
          case 'crowd':
            endpoint = '/api/football/crowd'
            break
          case 'transport':
            endpoint = '/api/football/transport'
            break
          case 'fixture':
            endpoint = '/api/football/fixture'
            break
        }

        if (!endpoint) return

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })

        if (!response.ok) {
          throw new Error(`Failed to save ${type} changes`)
        }

        return response.json()
      })

      await Promise.all(savePromises)
      setPendingChanges({})
      setIsEditMode(false)
    } catch (error) {
      console.error('Error saving all changes:', error)
      throw error
    }
  }, [pendingChanges])

  const cancelAllChanges = useCallback(() => {
    setPendingChanges({})
    setIsEditMode(false)
  }, [])

  const hasPendingChanges = Object.keys(pendingChanges).length > 0

  return (
    <SupportToolsEditContext.Provider
      value={{
        isEditMode,
        toggleEditMode,
        pendingChanges,
        addPendingChange,
        clearPendingChanges,
        saveAllChanges,
        cancelAllChanges,
        hasPendingChanges
      }}
    >
      {children}
    </SupportToolsEditContext.Provider>
  )
}

export function useSupportToolsEdit() {
  const context = useContext(SupportToolsEditContext)
  if (context === undefined) {
    throw new Error('useSupportToolsEdit must be used within a SupportToolsEditContextProvider')
  }
  return context
}

