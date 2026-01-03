'use client'

import { useState, useEffect } from 'react'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface BenchmarkingWarningBannerProps {
  error: string | null
}

export default function BenchmarkingWarningBanner({ error }: BenchmarkingWarningBannerProps) {
  const [visible, setVisible] = useState(!!error)

  useEffect(() => {
    setVisible(!!error)
  }, [error])

  if (!visible || !error) return null

  return (
    <div className="animate-in slide-in-from-top-2 duration-300 ease-out">
      <div className="relative flex items-start gap-3 border-b border-amber-200 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-900/20 backdrop-blur-sm px-4 py-3 text-sm shadow-sm">
        <div className="mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400">
          <ExclamationTriangleIcon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 pr-6">
          <p className="font-semibold text-amber-900 dark:text-amber-100">
            Benchmarking service unavailable
          </p>
          <p className="mt-0.5 text-amber-700 dark:text-amber-200/80 leading-relaxed">
            {error}
          </p>
        </div>

        <button 
          onClick={() => setVisible(false)}
          className="absolute right-2 top-2 p-1.5 rounded-md text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40 dark:text-amber-400 transition-colors"
          aria-label="Dismiss warning"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

