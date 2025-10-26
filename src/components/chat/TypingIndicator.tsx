'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface TypingIndicatorProps {
  className?: string
  color?: 'gray' | 'purple' | 'blue'
}

export default function TypingIndicator({ 
  className = '', 
  color = 'gray' 
}: TypingIndicatorProps) {
  const colorClasses = {
    gray: 'bg-gray-400',
    purple: 'bg-purple-400',
    blue: 'bg-blue-400'
  }

  return (
    <motion.div 
      className={`flex gap-1 p-2 items-center ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={`w-2 h-2 ${colorClasses[color]} rounded-full`}
          animate={{ 
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1, 0.8]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 1.2, 
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </motion.div>
  )
}
