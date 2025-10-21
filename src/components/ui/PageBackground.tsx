import * as React from 'react'

import { cn } from '@/lib/utils'

type PageBackgroundProps = React.HTMLAttributes<HTMLDivElement>

const PageBackground = React.forwardRef<HTMLDivElement, PageBackgroundProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'min-h-screen bg-[#E3EDFE] dark:bg-[#0b1229] p-4 sm:p-6 md:p-8 transition-colors',
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
