'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

const OfflinePage: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true)
  const [lastOnline, setLastOnline] = useState<Date | null>(null)
  const [cachedPages, setCachedPages] = useState<string[]>([])

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine)
    if (navigator.onLine) {
      setLastOnline(new Date())
    }

    // Add event listeners
    const handleOnline = () => {
      setIsOnline(true)
      setLastOnline(new Date())
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Get cached pages
    getCachedPages()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getCachedPages = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        const pages: string[] = []

        for (const cacheName of cacheNames) {
          if (cacheName.includes('start-url') || cacheName.includes('static-resources')) {
            const cache = await caches.open(cacheName)
            const requests = await cache.keys()
            requests.forEach(request => {
              const url = new URL(request.url)
              if (url.pathname.startsWith('/') && !url.pathname.includes('.')) {
                pages.push(url.pathname)
              }
            })
          }
        }

        // Remove duplicates and sort
        const uniquePages = [...new Set(pages)].sort()
        setCachedPages(uniquePages)
      }
    } catch (error) {
      console.error('Failed to get cached pages:', error)
    }
  }

  const formatLastOnline = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }

  const handleRetryConnection = () => {
    window.location.reload()
  }

  const handleClearCache = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
        setCachedPages([])
        alert('Cache cleared successfully')
      }
    } catch (error) {
      console.error('Failed to clear cache:', error)
      alert('Failed to clear cache')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-500">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            You're Offline
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Don't worry! You can still access some features while offline.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Connection Status */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Connection Status</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isOnline 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {lastOnline && !isOnline && (
              <p className="mt-1 text-xs text-gray-500">
                Last online: {formatLastOnline(lastOnline)}
              </p>
            )}
          </div>

          {/* Available Features */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Available Offline Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                View cached pages
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Create incidents (will sync when online)
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Access help documentation
              </li>
            </ul>
          </div>

          {/* Cached Pages */}
          {cachedPages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Cached Pages</h3>
              <div className="space-y-1">
                {cachedPages.slice(0, 5).map((page, index) => (
                  <Link
                    key={index}
                    href={page}
                    className="block text-sm text-blue-600 hover:text-blue-800 truncate"
                  >
                    {page === '/' ? 'Home' : page.replace('/', '').replace(/-/g, ' ')}
                  </Link>
                ))}
                {cachedPages.length > 5 && (
                  <p className="text-xs text-gray-500">
                    +{cachedPages.length - 5} more pages cached
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleRetryConnection}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
            
            <button
              onClick={handleClearCache}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Cache
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              If you continue to have issues, try:
            </p>
            <ul className="mt-1 text-xs text-gray-500 space-y-1">
              <li>• Checking your internet connection</li>
              <li>• Refreshing the page</li>
              <li>• Contacting support if the problem persists</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OfflinePage
