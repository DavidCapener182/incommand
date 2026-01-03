'use client'

import React, { useState } from 'react'
import { LanguageIcon } from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { callOpenAI } from '@/services/incidentAIService'

interface TranslationCardProps {
  factsObserved: string | undefined
  onTranslationChange?: (text: string | null) => void
}

export default function TranslationCard({ factsObserved, onTranslationChange }: TranslationCardProps) {
  const [translated, setTranslated] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState('Spanish')

  const handleTranslate = async () => {
    if (!factsObserved) return
    setLoading(true)
    try {
      const systemPrompt = `You are a professional translator. Translate the incident report to ${language}. Maintain the factual, objective tone. Return only the translated text, no explanations.`
      const result = await callOpenAI(
        `Translate this incident report to ${language}:\n\n${factsObserved}`,
        systemPrompt,
        false
      )
      setTranslated(result)
      if (onTranslationChange) onTranslationChange(result)
    } catch (e) {
      setTranslated('Error translating')
      if (onTranslationChange) onTranslationChange('Error translating')
    } finally {
      setLoading(false)
    }
  }

  if (!factsObserved) return null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-xs uppercase tracking-wider">
          <LanguageIcon className="w-4 h-4" /> Translator
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-[10px] bg-slate-50 dark:bg-slate-800 border-none rounded py-0.5 pl-2 pr-6 focus:ring-1 focus:ring-blue-500"
          >
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
            <option>Italian</option>
            <option>Portuguese</option>
          </select>
          <button
            onClick={handleTranslate}
            disabled={loading}
            className="text-[10px] text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
          >
            {loading ? '...' : 'Go'}
          </button>
        </div>
      </div>
      {translated ? (
        <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded text-xs text-slate-700 dark:text-slate-300 italic border-l-2 border-blue-400">
          {translated}
        </div>
      ) : (
        <p className="text-[10px] text-slate-400 italic">Translate incident details.</p>
      )}
    </div>
  )
}

