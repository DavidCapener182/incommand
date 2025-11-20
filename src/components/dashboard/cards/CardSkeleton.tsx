'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

export default function CardSkeleton() {
  return (
    <Card className="h-[130px] card-skeleton">
      <CardContent className="p-4 h-full flex flex-col items-center justify-center">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 mb-1"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
      </CardContent>
    </Card>
  )
}

