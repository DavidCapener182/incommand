'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ChatBubbleLeftRightIcon, SparklesIcon } from '@heroicons/react/24/outline'

interface ChatTabsProps {
  activeMode: 'team' | 'ai'
  onModeChange: (mode: 'team' | 'ai') => void
}

export default function ChatTabs({ activeMode, onModeChange }: ChatTabsProps) {
  const tabs = [
    {
      id: 'team' as const,
      label: 'Team Chat',
      icon: ChatBubbleLeftRightIcon,
      emoji: '💬'
    },
    {
      id: 'ai' as const,
      label: 'AI Assistant',
      icon: SparklesIcon,
      emoji: '✨'
    }
  ]

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1">
      {tabs.map((tab) => {
        const isActive = activeMode === tab.id
        const Icon = tab.icon
        
        return (
          <button
            key={tab.id}
            onClick={() => onModeChange(tab.id)}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 min-h-[44px] touch-target
              ${isActive
                ? 'text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }
            `}
            aria-pressed={isActive}
            aria-label={`Switch to ${tab.label}`}
          >
            {/* Animated background for active tab */}
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-[#2A3990] rounded-full"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              />
            )}
            
            {/* Tab content */}
            <div className="relative z-10 flex items-center gap-2">
              <span className="text-base">{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
