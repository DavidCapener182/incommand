'use client'

import React, { useState, useEffect } from 'react'
import { TagIcon } from '@heroicons/react/24/outline'
import { callOpenAI } from '@/services/incidentAIService'

interface PredictiveTagsCardProps {
  factsObserved: string | undefined
  onTagsChange?: (tags: string[]) => void
  onTagClick?: (tag: string) => void
}

export default function PredictiveTagsCard({ factsObserved, onTagsChange, onTagClick }: PredictiveTagsCardProps) {
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (factsObserved && factsObserved.length > 15 && tags.length === 0) {
      const generate = async () => {
        setLoading(true)
        try {
          const systemPrompt = `You are a tag generator. Analyze the incident and return a JSON array of relevant tags (e.g., ["AlcoholRelated", "HighDensityArea", "MedicalAssist"]). Return only the array, no explanations.`
          const result = await callOpenAI(`Generate tags for: ${factsObserved}`, systemPrompt, true)
          try {
            const parsed = JSON.parse(result)
            const tagArray = Array.isArray(parsed) ? parsed : []
            setTags(tagArray)
            if (onTagsChange) onTagsChange(tagArray)
          } catch {
            setTags([])
            if (onTagsChange) onTagsChange([])
          }
        } catch (e) {
          setTags([])
        } finally {
          setLoading(false)
        }
      }
      const timer = setTimeout(generate, 3000)
      return () => clearTimeout(timer)
    }
  }, [factsObserved, tags.length])

  if (tags.length === 0 && !loading) return null

  return (
    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <TagIcon className="w-3 h-3 text-slate-400" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tags</span>
        {loading && <span className="w-1 h-1 bg-slate-400 rounded-full animate-pulse" />}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {loading && tags.length === 0 ? (
          <span className="text-[10px] text-slate-400 italic">Analyzing...</span>
        ) : (
          tags.map((tag, i) => (
            <button
              key={i}
              onClick={() => {
                if (onTagClick) {
                  onTagClick(tag)
                }
              }}
              className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px] text-slate-600 dark:text-slate-300 font-medium animate-in zoom-in-95 duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer transition-colors"
              style={{ animationDelay: `${i * 100}ms` }}
              title="Click to add to occurrence"
            >
              #{tag}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

