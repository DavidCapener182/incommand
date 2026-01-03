'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export const Avatar = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted',
      className
    )}
    {...props}
  />
))
Avatar.displayName = 'Avatar'

export const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn('flex h-full w-full items-center justify-center text-sm font-medium', className)}
    {...props}
  />
))
AvatarFallback.displayName = 'AvatarFallback'

