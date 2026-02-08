'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

export interface QuickActionItem {
  id: string
  label: string
  description?: string
  shortcut?: string
  group?: string
  keywords?: string[]
  onSelect: () => void
}

interface QuickActionPaletteProps {
  isOpen: boolean
  onClose: () => void
  actions: QuickActionItem[]
}

export default function QuickActionPalette({
  isOpen,
  onClose,
  actions,
}: QuickActionPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredActions = useMemo(() => {
    const term = query.trim().toLowerCase()

    if (!term) {
      return actions
    }

    return actions.filter((action) => {
      const searchable = [
        action.label,
        action.description || '',
        action.group || '',
        ...(action.keywords || []),
      ]
        .join(' ')
        .toLowerCase()

      return searchable.includes(term)
    })
  }, [actions, query])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setQuery('')
    setActiveIndex(0)
    inputRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setActiveIndex((prev) => {
      if (filteredActions.length === 0) {
        return 0
      }
      return Math.min(prev, filteredActions.length - 1)
    })
  }, [filteredActions, isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (filteredActions.length === 0) {
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((prev) => (prev + 1) % filteredActions.length)
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length)
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        const selectedAction = filteredActions[activeIndex]
        if (selectedAction) {
          selectedAction.onSelect()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, filteredActions, isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120]">
          <motion.button
            type="button"
            aria-label="Close quick actions"
            className="absolute inset-0 h-full w-full cursor-default bg-slate-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <div className="pointer-events-none absolute inset-0 flex items-start justify-center px-4 pt-[10vh]">
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="pointer-events-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-incommand-primary-dark/20 bg-white shadow-2xl dark:border-white/15 dark:bg-incommand-surface"
            >
              <div className="flex items-center gap-3 border-b border-slate-200/80 px-4 py-3 dark:border-white/10">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search actions..."
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
                  aria-label="Close quick actions"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {filteredActions.length === 0 ? (
                  <div className="rounded-xl px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No matching actions found.
                  </div>
                ) : (
                  filteredActions.map((action, index) => {
                    const isActive = index === activeIndex
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={action.onSelect}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors ${
                          isActive
                            ? 'bg-incommand-brand-mobile/10 text-[#1f2d70] dark:bg-incommand-brand-mobile/35 dark:text-blue-100'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10'
                        }`}
                      >
                        <div className="min-w-0">
                          {action.group && (
                            <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              {action.group}
                            </div>
                          )}
                          <div className="truncate text-sm font-semibold">{action.label}</div>
                          {action.description && (
                            <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {action.description}
                            </div>
                          )}
                        </div>
                        {action.shortcut && (
                          <span className="ml-4 shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500 dark:border-white/20 dark:bg-white/5 dark:text-slate-300">
                            {action.shortcut}
                          </span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

