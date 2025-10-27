'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface ProgressItem {
  id?: string
  label: React.ReactNode
  value: number
  description?: React.ReactNode
  status?: 'default' | 'success' | 'warning' | 'danger'
}

export interface ProgressCardProps {
  title: string
  icon?: React.ReactNode
  items: ProgressItem[]
  footer?: React.ReactNode
  className?: string
}

const statusBar: Record<NonNullable<ProgressItem['status']>, string> = {
  default: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
}

export function ProgressCard({ title, icon, items, footer, className }: ProgressCardProps) {
  return (
    <Card className={`card-depth ${className ?? ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => {
          const status = item.status ?? 'default'
          const value = Math.max(0, Math.min(100, item.value))
          return (
            <div key={item.id ?? `${item.label}-${index}`}
              className="rounded-lg border border-border/60 p-2">
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-foreground">{item.label}</span>
                <span className="text-muted-foreground">{value}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all duration-300 ${statusBar[status]}`}
                  style={{ width: `${value}%` }}
                />
              </div>
              {item.description ? (
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              ) : null}
            </div>
          )
        })}

        {footer ? <div className="pt-2 border-t border-border/60 text-xs">{footer}</div> : null}
      </CardContent>
    </Card>
  )
}

ProgressCard.displayName = 'ProgressCard'

export default ProgressCard
