'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface MarqueeProps extends HTMLAttributes<HTMLDivElement> {
  pauseOnHover?: boolean
  reverse?: boolean
}

export const Marquee = forwardRef<HTMLDivElement, MarqueeProps>(
  ({ className, children, pauseOnHover = false, reverse = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('overflow-hidden', className)}
        {...props}
      >
        <div
          className={cn(
            'marquee-track flex w-max items-stretch gap-6 animate-marquee [animation-direction:var(--marquee-direction,normal)]',
            reverse && '[--marquee-direction:reverse]',
            pauseOnHover && 'marquee-paused'
          )}
        >
          {children}
        </div>
      </div>
    )
  }
)
Marquee.displayName = 'Marquee'

