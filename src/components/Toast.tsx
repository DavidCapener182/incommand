'use client'

import React, { useState, useEffect } from 'react'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useEscalationToast } from '../contexts/EscalationToastContext'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  urgent?: boolean
  onClick?: () => void
  meta?: any // e.g., { messageId: string, notificationId?: string }
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
  // Safely use escalation toast context with fallback
  let isEscalationToastVisible = false;
  let isEscalationToastExpanded = false;
  
  try {
    const escalationContext = useEscalationToast();
    isEscalationToastVisible = escalationContext.isEscalationToastVisible;
    isEscalationToastExpanded = escalationContext.isEscalationToastExpanded;
  } catch (error) {
    // Context not available, use default positioning
    console.debug('EscalationToast context not available, using default toast positioning');
  }
  
  // Calculate positioning based on escalation toast state
  const getToastPosition = () => {
    if (!isEscalationToastVisible) {
      // No escalation toast, use normal position
      return 'fixed top-4 right-4 z-50 space-y-2';
    }
    
    if (isEscalationToastExpanded) {
      // Escalation toast is expanded (full height), position toasts below it
      // Escalation toast is 360px wide and takes up significant height when expanded
      return 'fixed top-[200px] right-4 z-50 space-y-2';
    } else {
      // Escalation toast is collapsed, position toasts below it
      return 'fixed top-16 right-4 z-50 space-y-2';
    }
  };

  return (
    <div className={getToastPosition()}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`${getToastStyles(message.type, message.urgent)} p-4 max-w-sm w-full transition-all duration-300 ease-in-out transform translate-x-0 opacity-100`}
          onClick={message.onClick}
          style={{ cursor: message.onClick ? 'pointer' : 'default' }}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getToastIcon(message.type)}
            </div>
            <div className="ml-3 flex-1">
              <p className={`text-sm font-medium ${getTextStyles(message.type)?.title}`}>
                {message.title}
              </p>
              <p className={`mt-1 text-sm ${getTextStyles(message.type)?.message}`}>
                {message.message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(message.id)
                }}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function useToast() {
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

  return {
    messages,
    addToast,
    removeToast,
    clearAll,
  }
} 