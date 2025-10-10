'use client'

import React from 'react'
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  const themes: Array<{ value: 'light' | 'dark' | 'system'; icon: any; label: string }> = [
    { value: 'light', icon: SunIcon, label: 'Light' },
    { value: 'dark', icon: MoonIcon, label: 'Dark' },
    { value: 'system', icon: ComputerDesktopIcon, label: 'System' }
  ]

  return (
    <div className={`flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg ${className}`}>
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`relative px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 ${
            theme === value
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          title={`Switch to ${label} mode`}
        >
          {theme === value && (
            <motion.div
              layoutId="theme-indicator"
              className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <Icon className="h-5 w-5 relative z-10" />
          <span className="text-sm font-medium relative z-10 hidden sm:inline">
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}

// Compact version for navigation
export function ThemeToggleCompact({ className = '' }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const Icon = resolvedTheme === 'dark' ? MoonIcon : SunIcon

  return (
    <button
      onClick={cycleTheme}
      className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
      title={`Current: ${theme === 'system' ? 'System' : theme}. Click to change.`}
    >
      <Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
    </button>
  )
}

