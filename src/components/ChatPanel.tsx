'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import TeamChat from './chat/TeamChat'
import AIChat from './chat/AIChat'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'team' | 'ai'
  eventId: string
  companyId: string
}

export default function ChatPanel({
  isOpen,
  onClose,
  initialMode = 'team',
  eventId,
  companyId
}: ChatPanelProps) {
  const [activeMode, setActiveMode] = useState<'team' | 'ai'>(initialMode)
  const { user } = useAuth()
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === 'dark'
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Add class to body to indicate chat is open
      document.body.classList.add('chat-open')
      console.log('Chat opened - added chat-open class to body')
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.classList.remove('chat-open')
        console.log('Chat closed - removed chat-open class from body')
      }
    }
  }, [isOpen, onClose])

  if (!isOpen || !user) return null

  const panelVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1
    },
    exit: { 
      x: '100%', 
      opacity: 0
    }
  }

  const mobileVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1
    },
    exit: { 
      y: '100%', 
      opacity: 0
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - positioned between top and bottom nav bars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 top-16 bottom-16 bg-black bg-opacity-30 z-[50]"
            onClick={onClose}
          />

          {/* Chat Panel */}
          <motion.div
            variants={isMobile ? mobileVariants : panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            data-chat-panel
            className={`
              fixed z-[60] bg-white dark:bg-gray-800 shadow-2xl flex flex-col
              ${isMobile 
                ? 'inset-x-0 bottom-0 top-16 rounded-t-2xl' 
                : 'right-0 top-16 bottom-16 w-96 max-w-[400px]'
              }
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Chat
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveMode('team')}
                className={`
                  flex-1 px-4 py-3 text-sm font-medium transition-colors
                  ${activeMode === 'team'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }
                `}
              >
                Team Chat
              </button>
              <button
                onClick={() => setActiveMode('ai')}
                className={`
                  flex-1 px-4 py-3 text-sm font-medium transition-colors
                  ${activeMode === 'ai'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }
                `}
              >
                AI Assistant
              </button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {activeMode === 'team' ? (
                <TeamChat
                  eventId={eventId}
                  companyId={companyId}
                  userId={user.id}
                  userCallsign={user.user_metadata?.callsign || user.email?.split('@')[0] || 'User'}
                />
              ) : (
                <AIChat
                  eventId={eventId}
                  companyId={companyId}
                  userId={user.id}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
