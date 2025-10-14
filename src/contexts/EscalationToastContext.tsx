'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface EscalationToastContextType {
  isEscalationToastVisible: boolean
  isEscalationToastExpanded: boolean
  setEscalationToastVisible: (visible: boolean) => void
  setEscalationToastExpanded: (expanded: boolean) => void
}

const EscalationToastContext = createContext<EscalationToastContextType | undefined>(undefined)

export function EscalationToastProvider({ children }: { children: ReactNode }) {
  const [isEscalationToastVisible, setIsEscalationToastVisible] = useState(false)
  const [isEscalationToastExpanded, setIsEscalationToastExpanded] = useState(false)

  const setEscalationToastVisible = (visible: boolean) => {
    setIsEscalationToastVisible(visible)
  }

  const setEscalationToastExpanded = (expanded: boolean) => {
    setIsEscalationToastExpanded(expanded)
  }

  return (
    <EscalationToastContext.Provider
      value={{
        isEscalationToastVisible,
        isEscalationToastExpanded,
        setEscalationToastVisible,
        setEscalationToastExpanded,
      }}
    >
      {children}
    </EscalationToastContext.Provider>
  )
}

export function useEscalationToast() {
  const context = useContext(EscalationToastContext)
  if (context === undefined) {
    throw new Error('useEscalationToast must be used within an EscalationToastProvider')
  }
  return context
}
