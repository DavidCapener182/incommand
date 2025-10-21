import * as React from 'react'

import { cn } from '@/lib/utils'

type MetricCardProps = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ className, children, interactive = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-sm',
        interactive && 'hover:shadow-md hover:-translate-y-[1px]',
        'transition-all duration-200',
        'p-4 sm:p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)

MetricCard.displayName = 'MetricCard'

export { MetricCard }
