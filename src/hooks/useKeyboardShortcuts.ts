// src/hooks/useKeyboardShortcuts.ts
'use client'

import { useEffect, useCallback, useRef } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
  description: string
  action: () => void
  disabled?: boolean
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
  preventDefault?: boolean
}

export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  preventDefault = true
}: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts)
  
  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Don't trigger shortcuts when typing in input fields (unless it's Escape)
    const target = event.target as HTMLElement
    const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    
    if (isInputField && event.key !== 'Escape') {
      return
    }

    for (const shortcut of shortcutsRef.current) {
      if (shortcut.disabled) continue

      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
      const altMatches = shortcut.alt ? event.altKey : !event.altKey
      const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey
      const metaMatches = shortcut.meta ? event.metaKey : !event.metaKey

      if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
        if (preventDefault) {
          event.preventDefault()
        }
        shortcut.action()
        break // Only trigger the first matching shortcut
      }
    }
  }, [enabled, preventDefault])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])

  return { shortcuts: shortcutsRef.current }
}

// Utility to format shortcut display string
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = []
  
  if (shortcut.ctrl) parts.push('Ctrl')
  if (shortcut.alt) parts.push('Alt')
  if (shortcut.shift) parts.push('Shift')
  if (shortcut.meta) parts.push('⌘')
  
  parts.push(shortcut.key.toUpperCase())
  
  return parts.join(' + ')
}
