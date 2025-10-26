'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import TeamChat from './chat/TeamChat'
import AIChat from './chat/AIChat'
import ChatTabs from './chat/ChatTabs'

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
  const panelRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle escape key, focus trap, and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (!isOpen || e.key !== 'Tab') return
      
      const focusableElements = panelRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      if (!focusableElements || focusableElements.length === 0) return
      
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement
      
      // Prevent body scroll when chat is open
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'
      
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('keydown', handleTabKey)
      document.body.classList.add('chat-open')
      
      // Focus the panel for accessibility
      setTimeout(() => {
        panelRef.current?.focus()
      }, 100)
      
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.removeEventListener('keydown', handleTabKey)
        document.body.classList.remove('chat-open')
        
        // Restore body scroll
        document.body.style.overflow = originalStyle
        
        // Restore focus to the previously focused element
        if (previousActiveElement.current) {
          previousActiveElement.current.focus()
        }
      }
    }
  }, [isOpen, onClose])

  if (!isOpen || !user) return null

  const panelVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      x: '100%', 
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const
      }
    }
  }

  const mobileVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      y: '100%', 
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const
      }
    }
  }

  const contentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.2,
        delay: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: -10,
      transition: {
        duration: 0.15
      }
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
            className="fixed inset-x-0 top-16 bottom-16 bg-black/30 backdrop-blur-sm z-[50]"
            onClick={onClose}
          />

          {/* Chat Panel */}
          <motion.div
            ref={panelRef}
            variants={isMobile ? mobileVariants : panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            data-chat-panel
            role="dialog"
            aria-label="Chat panel"
            tabIndex={-1}
            className={`
              fixed z-[60] flex flex-col
              ${isMobile 
                ? 'inset-x-0 bottom-0 top-0 w-full h-screen bg-white dark:bg-gray-900' 
                : 'right-0 top-16 bottom-16 w-[420px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-2xl rounded-l-2xl'
              }
            `}
            style={{
              paddingLeft: isMobile ? 'max(env(safe-area-inset-left), 0px)' : '0',
              paddingRight: isMobile ? 'max(env(safe-area-inset-right), 0px)' : '0',
              paddingBottom: isMobile ? 'max(env(safe-area-inset-bottom), 0px)' : '0',
            }}
          >
            {/* Mobile Header */}
            {isMobile && (
              <div className="flex items-center justify-between p-4 bg-[#2A3990] text-white">
                <div className="flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="h-6 w-6" />
                  <h2 className="text-lg font-semibold">
                    Chat
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors touch-target"
                  aria-label="Close chat"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Desktop Header */}
            {!isMobile && (
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-[#2A3990]" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Chat
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close chat"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            )}

            {/* Tab Navigation */}
            <div className={`${isMobile ? 'p-4' : 'p-4 border-b border-gray-200 dark:border-gray-700'}`}>
              <ChatTabs 
                activeMode={activeMode} 
                onModeChange={setActiveMode} 
              />
            </div>

            {/* Chat Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMode}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="h-full"
                >
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
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
