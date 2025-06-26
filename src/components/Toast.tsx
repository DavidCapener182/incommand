'use client'

import React, { useState, useEffect } from 'react'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  urgent?: boolean
  onClick?: () => void
  meta?: any // e.g., { messageId: string }
}

interface ToastProps {
  messages: ToastMessage[]
  onRemove: (id: string) => void
}

const getToastIcon = (type: ToastMessage['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircleIcon className="h-5 w-5 text-green-400" />
    case 'error':
      return <XCircleIcon className="h-5 w-5 text-red-400" />
    case 'warning':
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
    case 'info':
      return <InformationCircleIcon className="h-5 w-5 text-blue-400" />
  }
}

const getToastStyles = (type: ToastMessage['type'], urgent?: boolean) => {
  const baseStyles = "rounded-lg shadow-lg border"
  
  if (urgent) {
    return `${baseStyles} bg-red-50 border-red-200 ring-2 ring-red-400 animate-pulse-glow`
  }
  
  switch (type) {
    case 'success':
      return `${baseStyles} bg-green-50 border-green-200`
    case 'error':
      return `${baseStyles} bg-red-50 border-red-200`
    case 'warning':
      return `${baseStyles} bg-yellow-50 border-yellow-200`
    case 'info':
      return `${baseStyles} bg-blue-50 border-blue-200`
  }
}

const getTextStyles = (type: ToastMessage['type']) => {
  switch (type) {
    case 'success':
      return { title: 'text-green-800', message: 'text-green-700' }
    case 'error':
      return { title: 'text-red-800', message: 'text-red-700' }
    case 'warning':
      return { title: 'text-yellow-800', message: 'text-yellow-700' }
    case 'info':
      return { title: 'text-blue-800', message: 'text-blue-700' }
  }
}

export default function Toast({ messages, onRemove }: ToastProps) {
  useEffect(() => {
    messages.forEach((message) => {
      if (message.duration !== 0) { // duration 0 means persistent
        const timer = setTimeout(() => {
          onRemove(message.id)
        }, message.duration || 8000) // Increased default from 5000ms to 8000ms (8 seconds)
        
        return () => clearTimeout(timer)
      }
    })
  }, [messages, onRemove])

  if (messages.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {messages.map((message) => {
        const textStyles = getTextStyles(message.type)
        
        return (
          <div
            key={message.id}
            className={`${getToastStyles(message.type, message.urgent)} p-4 transition-all duration-300 transform animate-slide-in-right ${message.onClick ? 'cursor-pointer hover:shadow-xl hover:bg-blue-100/60' : ''}`}
            style={{
              ...(message.urgent && {
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(220, 38, 38, 0.2)',
              })
            }}
            onClick={message.onClick}
            tabIndex={message.onClick ? 0 : undefined}
            role={message.onClick ? 'button' : undefined}
            aria-label={message.title}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getToastIcon(message.type)}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${textStyles.title}`}>
                  {message.title}
                </p>
                <p className={`mt-1 text-sm ${textStyles.message}`}>
                  {message.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className={`inline-flex rounded-md ${textStyles.message} hover:opacity-75 focus:outline-none`}
                  onClick={e => { e.stopPropagation(); onRemove(message.id); }}
                  aria-label="Dismiss notification"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Hook for managing toast messages
export function useToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    console.log('🔔 Toast notification:', toast.title);
    setMessages(prev => [...prev, { ...toast, id }]);
  }

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id))
  }

  const clearAll = () => {
    setMessages([])
  }

  return {
    messages,
    addToast,
    removeToast,
    clearAll
  }
} 