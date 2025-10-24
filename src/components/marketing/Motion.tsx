'use client'

import { motion } from 'framer-motion'
import type { HTMLAttributes, PropsWithChildren } from 'react'

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  className?: string
  onClick?: () => void
  role?: string
  tabIndex?: number
  onKeyDown?: (event: React.KeyboardEvent) => void
}

export const FadeIn = ({ children, delay = 0, className, onClick, role, tabIndex, onKeyDown }: FadeInProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className={className}
    onClick={onClick}
    role={role}
    tabIndex={tabIndex}
    onKeyDown={onKeyDown}
  >
    {children}
  </motion.div>
)
