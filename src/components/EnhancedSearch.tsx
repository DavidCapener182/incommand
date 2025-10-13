// src/components/EnhancedSearch.tsx
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  ClockIcon,
  BookmarkIcon,
  SparklesIcon,
  FunnelIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { FilterState } from '@/utils/incidentFilters'

interface SavedSearch {
  id: string
  name: string
  query: string
  filters: FilterState
  timestamp: number
}

interface SearchSuggestion {
  text: string
  type: 'recent' | 'saved' | 'smart'
  filters?: FilterState
}

interface EnhancedSearchProps {
  value: string
  onChange: (value: string) => void
  onFilterChange?: (filters: FilterState) => void
  placeholder?: string
  className?: string
  showSuggestions?: boolean
  autoFocus?: boolean
}

export default function EnhancedSearch({
  value,
  onChange,
  onFilterChange,
  placeholder = 'Search incidents by type, callsign, or description...',
  className = '',
  showSuggestions = true,
  autoFocus = false
}: EnhancedSearchProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load saved and recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('incident_saved_searches')
      const recent = localStorage.getItem('incident_recent_searches')
      
      if (saved) setSavedSearches(JSON.parse(saved))
      if (recent) setRecentSearches(JSON.parse(recent))
    } catch (error) {
      console.error('Failed to load search history:', error)
    }
  }, [])

  // Generate smart suggestions based on common patterns
  const smartSuggestions: SearchSuggestion[] = [
    { text: 'High priority open incidents', type: 'smart', filters: { types: [], statuses: ['open'], priorities: ['high', 'urgent'], query: '' } },
    { text: 'Medical incidents today', type: 'smart', filters: { types: ['Medical'], statuses: [], priorities: [], query: '' } },
    { text: 'Ejections this event', type: 'smart', filters: { types: ['Ejection'], statuses: [], priorities: [], query: '' } },
    { text: 'Unresolved incidents', type: 'smart', filters: { types: [], statuses: ['open', 'logged'], priorities: [], query: '' } },
  ]

  // Update suggestions when input changes or focus changes
  useEffect(() => {
    if (!isFocused) {
      setSuggestions([])
      return
    }

    const newSuggestions: SearchSuggestion[] = []

    // Add saved searches
    savedSearches.forEach(saved => {
      if (!value || saved.name.toLowerCase().includes(value.toLowerCase()) || saved.query.toLowerCase().includes(value.toLowerCase())) {
        newSuggestions.push({
          text: saved.name,
          type: 'saved',
          filters: saved.filters
        })
      }
    })

    // Add recent searches
    recentSearches.forEach(recent => {
      if (!value || recent.toLowerCase().includes(value.toLowerCase())) {
        newSuggestions.push({
          text: recent,
          type: 'recent'
        })
      }
    })

    // Add smart suggestions
    if (!value) {
      newSuggestions.push(...smartSuggestions)
    } else {
      smartSuggestions.forEach(smart => {
        if (smart.text.toLowerCase().includes(value.toLowerCase())) {
          newSuggestions.push(smart)
        }
      })
    }

    setSuggestions(newSuggestions.slice(0, 8)) // Limit to 8 suggestions
  }, [value, isFocused, savedSearches, recentSearches])

  // Save search to recent searches
  const saveToRecent = useCallback((query: string) => {
    if (!query.trim()) return

    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10)
    setRecentSearches(updated)
    
    try {
      localStorage.setItem('incident_recent_searches', JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save recent search:', error)
    }
  }, [recentSearches])

  // Save current search as a named search
  const saveSearch = useCallback(() => {
    const name = prompt('Enter a name for this search:')
    if (!name) return

    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: name.trim(),
      query: value,
      filters: { types: [], statuses: [], priorities: [], query: value }, // Would need to get current filters from parent
      timestamp: Date.now()
    }

    const updated = [newSavedSearch, ...savedSearches]
    setSavedSearches(updated)
    
    try {
      localStorage.setItem('incident_saved_searches', JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save search:', error)
    }
  }, [value, savedSearches])

  // Delete saved search
  const deleteSavedSearch = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = savedSearches.filter(s => s.id !== id)
    setSavedSearches(updated)
    
    try {
      localStorage.setItem('incident_saved_searches', JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to delete saved search:', error)
    }
  }, [savedSearches])

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    try {
      localStorage.removeItem('incident_recent_searches')
    } catch (error) {
      console.error('Failed to clear recent searches:', error)
    }
  }, [])

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    onChange(suggestion.text)
    if (suggestion.filters && onFilterChange) {
      onFilterChange(suggestion.filters)
    }
    saveToRecent(suggestion.text)
    setIsFocused(false)
    inputRef.current?.blur()
  }, [onChange, onFilterChange, saveToRecent])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }, [onChange])

  // Handle key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveToRecent(value)
      setIsFocused(false)
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      setIsFocused(false)
      inputRef.current?.blur()
    }
  }, [value, saveToRecent])

  // Handle clear
  const handleClear = useCallback(() => {
    onChange('')
    inputRef.current?.focus()
  }, [onChange])

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get icon for suggestion type
  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'saved':
        return <BookmarkIcon className="h-4 w-4 text-blue-500" />
      case 'recent':
        return <ClockIcon className="h-4 w-4 text-gray-400" />
      case 'smart':
        return <SparklesIcon className="h-4 w-4 text-purple-500" />
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        
        <input
          ref={inputRef}
          id="search-input"
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="block w-full pl-12 pr-24 py-4 border-2 border-gray-200 dark:border-[#2d437a] rounded-2xl leading-5 bg-white dark:bg-[#182447] placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 shadow-lg hover:shadow-xl transition-all duration-200"
          aria-label="Search incidents"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={isFocused && suggestions.length > 0}
        />

        {/* Action Buttons */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              type="button"
              onClick={saveSearch}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Save this search"
              aria-label="Save search"
            >
              <BookmarkIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </motion.button>
          )}
          
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Clear search"
            >
              <XMarkIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && isFocused && suggestions.length > 0 && (
          <motion.div
            id="search-suggestions"
            role="listbox"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 w-full bg-white dark:bg-[#1a2a57] rounded-xl shadow-2xl border border-gray-200 dark:border-[#2d437a] overflow-hidden"
          >
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {suggestions.map((suggestion, index) => {
                const savedSearch = savedSearches.find(s => s.name === suggestion.text)
                
                return (
                  <motion.div
                    key={`${suggestion.type}-${suggestion.text}-${index}`}
                    role="option"
                    aria-selected="false"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getSuggestionIcon(suggestion.type)}
                      <span className="text-sm text-gray-900 dark:text-white truncate">
                        {suggestion.text}
                      </span>
                    </div>
                    
                    {savedSearch && (
                      <button
                        onClick={(e) => deleteSavedSearch(savedSearch.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                        aria-label={`Delete saved search: ${suggestion.text}`}
                      >
                        <TrashIcon className="h-4 w-4 text-red-500" />
                      </button>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Footer Actions */}
            {recentSearches.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-900">
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Clear recent searches
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

