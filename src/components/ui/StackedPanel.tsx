import * as React from 'react'

import { cn } from '@/lib/utils'

type StackedPanelProps = React.HTMLAttributes<HTMLDivElement>

const StackedPanel = React.forwardRef<HTMLDivElement, StackedPanelProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-white/80 dark:bg-slate-900/80 rounded-3xl shadow-lg shadow-black/5 border border-gray-200/70 dark:border-gray-700/50',
        'p-6 sm:p-7 md:p-8 backdrop-blur-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)

StackedPanel.displayName = 'StackedPanel'

export { StackedPanel }
