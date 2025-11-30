'use client'

import { useState, useEffect } from 'react'
import { DevicePhoneMobileIcon, XMarkIcon } from '@heroicons/react/24/outline'

export function MobileBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has dismissed the banner in this session
    const dismissed = sessionStorage.getItem('mobileBannerDismissed')
    if (!dismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    sessionStorage.setItem('mobileBannerDismissed', 'true')
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-blue-200 bg-blue-50/95 backdrop-blur px-6 py-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-1">
          <DevicePhoneMobileIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900">Desktop Recommended</p>
          <p className="text-xs text-blue-700 mt-1">
            We&apos;re building a mobile app. For now, please use InCommand on a desktop for the best experience.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-blue-600 hover:text-blue-800 transition-colors"
          aria-label="Dismiss banner"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

