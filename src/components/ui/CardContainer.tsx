import * as React from 'react'

import { cn } from '@/lib/utils'

type CardContainerProps = React.HTMLAttributes<HTMLDivElement>

const CardContainer = React.forwardRef<HTMLDivElement, CardContainerProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-sm',
        'p-4 sm:p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)

CardContainer.displayName = 'CardContainer'

export { CardContainer }
