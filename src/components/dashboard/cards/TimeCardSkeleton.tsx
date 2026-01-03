'use client'

import React from 'react'

export default function TimeCardSkeleton() {
  return (
    <div className="card-time animate-pulse p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:block relative">
          <div className="hidden md:block">
            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-40 mb-2"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-28"></div>
          </div>
        </div>
        <div>
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-2"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center p-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

