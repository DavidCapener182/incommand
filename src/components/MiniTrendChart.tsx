'use client'

import { useMemo } from 'react'

interface MiniTrendChartProps {
  data: number[]
  color?: string
  height?: number
  width?: number
}

export default function MiniTrendChart({ 
  data, 
  color = '#3B82F6',
  height = 30,
  width = 80
}: MiniTrendChartProps) {
  const pathData = useMemo(() => {
    if (data.length === 0) return ''
    
    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const range = max - min || 1
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1 || 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    
    return `M ${points.join(' L ')}`
  }, [data, height, width])

  const trend = useMemo(() => {
    if (data.length < 2) return 'stable'
    const first = data[0]
    const last = data[data.length - 1]
    if (last > first * 1.1) return 'up'
    if (last < first * 0.9) return 'down'
    return 'stable'
  }, [data])

  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : color

  if (data.length === 0) return null

  return (
    <div className="relative" style={{ width, height }}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Background area */}
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={trendColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={trendColor} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        {pathData && (
          <path
            d={`${pathData} L ${width},${height} L 0,${height} Z`}
            fill={`url(#gradient-${color})`}
          />
        )}
        
        {/* Line */}
        {pathData && (
          <path
            d={pathData}
            fill="none"
            stroke={trendColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />
        )}
        
        {/* Dots */}
        {data.map((value, index) => {
          const max = Math.max(...data, 1)
          const min = Math.min(...data, 0)
          const range = max - min || 1
          const x = (index / (data.length - 1 || 1)) * width
          const y = height - ((value - min) / range) * height
          
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={index === data.length - 1 ? 3 : 1.5}
              fill={trendColor}
              className="drop-shadow"
            />
          )
        })}
      </svg>
      
      {/* Trend indicator */}
      {trend !== 'stable' && (
        <div className="absolute -top-1 -right-1">
          <span className="text-xs">
            {trend === 'up' ? '↗' : '↘'}
          </span>
        </div>
      )}
    </div>
  )
}

