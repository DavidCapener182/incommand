'use client'

import React, { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  HomeIcon, 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  CogIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

interface CompactNavigationProps {
  onToggleFullNav?: () => void
  className?: string
}

export default function CompactNavigation({ onToggleFullNav, className = '' }: CompactNavigationProps) {
  const router = useRouter()
  const pathname = usePathname() || ''
  const [isExpanded, setIsExpanded] = useState(false)

  const navItems = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: HomeIcon, 
      path: '/', 
      active: pathname === '/' 
    },
    { 
      id: 'staff', 
      label: 'Staff', 
      icon: UserGroupIcon, 
      path: '/staff', 
      active: pathname.startsWith('/staff') 
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: ChartBarIcon, 
      path: '/analytics', 
      active: pathname.startsWith('/analytics') 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: CogIcon, 
      path: '/settings', 
      active: pathname.startsWith('/settings') 
    }
  ]

  const handleNavigation = (path: string) => {
    router.push(path)
    setIsExpanded(false)
  }

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Compact Icons Row */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
        {/* Left: Main Navigation Icons */}
        <div className="flex items-center space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  item.active 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                aria-label={item.label}
              >
                <Icon className="h-5 w-5" />
              </button>
            )
          })}
        </div>

        {/* Right: Chat and Menu */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push('/chat')}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Chat"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleToggleExpanded}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle navigation"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Expanded Navigation (when toggled) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-lg z-50"
          >
            <div className="px-4 py-3 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      item.active 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                )
              })}
              
              {onToggleFullNav && (
                <button
                  onClick={onToggleFullNav}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Bars3Icon className="h-5 w-5" />
                  <span className="font-medium">Full Navigation</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
