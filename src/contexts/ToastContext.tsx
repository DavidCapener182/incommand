'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import Toast, { ToastMessage } from '../components/Toast'

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
  clearAll: () => void
  messages: ToastMessage[]
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    setMessages(prev => [...prev, newToast])

    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 5000)
    }
  }

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id))
  }

  const clearAll = () => {
    setMessages([])
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast, clearAll, messages }}>
      {children}
      <Toast messages={messages} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
