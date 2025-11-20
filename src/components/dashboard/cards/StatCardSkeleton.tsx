'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

export default function StatCardSkeleton() {
  return (
    <Card className="rounded-none border-0 shadow-none py-0">
      <CardContent className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 p-4 sm:p-6">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
        <div className="w-full h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
      </CardContent>
    </Card>
  )
}

