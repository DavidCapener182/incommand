'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  XMarkIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { semanticSearch, type SearchResult, type SearchOptions } from '@/lib/ai/semanticSearch'

interface SemanticSearchBarProps {
  incidents: any[]
  onSearch: (results: SearchResult[]) => void
  onClear?: () => void
  className?: string
  placeholder?: string
  showFilters?: boolean
}

export default function SemanticSearchBar({
  incidents,
  onSearch,
  onClear,
  className = '',
  placeholder = 'Search incidents with natural language... (e.g., "medical incidents at main gate last week")',
  showFilters = true
}: SemanticSearchBarProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  
  const [filters, setFilters] = useState<SearchOptions['filters']>({})
  
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('incommand_recent_searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Update suggestions as user types
  useEffect(() => {
    if (query.length > 2) {
      const newSuggestions = semanticSearch.getSuggestions(incidents, query)
      setSuggestions(newSuggestions)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [query, incidents])

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch()
      }, 500)
    } else {
      onClear?.()
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query, filters])

  const performSearch = async () => {
    setIsSearching(true)
    setShowSuggestions(false)

    try {
      const results = await semanticSearch.search(incidents, {
        query,
        filters,
        limit: 50,
        threshold: 0.2
      })

      onSearch(results)

      // Save to recent searches
      if (query.trim() && !recentSearches.includes(query)) {
        const updated = [query, ...recentSearches].slice(0, 10)
        setRecentSearches(updated)
        localStorage.setItem('incommand_recent_searches', JSON.stringify(updated))
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleRecentSearchClick = (search: string) => {
    setQuery(search)
  }

  const clearSearch = () => {
    setQuery('')
    setFilters({})
    setSuggestions([])
    setShowSuggestions(false)
    onClear?.()
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('incommand_recent_searches')
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isSearching ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <SparklesIcon className="h-5 w-5 text-blue-500" />
            </motion.div>
          ) : (
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.length > 2) setShowSuggestions(true)
          }}
          placeholder={placeholder}
          className="w-full pl-12 pr-24 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
          {showFilters && (
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`p-1 rounded transition-colors ${
                Object.keys(filters).length > 0
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Filters"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
            </button>
          )}

          {query && (
            <button
              onClick={clearSearch}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Clear search"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFiltersPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Incident Type
                </label>
                <select
                  value={filters?.incidentType || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, incidentType: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">All Types</option>
                  <option value="Medical">Medical</option>
                  <option value="Ejection">Ejection</option>
                  <option value="Refusal of Entry">Refusal of Entry</option>
                  <option value="Theft">Theft</option>
                  <option value="Fire">Fire</option>
                  <option value="Suspicious Behaviour">Suspicious Behaviour</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={filters?.priority || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filters?.status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setFilters({})}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden"
          >
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                  Suggestions
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-900 dark:text-white">{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Recent Searches
                  </span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    Clear
                  </button>
                </div>
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{search}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
