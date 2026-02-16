'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

export default function StatCardSkeleton() {
  return (
    <Card className="relative overflow-hidden border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/85 py-0 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.42)] dark:border-[#2d437a]/70 dark:bg-gradient-to-b dark:from-[#162346] dark:to-[#13213f]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-300/70 via-cyan-300/60 to-transparent" />
      <CardContent className="flex flex-col items-center justify-center gap-y-2 px-4 py-3 sm:px-5 sm:py-3">
        <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-600" />
        <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-600" />
        <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-600" />
      </CardContent>
    </Card>
  )
}
