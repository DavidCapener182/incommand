import * as React from 'react'

import { cn } from '@/lib/utils'

type PageBackgroundProps = React.HTMLAttributes<HTMLDivElement>

const PageBackground = React.forwardRef<HTMLDivElement, PageBackgroundProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'min-h-screen bg-white dark:bg-[#151d34] px-6 py-6 sm:px-8 sm:py-8 space-y-8 transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)

PageBackground.displayName = 'PageBackground'

export { PageBackground }
