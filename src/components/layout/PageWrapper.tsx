import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageWrapperProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

export const PageWrapper = React.forwardRef<HTMLElement, PageWrapperProps>(
  ({ className, children, ...props }, ref) => (
    <main
      ref={ref}
      className={cn(
        'min-h-screen bg-white dark:bg-slate-900 px-6 py-6 sm:px-8 sm:py-8 space-y-8',
        className
      )}
      {...props}
    >
      {children}
    </main>
  )
)

PageWrapper.displayName = 'PageWrapper'

// Standardized section wrapper for consistent inner spacing
export const SectionWrapper = React.forwardRef<HTMLElement, PageWrapperProps>(
  ({ className, children, ...props }, ref) => (
    <section
      ref={ref}
      className={cn(
        'bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-6',
        className
      )}
      {...props}
    >
      {children}
    </section>
  )
)

SectionWrapper.displayName = 'SectionWrapper'
