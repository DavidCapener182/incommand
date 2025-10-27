'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface ListCardItem {
  id?: string
  label: React.ReactNode
  value?: React.ReactNode
  description?: React.ReactNode
  badge?: {
    label: React.ReactNode
    variant?: React.ComponentProps<typeof Badge>['variant']
  }
  icon?: React.ReactNode
}

export interface ListCardProps {
  title: string
  icon?: React.ReactNode
  items: ListCardItem[]
  emptyState?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function ListCard({ title, icon, items, emptyState, footer, className }: ListCardProps) {
  return (
    <Card className={`card-depth ${className ?? ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && emptyState ? (
          <div className="text-xs text-muted-foreground text-center py-4">{emptyState}</div>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={item.id ?? `${item.label}-${index}`}
                className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-2"
              >
                <div className="flex items-start gap-2">
                  {item.icon ? <span className="mt-0.5 text-muted-foreground">{item.icon}</span> : null}
                  <div>
                    <div className="text-sm font-medium text-foreground flex items-center gap-2">
                      {item.label}
                      {item.badge ? (
                        <Badge variant={item.badge.variant ?? 'secondary'} className="text-[10px] uppercase tracking-wide">
                          {item.badge.label}
                        </Badge>
                      ) : null}
                    </div>
                    {item.description ? (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    ) : null}
                  </div>
                </div>
                {item.value ? <div className="text-sm font-semibold text-foreground">{item.value}</div> : null}
              </li>
            ))}
          </ul>
        )}

        {footer ? <div className="pt-2 border-t border-border/60 text-xs">{footer}</div> : null}
      </CardContent>
    </Card>
  )
}

ListCard.displayName = 'ListCard'

export default ListCard
