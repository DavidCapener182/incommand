'use client'

import React, { useState } from 'react'
import {
  PlusIcon,
  BoltIcon,
  FireIcon,
  HeartIcon,
  UserMinusIcon,
  ShieldExclamationIcon,
  MegaphoneIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<any>
  color: string
  bgColor: string
  hoverBgColor: string
  action: string
  incidentType?: string
  priority?: 'high' | 'medium' | 'low'
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'medical',
    label: 'Medical',
    icon: HeartIcon,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    hoverBgColor: 'hover:bg-red-200 dark:hover:bg-red-800/30',
    action: 'create-incident',
    incidentType: 'Medical',
    priority: 'high'
  },
  {
    id: 'fire',
    label: 'Fire',
    icon: FireIcon,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    hoverBgColor: 'hover:bg-orange-200 dark:hover:bg-orange-800/30',
    action: 'create-incident',
    incidentType: 'Fire',
    priority: 'high'
  },
  {
    id: 'ejection',
    label: 'Ejection',
    icon: UserMinusIcon,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    hoverBgColor: 'hover:bg-purple-200 dark:hover:bg-purple-800/30',
    action: 'create-incident',
    incidentType: 'Ejection',
    priority: 'medium'
  },
  {
    id: 'suspicious',
    label: 'Suspicious',
    icon: ShieldExclamationIcon,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    hoverBgColor: 'hover:bg-yellow-200 dark:hover:bg-yellow-800/30',
    action: 'create-incident',
    incidentType: 'Suspicious Behaviour',
    priority: 'high'
  },
  {
    id: 'announcement',
    label: 'Broadcast',
    icon: MegaphoneIcon,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    hoverBgColor: 'hover:bg-blue-200 dark:hover:bg-blue-800/30',
    action: 'broadcast',
    priority: 'medium'
  },
  {
    id: 'general',
    label: 'General',
    icon: PlusIcon,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    hoverBgColor: 'hover:bg-gray-200 dark:hover:bg-gray-600',
    action: 'create-incident',
    incidentType: 'Other',
    priority: 'low'
  }
]

interface QuickActionBarProps {
  onActionSelect: (action: QuickAction) => void
  className?: string
  variant?: 'floating' | 'inline' | 'bottom'
  showLabels?: boolean
}

export default function QuickActionBar({
  onActionSelect,
  className = '',
  variant = 'floating',
  showLabels = true
}: QuickActionBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const visibleActions = showAll ? QUICK_ACTIONS : QUICK_ACTIONS.slice(0, 4)

  const variantStyles = {
    floating: 'fixed bottom-20 right-4 z-40',
    inline: '',
    bottom: 'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-40'
  }

  const handleActionClick = (action: QuickAction) => {
    onActionSelect(action)
    if (variant === 'floating') {
      setIsExpanded(false)
    }
  }

  // Floating FAB variant
  if (variant === 'floating') {
    return (
      <div className={`${variantStyles.floating} ${className}`}>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="mb-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-3 border border-gray-200 dark:border-gray-700"
            >
              <div className="grid grid-cols-2 gap-2 mb-2">
                {visibleActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <motion.button
                      key={action.id}
                      onClick={() => handleActionClick(action)}
                      className={`flex flex-col items-center gap-1 p-3 ${action.bgColor} ${action.hoverBgColor} rounded-xl transition-colors`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className={`h-6 w-6 ${action.color}`} />
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {action.label}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
              {QUICK_ACTIONS.length > 4 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full text-xs text-blue-600 dark:text-blue-400 hover:underline py-1"
                >
                  {showAll ? 'Show Less' : `Show ${QUICK_ACTIONS.length - 4} More`}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <BoltIcon className="h-7 w-7" />
          </motion.div>
        </motion.button>
      </div>
    )
  }

  // Bottom bar variant
  if (variant === 'bottom') {
    return (
      <div className={`${variantStyles.bottom} ${className}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 p-3 min-w-[80px] ${action.bgColor} ${action.hoverBgColor} rounded-xl transition-all`}
                >
                  <Icon className={`h-6 w-6 ${action.color}`} />
                  {showLabels && (
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {action.label}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Inline variant
  return (
    <div className={`${variantStyles.inline} ${className}`}>
      <div className="flex flex-wrap gap-2">
        {visibleActions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={`flex items-center gap-2 px-4 py-2 ${action.bgColor} ${action.hoverBgColor} rounded-lg transition-all`}
            >
              <Icon className={`h-5 w-5 ${action.color}`} />
              {showLabels && (
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {action.label}
                </span>
              )}
            </button>
          )
        })}
        {QUICK_ACTIONS.length > 4 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
          >
            <EllipsisHorizontalIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            {showLabels && (
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {showAll ? 'Less' : 'More'}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
