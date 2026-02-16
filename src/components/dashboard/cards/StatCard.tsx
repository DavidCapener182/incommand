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
  changeType?: 'positive' | 'negative' | 'neutral'
  size?: 'hero' | 'default' | 'compact'
  muted?: boolean
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
  size = 'default',
  muted = false,
  isFirst = false,
  isLast = false,
  forceLight = false
}: StatCardProps) {
  const colorStyles = {
    blue: {
      icon: 'text-blue-600',
      accent: 'from-blue-600/95 via-cyan-500/80 to-transparent',
    },
    red: {
      icon: 'text-red-600',
      accent: 'from-rose-600/95 via-red-500/80 to-transparent',
    },
    yellow: {
      icon: 'text-amber-600',
      accent: 'from-amber-600/95 via-yellow-500/80 to-transparent',
    },
    green: {
      icon: 'text-emerald-600',
      accent: 'from-emerald-600/95 via-green-500/80 to-transparent',
    },
  }
  const resolvedColor = colorStyles[color as keyof typeof colorStyles] ?? colorStyles.blue
  const changeClass =
    changeType === 'positive'
      ? 'text-emerald-700 dark:text-emerald-300'
      : changeType === 'negative'
        ? 'text-rose-700 dark:text-rose-300'
        : 'text-slate-500 dark:text-slate-300'
  const hasTrendData = Array.isArray(trendData) && trendData.length > 1
  const sparklineMax = hasTrendData ? Math.max(...(trendData as number[]), 1) : 1
  const sizeClasses = {
    hero: {
      card: 'px-4 py-3.5',
      title: 'text-[10px] tracking-[0.16em]',
      value: 'text-[3rem] font-black',
      icon: 'h-7 w-7',
    },
    default: {
      card: 'px-3.5 py-2.5 sm:px-4 sm:py-2.5',
      title: 'text-[10px] tracking-[0.13em]',
      value: 'text-[2.35rem] font-bold',
      icon: 'h-[22px] w-[22px]',
    },
    compact: {
      card: 'px-3 py-2 sm:px-3 sm:py-2',
      title: 'text-[9px] tracking-[0.12em]',
      value: 'text-[2rem] font-bold',
      icon: 'h-5 w-5',
    },
  }[size]

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
      'group relative h-full overflow-hidden border border-slate-200/90 bg-gradient-to-b from-white via-white to-slate-50/85 py-0 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.42)] transition-all duration-200',
      forceLight
        ? 'text-slate-900 dark:border-slate-200 dark:bg-white dark:text-slate-900'
        : 'dark:border-[#2d437a]/70 dark:bg-gradient-to-b dark:from-[#162346] dark:to-[#13213f]',
      isFirst && 'rounded-tl-xl rounded-bl-xl',
      isLast && 'rounded-tr-xl rounded-br-xl',
      isFilterable && 'cursor-pointer touch-target',
      isSelected && (forceLight
        ? 'z-10 border-blue-300 bg-blue-50 ring-2 ring-blue-300/70 shadow-[0_14px_28px_-16px_rgba(59,130,246,0.45)]'
        : 'z-10 border-blue-300 bg-blue-50 ring-2 ring-blue-300/70 shadow-[0_14px_28px_-16px_rgba(59,130,246,0.45)] dark:border-blue-400 dark:bg-blue-900/20 dark:ring-blue-500/60'),
      muted && !isSelected && 'opacity-85',
      'hover:border-slate-300 hover:shadow-[0_14px_30px_-16px_rgba(37,99,235,0.32)] dark:hover:border-blue-400/60',
      pulse && 'animate-pulse',
    )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-r transition-opacity duration-200',
          size === 'hero' ? 'h-1.5' : 'h-1',
          resolvedColor.accent,
          isSelected ? 'opacity-100' : (size === 'hero' ? 'opacity-90 group-hover:opacity-100' : 'opacity-65 group-hover:opacity-90')
        )}
      />
      <CardContent className={cn("flex h-full flex-col items-center justify-center gap-y-2", sizeClasses.card)}>
        <div className="flex w-full items-center justify-center gap-2">
          {icon && (
            <div
              style={forceLight ? { backgroundColor: '#f1f5f9' } : undefined}
              className={cn(
              "flex flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100/90 shadow-sm",
              sizeClasses.icon,
              size !== 'hero' && !isSelected && 'opacity-80',
              forceLight ? 'text-slate-700' : 'dark:border-slate-600/50 dark:bg-[#223052]',
              resolvedColor.icon
            )}
            >
              {icon}
            </div>
          )}
          <div className={cn(
            'text-center font-semibold uppercase',
            sizeClasses.title,
            forceLight ? 'text-slate-500' : 'text-muted-foreground'
          )}>
            {title}
          </div>
        </div>
        <div className={cn(
          'w-full flex-none text-center tracking-tight',
          sizeClasses.value,
          forceLight ? 'text-slate-900' : (size === 'hero' ? 'text-foreground' : 'text-slate-900 dark:text-slate-50')
        )}>
          {value}
        </div>
        {(change || hasTrendData) && (
          <div className="mt-1 flex w-full items-center justify-between gap-2">
            <div className={cn("inline-flex items-center gap-1 text-[11px] font-semibold", size !== 'hero' && 'opacity-70', changeClass)}>
              <span className="leading-none">
                {changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : '→'}
              </span>
              <span>{change || '0%'} <span className="opacity-70">1h</span></span>
            </div>
            {hasTrendData && (
              <svg
                viewBox="0 0 64 18"
                className="h-4 w-20"
                aria-hidden="true"
              >
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  points={(trendData as number[])
                    .map((point, index, values) => {
                      const x = (index / (values.length - 1 || 1)) * 64
                      const y = 16 - (point / sparklineMax) * 14
                      return `${x},${y}`
                    })
                    .join(' ')}
                  className={cn(
                    size !== 'hero' && 'opacity-65',
                    changeType === 'positive'
                      ? 'text-emerald-500'
                      : changeType === 'negative'
                        ? 'text-rose-500'
                        : 'text-slate-400'
                  )}
                />
              </svg>
            )}
          </div>
        )}
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
        className={cn('h-full min-w-0', className)}
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
      className={cn('h-full min-w-0', className)}
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
