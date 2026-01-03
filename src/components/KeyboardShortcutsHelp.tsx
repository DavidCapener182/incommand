'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, CommandLineIcon, LightBulbIcon } from '@heroicons/react/24/outline'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cn } from '@/lib/utils'

interface Shortcut {
  key: string
  description: string
  category: string
}

const shortcuts: Shortcut[] = [
  // Navigation
  { key: 'N', description: 'Create new incident', category: 'Navigation' },
  { key: '/', description: 'Focus search', category: 'Navigation' },
  { key: 'Esc', description: 'Close modal', category: 'Navigation' },
  { key: '?', description: 'Show shortcuts', category: 'Navigation' },
  { key: 'G + H', description: 'Go to dashboard', category: 'Navigation' },
  { key: 'G + I', description: 'Go to incidents', category: 'Navigation' },
  
  // Incident Actions
  { key: '⌘ + S', description: 'Save incident', category: 'Actions' },
  { key: '⌘ + Enter', description: 'Submit log', category: 'Actions' },
  { key: '⌘ + D', description: 'Save as draft', category: 'Actions' },
  { key: '⌘ + K', description: 'Quick menu', category: 'Actions' },
  
  // Voice Input
  { key: '⌘ + ⇧ + M', description: 'Start/stop voice', category: 'Voice' },
  { key: '⌘ + ⇧ + V', description: 'Toggle mode', category: 'Voice' },
  
  // Table
  { key: '↑ / ↓', description: 'Navigate rows', category: 'Table' },
  { key: 'Enter', description: 'Open selection', category: 'Table' },
  { key: 'Space', description: 'Select row', category: 'Table' },
  { key: '⌘ + A', description: 'Select all', category: 'Table' },
  
  // Filters
  { key: 'F', description: 'Toggle filters', category: 'Filters' },
  { key: '⌘ + F', description: 'Advanced search', category: 'Filters' },
  { key: 'Alt + 1-4', description: 'Filter priority', category: 'Filters' },
]

// Helper component for key visualization
const KeyCap = ({ children }: { children: string }) => {
  // Split combo keys if needed, though data structure handles string
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-[10px] font-bold font-mono text-slate-600 bg-white border border-slate-200 border-b-2 rounded-[4px] shadow-sm">
      {children}
    </kbd>
  )
}

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const focusTrapRef = useFocusTrap({ enabled: isOpen, restoreFocus: true })
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, Shortcut[]>)

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9998]"
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
          >
            <motion.div
              ref={focusTrapRef as React.RefObject<HTMLDivElement>}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <CommandLineIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 id="shortcuts-title" className="text-lg font-bold text-slate-900 dark:text-white">
                      Keyboard Shortcuts
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Supercharge your workflow</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                  {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
                        {category}
                      </h3>
                      <div className="space-y-1">
                        {categoryShortcuts.map((shortcut) => (
                          <div
                            key={shortcut.key}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                          >
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                              {shortcut.description}
                            </span>
                            <div className="flex gap-1">
                              {/* Handle combo keys visually */}
                              {shortcut.key.split(/(\s\+\s|\s\s|\s\/\s)/).map((part, i) => {
                                if (part.trim() === '+' || part.trim() === '/' || part.trim() === 'then') {
                                  return <span key={i} className="text-[10px] text-slate-400 self-center px-0.5">{part}</span>
                                }
                                if (!part.trim()) return null
                                return <KeyCap key={i}>{part}</KeyCap>
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Tip */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <LightBulbIcon className="h-4 w-4 text-amber-400" />
                  <span>
                    Pro tip: Press <KeyCap>?</KeyCap> anywhere in the dashboard to toggle this window
                  </span>
                </div>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  if (!mounted) return null

  return createPortal(modalContent, document.body)
}