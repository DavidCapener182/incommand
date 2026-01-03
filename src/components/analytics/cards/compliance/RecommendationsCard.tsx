'use client'

import React, { useState, useEffect } from 'react'
import { Lightbulb, ArrowRight, Sparkles, ClipboardList } from 'lucide-react'

interface RecommendationsCardProps {
  recommendations?: string[]
  className?: string
}

// --- Sub-Component for Individual Recommendation ---
interface RecommendationItemProps {
  text: string
  index: number
}

const RecommendationItem = ({ text, index }: RecommendationItemProps) => {
  // Stagger delay based on index
  const delay = index * 100

  return (
    <li 
      className="
        group flex items-start gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800
        bg-slate-50/50 dark:bg-slate-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-100 dark:hover:border-blue-900/30
        transition-all duration-300 ease-out
        animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards
      "
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mt-0.5 p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
      <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
        {text}
      </span>
    </li>
  )
}

export default function RecommendationsCard({ 
  recommendations = [], 
  className = '' 
}: RecommendationsCardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  if (recommendations.length === 0) return null

  return (
    <div className={`w-full ${className}`}>
      {/* Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:scale-[1.005] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 relative overflow-hidden">
              <Lightbulb className="w-5 h-5 relative z-10" />
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-blue-400/20 blur-md rounded-full transform scale-0 animate-[pulse_3s_infinite]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                Recommendations
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Actionable steps to improve quality
              </p>
            </div>
          </div>
          
          {/* Summary Badge */}
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {recommendations.length}
            </span>
            <span className="text-xs font-medium text-blue-500 flex items-center gap-1 mt-1">
              <Sparkles className="w-3 h-3" /> Suggestions
            </span>
          </div>
        </div>

        {/* Content List */}
        <div className="p-6">
          <ul className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <RecommendationItem 
                key={index} 
                text={recommendation} 
                index={index} 
              />
            ))}
          </ul>
        </div>
        
        {/* Footer Hint (Optional) */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <ClipboardList className="w-4 h-4" />
          <span>Review these items with your team during the next briefing.</span>
        </div>

      </div>
    </div>
  )
}
