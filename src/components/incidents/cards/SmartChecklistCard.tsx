'use client'

import React, { useState } from 'react'
import { ClipboardDocumentCheckIcon, SparklesIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { callOpenAI } from '@/services/incidentAIService'

interface ChecklistItem {
  id: number
  task: string
  checked: boolean
}

interface SmartChecklistCardProps {
  factsObserved: string | undefined
}

export default function SmartChecklistCard({ factsObserved }: SmartChecklistCardProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  const handleGenerate = async () => {
    if (!factsObserved) return
    setLoading(true)
    try {
      const systemPrompt = `You are generating a response checklist for an incident. Return a JSON array of objects with "id" (number), "task" (string), and "checked" (boolean, always false initially).`
      const result = await callOpenAI(
        `Generate checklist for: ${factsObserved}`,
        systemPrompt,
        true
      )
      try {
        const parsed = JSON.parse(result)
        const items = Array.isArray(parsed) ? parsed : []
        setChecklist(items.map((item: any, idx: number) => ({
          id: item.id || idx + 1,
          task: item.task || item,
          checked: false
        })))
        setGenerated(true)
      } catch {
        setChecklist([])
      }
    } catch (e) {
      setChecklist([])
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = (id: number) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    )
  }

  if (!factsObserved) return null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-xs uppercase tracking-wider">
          <ClipboardDocumentCheckIcon className="w-4 h-4" /> Response Plan
        </h3>
        {!generated && (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="text-[10px] text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? (
              <>
                <ArrowPathIcon className="w-3 h-3 animate-spin" />
                ...
              </>
            ) : (
              <>
                <SparklesIcon className="w-3 h-3" />
                Generate
              </>
            )}
          </button>
        )}
      </div>
      {generated ? (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
          {checklist.map((item) => (
            <label key={item.id} className="flex items-start gap-2 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleItem(item.id)}
                  className="peer h-4 w-4 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-slate-600 checked:bg-blue-600 checked:border-transparent transition-all"
                />
                <CheckCircleIcon className="pointer-events-none absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span
                className={`text-xs transition-colors ${
                  item.checked
                    ? 'text-slate-400 line-through'
                    : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900'
                }`}
              >
                {item.task}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-slate-400 italic">Create a dynamic to-do list.</p>
      )}
    </div>
  )
}

