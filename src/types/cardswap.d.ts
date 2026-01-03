declare module '@/components/CardSwap' {
  import type { ComponentType, HTMLAttributes, ReactNode } from 'react'

  export const Card: ComponentType<HTMLAttributes<HTMLDivElement>>

  export interface CardSwapProps {
    width?: number
    height?: number
    cardDistance?: number
    verticalDistance?: number
    delay?: number
    pauseOnHover?: boolean
    onCardClick?: (index: number) => void
    skewAmount?: number
    easing?: 'elastic' | 'linear'
    children: ReactNode
  }

  const CardSwap: ComponentType<CardSwapProps>
  export default CardSwap
}

