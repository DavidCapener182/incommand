import { useEffect, useCallback } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  handler: () => void
  description: string
  category?: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Don't trigger if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Exception: Allow Escape to work in inputs
        if (event.key !== 'Escape') {
          return
        }
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = !shortcut.ctrl || event.ctrlKey || event.metaKey
        const shiftMatches = !shortcut.shift || event.shiftKey
        const altMatches = !shortcut.alt || event.altKey
        const metaMatches = !shortcut.meta || event.metaKey

        // Check if all modifiers match exactly
        const modifiersMatch =
          (shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey) &&
          (shortcut.shift ? event.shiftKey : !event.shiftKey) &&
          (shortcut.alt ? event.altKey : !event.altKey)

        if (keyMatches && modifiersMatch) {
          event.preventDefault()
          shortcut.handler()
          break
        }
      }
    },
    [shortcuts, enabled]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Utility to format shortcut for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = []
  
  if (shortcut.ctrl || shortcut.meta) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')
  }
  if (shortcut.shift) parts.push('⇧')
  if (shortcut.alt) parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt')
  
  parts.push(shortcut.key.toUpperCase())
  
  return parts.join('+')
}

// Common shortcut presets
export const COMMON_SHORTCUTS = {
  newIncident: {
    key: 'n',
    description: 'Create new incident',
    category: 'Incidents'
  },
  search: {
    key: '/',
    description: 'Focus search',
    category: 'Navigation'
  },
  escape: {
    key: 'Escape',
    description: 'Close modal or cancel',
    category: 'General'
  },
  export: {
    key: 'e',
    ctrl: true,
    description: 'Export data',
    category: 'Actions'
  },
  commandPalette: {
    key: 'k',
    ctrl: true,
    description: 'Open command palette',
    category: 'Navigation'
  },
  help: {
    key: '?',
    shift: true,
    description: 'Show keyboard shortcuts',
    category: 'General'
  },
  save: {
    key: 's',
    ctrl: true,
    description: 'Save current form',
    category: 'Actions'
  },
  refresh: {
    key: 'r',
    ctrl: true,
    shift: true,
    description: 'Refresh data',
    category: 'Actions'
  }
}

