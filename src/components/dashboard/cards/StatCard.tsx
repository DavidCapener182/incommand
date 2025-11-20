'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  title: string
  value: number
  icon?: React.ReactNode
  color?: string
  isSelected?: boolean
  trendData?: number[]
  onClick?: () => void
  isFilterable?: boolean
  className?: string
  tooltip?: string
  showPulse?: boolean
  index?: number
  change?: string
  changeType?: 'positive' | 'negative'
  isFirst?: boolean
  isLast?: boolean
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  isSelected, 
  onClick, 
  isFilterable = false,
  className,
  tooltip,
  showPulse,
  index = 0,
  trendData,
  change,
  changeType,
  isFirst = false,
  isLast = false
}: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-500',
    red: 'text-red-500',
    yellow: 'text-yellow-500',
    green: 'text-green-500',
  }

  // Pulse animation when value changes
  const [pulse, setPulse] = React.useState(false);
  const prevValue = React.useRef(value);
  React.useEffect(() => {
    if (prevValue.current !== value) {
      setPulse(true);
      const timeout = setTimeout(() => setPulse(false), 400);
      prevValue.current = value;
      return () => clearTimeout(timeout);
    }
  }, [value]);

  const [showTooltip, setShowTooltip] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(true);
  const [tooltipPosition, setTooltipPosition] = React.useState({ top: 0, left: 0 });
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const checkScreen = () => {
      if (typeof window !== 'undefined') {
        setIsDesktop(window.innerWidth >= 768);
      }
    };
    checkScreen();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkScreen);
      return () => window.removeEventListener('resize', checkScreen);
    }
  }, []);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 10,
        left: rect.left + rect.width / 2
      });
    }
    setShowTooltip(true);
  };

  const content = (
    <Card className={cn(
      'rounded-none border-0 shadow-none py-0 relative h-full bg-background',
      '!border-0 !shadow-none',
      isFirst && 'rounded-tl-xl rounded-bl-xl',
      isLast && 'rounded-tr-xl rounded-br-xl',
      isFilterable && 'cursor-pointer touch-target',
      isSelected && 'ring-2 ring-blue-500 ring-offset-0 dark:ring-offset-0 z-10',
      pulse && 'animate-pulse',
      className
    )} style={{ border: 'none !important', outline: 'none', boxShadow: 'none' }}>
      <CardContent className="flex flex-col items-center justify-center gap-y-2 px-4 sm:px-6 py-2 sm:py-3 h-full">
        <div className="flex items-center justify-center gap-2 w-full">
          {icon && (
            <div className={cn(
              "flex-shrink-0 flex items-center justify-center",
              colorClasses[color as keyof typeof colorClasses] || 'text-gray-400'
            )}>
              {icon}
            </div>
          )}
          <div className="text-sm font-medium text-muted-foreground text-center">
            {title}
          </div>
          {change && (
            <div
              className={cn(
                "text-xs font-medium",
                changeType === "positive"
                  ? "text-green-800 dark:text-green-400"
                  : "text-red-800 dark:text-red-400"
              )}
            >
              {change}
            </div>
          )}
        </div>
        <div className="w-full flex-none text-3xl font-medium tracking-tight text-foreground text-center">
          {value}
        </div>
        {showPulse && (
          <div className="absolute top-2 right-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isFilterable) {
    return (
      <motion.div 
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.5, 
          delay: index * 0.1,
          ease: "easeOut"
        }}
        whileHover={{ 
          y: -4,
          scale: 1.03,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {content}
        {tooltip && showTooltip && isDesktop && typeof window !== 'undefined' && createPortal(
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed z-[99999] px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-xl whitespace-nowrap"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              transform: 'translateX(-50%)',
              pointerEvents: 'none'
            }}
          >
            {tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </motion.div>,
          document.body
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2 }
      }}
    >
      {content}
    </motion.div>
  );
}

