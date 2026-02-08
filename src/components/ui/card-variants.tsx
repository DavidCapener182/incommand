'use client'

import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Card variant class names from the design system (globals.css).
 * Use these with cn() for consistent card styling.
 *
 * @see CARD_DESIGN_SYSTEM.md
 * @see src/app/globals.css (.card-depth, .card-depth-subtle, etc.)
 */
export const CARD_VARIANTS = {
  depth: 'card-depth',
  depthInteractive: 'card-depth-interactive',
  depthSubtle: 'card-depth-subtle',
  tableRow: 'card-table-row',
  modal: 'card-modal',
  skeleton: 'card-skeleton',
  time: 'card-time',
  control: 'card-control',
  board: 'card-board',
  alt: 'card-alt',
  feature: 'card-feature',
  mobile: 'card-mobile',
} as const

export type CardVariant = keyof typeof CARD_VARIANTS

interface CardVariantDemoProps {
  variant: CardVariant
  className?: string
  children?: React.ReactNode
}

/**
 * Renders a card with the given variant for documentation/showcase.
 * Use the raw class names (CARD_VARIANTS) in production components.
 */
export function CardVariantDemo({ variant, className, children }: CardVariantDemoProps) {
  const variantClass = CARD_VARIANTS[variant]
  return (
    <div className={cn(variantClass, 'p-4', className)}>
      {children ?? (
        <p className="text-sm text-muted-foreground">
          <code className="font-mono text-xs">{variantClass}</code>
        </p>
      )}
    </div>
  )
}
