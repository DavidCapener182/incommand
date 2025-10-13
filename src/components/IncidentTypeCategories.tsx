import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { getIncidentTypeIcon } from '@/utils/incidentIcons'

interface IncidentTypeCategoriesProps {
  selectedType: string
  onTypeSelect: (type: string) => void
  usageStats?: Record<string, number>
}

const INCIDENT_CATEGORIES = {
  'Security': {
    icon: '🛡️',
    types: [
      'Ejection', 'Refusal', 'Hostile Act', 'Counter-Terror Alert', 'Entry Breach', 
      'Theft', 'Fight', 'Weapon Related', 'Suspicious Behaviour'
    ],
    defaultExpanded: true
  },
  'Medical & Welfare': {
    icon: '🏥',
    types: [
      'Medical', 'Welfare', 'Missing Child/Person', 'Sexual Misconduct'
    ],
    defaultExpanded: true
  },
  'Crowd & Safety': {
    icon: '👥',
    types: [
      'Crowd Management', 'Evacuation', 'Fire', 'Fire Alarm', 'Suspected Fire', 
      'Queue Build-Up'
    ],
    defaultExpanded: false
  },
  'Operations': {
    icon: '⚙️',
    types: [
      'Attendance', 'Site Issue', 'Tech Issue', 'Environmental', 'Lost Property', 
      'Accreditation', 'Staffing', 'Accsessablity'
    ],
    defaultExpanded: false
  },
  'Event': {
    icon: '🎵',
    types: [
      'Artist Movement', 'Artist On Stage', 'Artist Off Stage', 'Event Timing', 
      'Timings', 'Sit Rep', 'Showdown', 'Emergency Show Stop'
    ],
    defaultExpanded: false
  },
  'Environment & Complaints': {
    icon: '🌍',
    types: [
      'Noise Complaint', 'Animal Incident', 'Environmental'
    ],
    defaultExpanded: false
  },
  'Substances': {
    icon: '🚫',
    types: [
      'Alcohol / Drug Related'
    ],
    defaultExpanded: false
  },
  'Other': {
    icon: '📋',
    types: [
      'Other'
    ],
    defaultExpanded: false
  }
} as const

export default function IncidentTypeCategories({ 
  selectedType, 
  onTypeSelect, 
  usageStats = {} 
}: IncidentTypeCategoriesProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    Object.keys(INCIDENT_CATEGORIES).forEach(category => {
      initial[category] = INCIDENT_CATEGORIES[category as keyof typeof INCIDENT_CATEGORIES].defaultExpanded
    })
    return initial
  })

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  // Sort incident types within each category by usage stats
  const sortedCategories = useMemo(() => {
    return Object.entries(INCIDENT_CATEGORIES).map(([categoryName, categoryData]) => {
      const sortedTypes = [...categoryData.types].sort((a, b) => {
        const aUsage = usageStats[a] || 0
        const bUsage = usageStats[b] || 0
        return bUsage - aUsage // Sort by usage count descending
      })
      
      return {
        name: categoryName,
        ...categoryData,
        types: sortedTypes
      }
    })
  }, [usageStats])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Incident Type
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {Object.keys(INCIDENT_CATEGORIES).length} categories
        </div>
      </div>

      {sortedCategories.map((category) => {
        const isExpanded = expandedCategories[category.name]
        const hasSelectedType = (category.types as unknown as string[]).includes(selectedType)

        return (
          <div
            key={category.name}
            className={`border rounded-lg transition-all duration-200 ${
              hasSelectedType 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {category.types.length} types
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasSelectedType && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
                {isExpanded ? (
                  <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Category Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-1 gap-2">
                      {category.types.map((type) => {
                        const iconConfig = getIncidentTypeIcon(type)
                        const IconComponent = iconConfig.icon
                        const isSelected = selectedType === type
                        const usageCount = usageStats[type] || 0

                        return (
                          <button
                            key={type}
                            onClick={() => onTypeSelect(type)}
                            className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 touch-target ${
                              isSelected
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                          >
                            <div className="flex-shrink-0">
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">
                                {type}
                              </div>
                              {usageCount > 0 && (
                                <div className={`text-xs ${
                                  isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {usageCount} uses
                                </div>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}

      {/* Search/Filter (Future enhancement) */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          💡 <strong>Tip:</strong> Categories are sorted by your usage frequency. 
          Expand categories to see all available incident types.
        </p>
      </div>
    </div>
  )
}