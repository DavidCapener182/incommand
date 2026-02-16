'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

export default function CardSkeleton() {
  return (
    <Card className="relative h-[130px] overflow-hidden border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/90 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.42)] dark:border-[#2d437a]/70 dark:bg-gradient-to-br dark:from-[#162346] dark:to-[#13213f]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-300/70 via-cyan-300/60 to-transparent" />
      <CardContent className="p-4 h-full flex flex-col items-center justify-center">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 mb-1"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
      </CardContent>
    </Card>
  )
}
