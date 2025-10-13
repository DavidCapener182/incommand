// src/components/KeyboardShortcutsHelp.tsx
'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, CommandLineIcon } from '@heroicons/react/24/outline'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface Shortcut {
  key: string
  description: string
  category: string
}

const shortcuts: Shortcut[] = [
  // Navigation
  { key: 'N', description: 'Create new incident', category: 'Navigation' },
  { key: '/', description: 'Focus search', category: 'Navigation' },
  { key: 'Esc', description: 'Close modal/dialog', category: 'Navigation' },
  { key: '?', description: 'Show keyboard shortcuts', category: 'Navigation' },
  { key: 'G then H', description: 'Go to home/dashboard', category: 'Navigation' },
  { key: 'G then I', description: 'Go to incidents', category: 'Navigation' },
  
  // Incident Actions
  { key: 'Ctrl/⌘ + S', description: 'Save current incident', category: 'Incident Actions' },
  { key: 'Ctrl/⌘ + Enter', description: 'Submit/log incident', category: 'Incident Actions' },
  { key: 'Ctrl/⌘ + D', description: 'Save as draft', category: 'Incident Actions' },
  { key: 'Ctrl/⌘ + K', description: 'Quick actions', category: 'Incident Actions' },
  
  // Voice Input
  { key: 'Ctrl/⌘ + Shift + M', description: 'Start/stop voice input', category: 'Voice Input' },
  { key: 'Ctrl/⌘ + Shift + V', description: 'Toggle voice mode', category: 'Voice Input' },
  
  // Table Navigation
  { key: '↑ / ↓', description: 'Navigate incidents', category: 'Table' },
  { key: 'Enter', description: 'Open selected incident', category: 'Table' },
  { key: 'Space', description: 'Select incident (multi-select)', category: 'Table' },
  { key: 'Ctrl/⌘ + A', description: 'Select all incidents', category: 'Table' },
  
  // Filters
  { key: 'F', description: 'Toggle filters', category: 'Filters' },
  { key: 'Ctrl/⌘ + F', description: 'Advanced search', category: 'Filters' },
  { key: 'Alt + 1-4', description: 'Filter by priority', category: 'Filters' },
]

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const focusTrapRef = useFocusTrap({ enabled: isOpen, restoreFocus: true })

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, Shortcut[]>)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
          >
            <motion.div
              ref={focusTrapRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1a2a57] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <CommandLineIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <h2
                    id="shortcuts-title"
                    className="text-xl font-bold text-gray-900 dark:text-white"
                  >
                    Keyboard Shortcuts
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close keyboard shortcuts help"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-5rem)] custom-scrollbar">
                <div className="space-y-6">
                  {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {categoryShortcuts.map((shortcut) => (
                          <div
                            key={shortcut.key}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {shortcut.description}
                            </span>
                            <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm">
                              {shortcut.key}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer tip */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Pro tip:</strong> Press <kbd className="px-2 py-0.5 text-xs bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-700 rounded">?</kbd> anytime to view these shortcuts
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

