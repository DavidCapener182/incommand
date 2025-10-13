// src/utils/animations.ts
import { Variants } from 'framer-motion'

/**
 * Global animation configurations for consistent motion design
 * Following Material Design and modern UI principles
 */

// Easing curves
export const easing = {
  easeInOut: 'easeInOut' as const,
  easeOut: 'easeOut' as const,
  easeIn: 'easeIn' as const,
  sharp: 'linear' as const,
  spring: { type: 'spring', stiffness: 300, damping: 30 } as const
}

// Duration presets (in seconds)
export const duration = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8
}

// Fade animations
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: duration.normal, ease: easing.easeOut }
  }
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: duration.normal, ease: easing.easeOut }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: duration.fast, ease: easing.easeIn }
  }
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: duration.normal, ease: easing.easeOut }
  }
}

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: duration.normal, ease: easing.easeOut }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: duration.fast, ease: easing.easeIn }
  }
}

// Slide animations
export const slideInRight: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { duration: duration.normal, ease: easing.easeOut }
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: duration.fast, ease: easing.easeIn }
  }
}

export const slideInLeft: Variants = {
  hidden: { x: '-100%', opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { duration: duration.normal, ease: easing.easeOut }
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: { duration: duration.fast, ease: easing.easeIn }
  }
}

// Modal/Dialog animations
export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: duration.fast, ease: easing.easeOut }
  },
  exit: {
    opacity: 0,
    transition: { duration: duration.fast, ease: easing.easeIn }
  }
}

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { duration: duration.normal, ease: easing.easeOut }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: duration.fast, ease: easing.easeIn }
  }
}

// List/Stagger animations
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: duration.normal, ease: easing.easeOut }
  }
}

// Hover/Tap animations
export const hoverScale = {
  scale: 1.05,
  transition: { duration: duration.fast, ease: easing.easeOut }
}

export const tapScale = {
  scale: 0.95,
  transition: { duration: duration.instant, ease: easing.sharp }
}

export const hoverLift = {
  y: -4,
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  transition: { duration: duration.fast, ease: easing.easeOut }
}

// Loading/Spinner animations
export const spin = {
  rotate: 360,
  transition: {
    duration: 1,
    ease: 'linear',
    repeat: Infinity
  }
}

export const pulse = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    ease: easing.easeInOut,
    repeat: Infinity
  }
}

export const shimmer: Variants = {
  initial: { backgroundPosition: '-100% 0' },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 1.5,
      ease: 'linear',
      repeat: Infinity
    }
  }
}

// Success/Error animations
export const successBounce: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: [0, 1.2, 1],
    opacity: 1,
    transition: {
      duration: 0.5,
      times: [0, 0.6, 1],
      ease: easing.easeOut
    }
  }
}

export const errorShake: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.5 }
  }
}

// Notification animations
export const notificationSlide: Variants = {
  initial: { x: 400, opacity: 0 },
  animate: { 
    x: 0, 
    opacity: 1,
    transition: { duration: duration.normal, ease: easing.easeOut }
  },
  exit: { 
    x: 400, 
    opacity: 0,
    transition: { duration: duration.fast, ease: easing.easeIn }
  }
}

// Card animations
export const cardHover: Variants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -8,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    transition: { duration: duration.fast, ease: easing.easeOut }
  }
}

// Page transitions
export const pageTransition: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: duration.normal, ease: easing.easeOut }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { duration: duration.fast, ease: easing.easeIn }
  }
}

// Collapse/Expand animations
export const collapse: Variants = {
  collapsed: { height: 0, opacity: 0, overflow: 'hidden' },
  expanded: { 
    height: 'auto', 
    opacity: 1,
    transition: { duration: duration.normal, ease: easing.easeOut }
  }
}

// Ripple effect (for buttons)
export const ripple = {
  scale: [0, 2],
  opacity: [0.5, 0],
  transition: { duration: 0.6 }
}

// Utility functions
export const getStaggerDelay = (index: number, baseDelay = 0.05) => ({
  delay: index * baseDelay
})

export const getRandomDelay = (min = 0, max = 0.3) => ({
  delay: Math.random() * (max - min) + min
})

// Presets for common use cases
export const presets = {
  fastFade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: duration.fast }
  },
  
  fastSlideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: duration.fast }
  },
  
  spring: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 },
    transition: easing.spring
  }
}

