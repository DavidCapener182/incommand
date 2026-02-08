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
  forceLight?: boolean
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
  isLast = false,
  forceLight = false
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
    <Card
      style={forceLight ? { backgroundColor: '#ffffff', color: '#0f172a' } : undefined}
      className={cn(
      'group relative h-full overflow-hidden border border-slate-200 bg-white py-0 shadow-sm transition-colors duration-200',
      forceLight ? 'text-slate-900 dark:border-slate-200 dark:bg-white dark:text-slate-900' : 'dark:border-[#2d437a]/70 dark:bg-[#13213f]',
      isFirst && 'rounded-tl-xl rounded-bl-xl',
      isLast && 'rounded-tr-xl rounded-br-xl',
      isFilterable && 'cursor-pointer touch-target',
      isSelected && (forceLight
        ? 'z-10 border-blue-300 bg-blue-50 ring-1 ring-blue-300/70'
        : 'z-10 border-blue-300 bg-blue-50 ring-1 ring-blue-300/70 dark:border-blue-400 dark:bg-blue-900/20 dark:ring-blue-500/60'),
      pulse && 'animate-pulse',
      className
    )}
    >
      <CardContent className="flex h-full flex-col items-center justify-center gap-y-2 px-4 py-3 sm:px-5 sm:py-3">
        <div className="flex w-full items-center justify-center gap-2">
          {icon && (
            <div
              style={forceLight ? { backgroundColor: '#f1f5f9' } : undefined}
              className={cn(
              "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100",
              forceLight ? 'text-slate-700' : 'dark:bg-[#223052]',
              colorClasses[color as keyof typeof colorClasses] || 'text-gray-400'
            )}
            >
              {icon}
            </div>
          )}
          <div className={cn(
            'text-center text-xs font-semibold uppercase tracking-[0.12em]',
            forceLight ? 'text-slate-500' : 'text-muted-foreground'
          )}>
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
        <div className={cn(
          'w-full flex-none text-center text-3xl font-semibold tracking-tight',
          forceLight ? 'text-slate-900' : 'text-foreground'
        )}>
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
        role="button"
        tabIndex={0}
        aria-label={`${title}: ${value}${isSelected ? ' (active filter)' : ''}`}
        aria-pressed={isSelected}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.5, 
          delay: index * 0.1,
          ease: "easeOut"
        }}
        whileHover={{ 
          y: -2,
          scale: 1.01,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onClick) { e.preventDefault(); onClick(); } }}
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
        y: -2,
        transition: { duration: 0.2 }
      }}
    >
      {content}
    </motion.div>
  );
}
