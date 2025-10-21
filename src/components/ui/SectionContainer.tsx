import * as React from 'react'

import { cn } from '@/lib/utils'

type Accent =
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'slate'
  | 'emerald'
  | 'amber'
  | 'custom'

const ACCENT_MAP: Record<Exclude<Accent, 'custom'>, string> = {
  blue: 'from-blue-500 to-indigo-500',
  indigo: 'from-indigo-500 to-blue-500',
  purple: 'from-purple-500 to-pink-500',
  pink: 'from-pink-500 to-rose-500',
  slate: 'from-slate-500 to-slate-400',
  emerald: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-orange-500',
}

type SectionContainerProps = React.HTMLAttributes<HTMLElement>

const SectionContainer = React.forwardRef<HTMLElement, SectionContainerProps>(
  ({ className, children, ...props }, ref) => (
    <section
      ref={ref}
      className={cn(
        'bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700',
        'p-5 md:p-6 space-y-6 transition-all',
        className
      )}
      {...props}
    >
      {children}
    </section>
  )
)
SectionContainer.displayName = 'SectionContainer'

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  accent?: Accent
  accentClassName?: string
  actions?: React.ReactNode
  description?: string
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  (
    {
      title,
      accent = 'blue',
      accentClassName,
      actions,
      description,
      className,
      ...props
    },
    ref
  ) => {
    const accentGradient =
      accent === 'custom'
        ? accentClassName
        : ACCENT_MAP[accent] || ACCENT_MAP.blue

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-4 md:flex-row md:items-center md:justify-between',
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'h-3 w-1 rounded-full bg-gradient-to-b',
              accentGradient
            )}
          />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              {title}
            </h2>
            {description ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    )
  }
)
SectionHeader.displayName = 'SectionHeader'

export { SectionContainer, SectionHeader }
