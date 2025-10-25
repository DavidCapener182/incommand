'use client'

import React, { useState, useEffect, useRef } from 'react'
import { XMarkIcon, TagIcon, PlusIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

interface Tag {
  id: number
  tag: string
  color?: string
}

interface TagPreset {
  tag_name: string
  category: string | null
  color: string | null
  description: string | null
}

interface IncidentTagInputProps {
  incidentId: number
  existingTags?: Tag[]
  onTagsChange?: (tags: Tag[]) => void
  className?: string
}

export default function IncidentTagInput({ 
  incidentId, 
  existingTags = [],
  onTagsChange,
  className = '' 
}: IncidentTagInputProps) {
  const [tags, setTags] = useState<Tag[]>(existingTags)
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<TagPreset[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Load tag presets and popular tags
  useEffect(() => {
    if (input.length > 0) {
      loadSuggestions(input)
    } else {
      setSuggestions([])
    }
  }, [input])

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadSuggestions = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('tag_presets')
        .select('tag_name, category, color, description')
        .ilike('tag_name', `%${query}%`)
        .eq('is_active', true)
        .limit(10)

      if (error) throw error
      setSuggestions((data || []).map((d) => ({
        tag_name: d.tag_name,
        category: d.category ?? null,
        color: d.color ?? null,
        description: d.description ?? null,
      })))
      setShowSuggestions(true)
    } catch (error) {
      console.error('Error loading tag suggestions:', error)
    }
  }

  const addTag = async (tagName: string, color?: string) => {
    const normalizedTag = tagName.trim().toLowerCase().replace(/\s+/g, '-')
    
    if (!normalizedTag) return
    if (tags.some(t => t.tag === normalizedTag)) return

    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('incident_tags')
        .insert([{
          incident_id: incidentId,
          tag: normalizedTag,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select('id, tag')
        .single()

      if (error) throw error

      const newTag: Tag = {
        id: data.id,
        tag: data.tag,
        color: color || getColorForTag(data.tag)
      }

      const updatedTags = [...tags, newTag]
      setTags(updatedTags)
      onTagsChange?.(updatedTags)
      setInput('')
      setSuggestions([])
      setShowSuggestions(false)
    } catch (error) {
      console.error('Error adding tag:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const removeTag = async (tagId: number) => {
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('incident_tags')
        .delete()
        .eq('id', tagId)

      if (error) throw error

      const updatedTags = tags.filter(t => t.id !== tagId)
      setTags(updatedTags)
      onTagsChange?.(updatedTags)
    } catch (error) {
      console.error('Error removing tag:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const getColorForTag = (tag: string): string => {
    const colors: Record<string, string> = {
      medical: '#EF4444',
      crowd: '#F59E0B',
      vip: '#8B5CF6',
      weather: '#3B82F6',
      security: '#DC2626',
      staff: '#10B981',
      equipment: '#6B7280',
      'lost-found': '#F97316',
      noise: '#EC4899',
      suspicious: '#DC2626',
      theft: '#7C2D12',
      assault: '#991B1B',
      drugs: '#6D28D9',
      alcohol: '#B45309',
      fire: '#DC2626',
      evacuation: '#DC2626',
      'first-aid': '#10B981',
      child: '#3B82F6',
      elderly: '#3B82F6',
      disability: '#3B82F6'
    }
    return colors[tag] || '#6B7280'
  }

  return (
    <div className={`relative ${className}`}>
      {/* Tags Display */}
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-white shadow-sm"
            style={{ backgroundColor: tag.color || getColorForTag(tag.tag) }}
          >
            <TagIcon className="h-3.5 w-3.5" />
            {tag.tag}
            <button
              onClick={() => removeTag(tag.id)}
              disabled={isLoading}
              className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
              title="Remove tag"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>

      {/* Tag Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => input.length > 0 && setShowSuggestions(true)}
              placeholder="Add tags (e.g., medical, vip, crowd)..."
              disabled={isLoading}
              className="w-full px-3 py-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
            />
            <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          
          <button
            onClick={() => addTag(input)}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Add
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.tag_name}
                onClick={() => addTag(suggestion.tag_name, suggestion.color ?? undefined)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: suggestion.color ?? '#6B7280' }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {suggestion.tag_name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {suggestion.category}
                    </span>
                  </div>
                  {suggestion.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {suggestion.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Press Enter to add custom tags, or click suggestions
      </p>
    </div>
  )
}

// Compact variant for inline use
export function IncidentTagBadges({ 
  tags,
  onTagClick
}: { 
  tags: Tag[]
  onTagClick?: (tag: string) => void
}) {
  const getColorForTag = (tag: string): string => {
    const colors: Record<string, string> = {
      medical: '#EF4444',
      crowd: '#F59E0B',
      vip: '#8B5CF6',
      weather: '#3B82F6',
      security: '#DC2626',
      staff: '#10B981',
      equipment: '#6B7280',
      'lost-found': '#F97316',
      noise: '#EC4899',
      suspicious: '#DC2626',
      theft: '#7C2D12',
      assault: '#991B1B',
      drugs: '#6D28D9',
      alcohol: '#B45309',
      fire: '#DC2626',
      evacuation: '#DC2626',
      'first-aid': '#10B981',
      child: '#3B82F6',
      elderly: '#3B82F6',
      disability: '#3B82F6'
    }
    return colors[tag] || '#6B7280'
  }

  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => onTagClick?.(tag.tag)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white hover:opacity-80 transition-opacity"
          style={{ backgroundColor: tag.color || getColorForTag(tag.tag) }}
        >
          <TagIcon className="h-3 w-3" />
          {tag.tag}
        </button>
      ))}
    </div>
  )
}

