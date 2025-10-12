'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { getIncidentTypeIcon } from '../utils/incidentIcons'

interface IncidentTypeCategoriesProps {
  selectedType: string
  onTypeSelect: (type: string) => void
  usageStats?: Record<string, number>
}

interface Category {
  id: string
  name: string
  types: string[]
  defaultExpanded?: boolean
  color: string
}

const CATEGORIES: Category[] = [
  {
    id: 'security',
    name: 'Security',
    types: ['Ejection', 'Refusal', 'Hostile Act', 'Counter-Terror Alert', 'Entry Breach', 'Theft', 'Fight', 'Weapon Related'],
    defaultExpanded: true,
    color: 'red'
  },
  {
    id: 'medical',
    name: 'Medical & Welfare',
    types: ['Medical', 'Welfare', 'Missing Child/Person', 'Sexual Misconduct'],
    defaultExpanded: true,
    color: 'pink'
  },
  {
    id: 'crowd',
    name: 'Crowd & Safety',
    types: ['Crowd Management', 'Evacuation', 'Fire Alarm', 'Suspected Fire', 'Fire', 'Queue Build-Up'],
    defaultExpanded: false,
    color: 'orange'
  },
  {
    id: 'operations',
    name: 'Operations',
    types: ['Attendance', 'Site Issue', 'Tech Issue', 'Environmental', 'Lost Property', 'Accreditation', 'Staffing', 'Accsessablity'],
    defaultExpanded: false,
    color: 'blue'
  },
  {
    id: 'event',
    name: 'Event',
    types: ['Artist Movement', 'Artist On Stage', 'Artist Off Stage', 'Event Timing', 'Timings', 'Sit Rep', 'Showdown', 'Emergency Show Stop'],
    defaultExpanded: false,
    color: 'purple'
  },
  {
    id: 'environment',
    name: 'Environment & Complaints',
    types: ['Noise Complaint', 'Animal Incident'],
    defaultExpanded: false,
    color: 'green'
  },
  {
    id: 'substances',
    name: 'Substances',
    types: ['Alcohol / Drug Related'],
    defaultExpanded: false,
    color: 'yellow'
  },
  {
    id: 'other',
    name: 'Other',
    types: ['Other'],
    defaultExpanded: false,
    color: 'gray'
  }
]

const colorClasses = {
  red: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10',
  pink: 'border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-900/10',
  orange: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10',
  blue: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10',
  purple: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10',
  green: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10',
  yellow: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10',
  gray: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
}

const headerColorClasses = {
  red: 'text-red-800 dark:text-red-200',
  pink: 'text-pink-800 dark:text-pink-200',
  orange: 'text-orange-800 dark:text-orange-200',
  blue: 'text-blue-800 dark:text-blue-200',
  purple: 'text-purple-800 dark:text-purple-200',
  green: 'text-green-800 dark:text-green-200',
  yellow: 'text-yellow-800 dark:text-yellow-200',
  gray: 'text-gray-800 dark:text-gray-200'
}

export default function IncidentTypeCategories({
  selectedType,
  onTypeSelect,
  usageStats = {}
}: IncidentTypeCategoriesProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CATEGORIES.filter(c => c.defaultExpanded).map(c => c.id))
  )

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  // Sort types within each category by usage
  const getSortedTypes = (types: string[]) => {
    return [...types].sort((a, b) => {
      const usageA = usageStats[a] || 0
      const usageB = usageStats[b] || 0
      return usageB - usageA // Higher usage first
    })
  }

  return (
    <div className="space-y-3">
      {CATEGORIES.map((category) => {
        const isExpanded = expandedCategories.has(category.id)
        const sortedTypes = getSortedTypes(category.types)
        
        return (
          <div
            key={category.id}
            className={`border-2 rounded-xl overflow-hidden transition-all ${
              colorClasses[category.color as keyof typeof colorClasses]
            }`}
          >
            {/* Category Header */}
            <button
              type="button"
              onClick={() => toggleCategory(category.id)}
              className={`w-full flex items-center justify-between px-4 py-3 font-semibold text-left transition-colors hover:opacity-80 ${
                headerColorClasses[category.color as keyof typeof headerColorClasses]
              }`}
            >
              <span className="flex items-center gap-2">
                {category.name}
                <span className="text-xs font-normal opacity-70">
                  ({sortedTypes.length})
                </span>
              </span>
              {isExpanded ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>

            {/* Category Types */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 pt-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {sortedTypes.map((type) => {
                      const { icon: Icon } = getIncidentTypeIcon(type)
                      const isSelected = selectedType === type
                      const usage = usageStats[type] || 0
                      
                      return (
                        <motion.button
                          key={type}
                          type="button"
                          onClick={() => onTypeSelect(type)}
                          className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500 text-white shadow-lg scale-105'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-400 hover:shadow-md'
                          }`}
                          whileHover={{ scale: isSelected ? 1.05 : 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Icon className="h-6 w-6" />
                          <span className="text-xs font-medium text-center leading-tight">
                            {type}
                          </span>
                          {usage > 0 && (
                            <span className={`absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-white text-blue-500'
                                : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                            }`}>
                              {usage}
                            </span>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

