'use client'

import React, { useState, useEffect } from 'react'
import { 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Activity,
  Files
} from 'lucide-react'

interface AIOperationalSummaryCardProps {
  aiSummary: string
  onRefresh: () => void
  isGenerating: boolean
  totalIncidents: number
  highPriorityIncidents: number
  hasIncidents: boolean
  className?: string
}

// Helper to Process Markdown-like Text
const processSummaryText = (text: string): string => {
  if (!text) return ''
  
  // If it already looks like HTML, return as is
  if (text.includes('<div') || text.includes('<p>')) return text

  let processed = text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em class="text-slate-600 dark:text-slate-300">$1</em>')
    // H3
    .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2">$1</h3>')
    // H2
    .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-slate-900 dark:text-white mt-5 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">$1</h2>')
    // H1
    .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-4">$1</h1>')
    // Numbered Lists
    .replace(/^\d+\.\s+(.*$)/gim, '<div class="flex gap-2 mb-2 ml-1"><span class="font-bold text-blue-600 dark:text-blue-400">•</span><span class="text-slate-700 dark:text-slate-300">$1</span></div>')
    // Bullet Lists
    .replace(/^[-*]\s+(.*$)/gim, '<div class="flex gap-2 mb-1 ml-1"><span class="text-slate-400 dark:text-slate-500">•</span><span class="text-slate-700 dark:text-slate-300">$1</span></div>')
    // Double Line Breaks
    .replace(/\n\n/g, '<div class="h-2"></div>')
    // Single Line Breaks
    .replace(/\n/g, '<br />')

  return processed
}

export default function AIOperationalSummaryCard({
  aiSummary,
  onRefresh,
  isGenerating,
  totalIncidents,
  highPriorityIncidents,
  hasIncidents,
  className = ''
}: AIOperationalSummaryCardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className={`w-full ${className}`}>
      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400 relative overflow-hidden">
              <Sparkles className="w-5 h-5 relative z-10" />
              {/* Subtle pulse animation */}
              <div className="absolute inset-0 bg-indigo-400/20 blur-md rounded-full transform scale-0 animate-[pulse_3s_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  AI Operational Summary
                </h2>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Situation Report
              </h3>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onRefresh}
            disabled={isGenerating}
            className={`
              group flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isGenerating 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-wait' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md hover:scale-[1.02]'
              }
            `}
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            <span>{isGenerating ? 'Analyzing Data...' : 'Refresh Insights'}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 bg-slate-50/30 dark:bg-slate-900/30">
          {aiSummary ? (
            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div 
                className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-2"
                dangerouslySetInnerHTML={{ __html: processSummaryText(aiSummary) }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-full mb-3 shadow-sm">
                <Files className="w-6 h-6 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No summary generated yet. Click refresh to analyze current data.
              </p>
            </div>
          )}

          {/* Footer Stats */}
          {hasIncidents && (
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-blue-900/30 text-xs font-semibold">
                <Activity className="w-3.5 h-3.5" />
                {totalIncidents} Total Incidents
              </div>
              
              {highPriorityIncidents > 0 ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-100 dark:border-red-900/30 text-xs font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {highPriorityIncidents} High Priority
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-100 dark:border-emerald-900/30 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  No Critical Issues
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

