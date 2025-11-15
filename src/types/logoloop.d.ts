declare module '@/components/LogoLoop' {
  import type { ComponentType, ReactNode } from 'react'

  type LogoNode =
    | { node: ReactNode; title?: string; href?: string; ariaLabel?: string }
    | { src: string; alt?: string; href?: string; title?: string; srcSet?: string; sizes?: string; width?: number; height?: number }

  export interface LogoLoopProps {
    logos: LogoNode[]
    speed?: number
    direction?: 'left' | 'right' | 'up' | 'down'
    width?: number | string
    logoHeight?: number
    gap?: number
    hoverSpeed?: number
    pauseOnHover?: boolean
    fadeOut?: boolean
    fadeOutColor?: string
    scaleOnHover?: boolean
    className?: string
    ariaLabel?: string
    style?: React.CSSProperties
  }

  const LogoLoop: ComponentType<LogoLoopProps>
  export default LogoLoop
}

