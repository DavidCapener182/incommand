'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { triggerHaptic } from '../utils/hapticFeedback'

interface ChartDataPoint {
  x: number | string
  y: number
  label?: string
  color?: string
}

interface MobileOptimizedChartProps {
  data: ChartDataPoint[]
  title: string
  type?: 'line' | 'bar' | 'area'
  height?: number
  showTooltip?: boolean
  className?: string
  onDataPointClick?: (point: ChartDataPoint) => void
}

export default function MobileOptimizedChart({
  data,
  title,
  type = 'line',
  height = 200,
  showTooltip = true,
  className = '',
  onDataPointClick
}: MobileOptimizedChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Calculate chart dimensions and scales
  const chartWidth = 320 // Fixed width for mobile
  const chartHeight = Math.max(height, 200) // Ensure minimum height
  const padding = { top: 20, right: 20, bottom: 40, left: 40 }
  const plotWidth = Math.max(chartWidth - padding.left - padding.right, 200)
  const plotHeight = Math.max(chartHeight - padding.top - padding.bottom, 120)

  // Get data bounds
  const xValues = data.map(d => typeof d.x === 'number' ? d.x : parseFloat(d.x.toString()))
  const yValues = data.map(d => d.y)
  const minX = data.length > 0 ? Math.min(...xValues) : 0
  const maxX = data.length > 0 ? Math.max(...xValues) : 1
  const minY = data.length > 0 ? Math.min(...yValues) : 0
  const maxY = data.length > 0 ? Math.max(...yValues) : 1

  // Scale functions
  const scaleX = (value: number) => {
    if (maxX === minX) return padding.left + plotWidth / 2
    return padding.left + ((value - minX) / (maxX - minX)) * plotWidth
  }
  const scaleY = (value: number) => {
    if (maxY === minY) return padding.top + plotHeight / 2
    return padding.top + plotHeight - ((value - minY) / (maxY - minY)) * plotHeight
  }

  const handlePointHover = (point: ChartDataPoint, event: React.MouseEvent | React.TouchEvent) => {
    if (!chartRef.current) return

    const rect = chartRef.current.getBoundingClientRect()
    let clientX: number, clientY: number

    if ('touches' in event) {
      // Touch event
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
      triggerHaptic.light()
    } else {
      // Mouse event
      clientX = event.clientX
      clientY = event.clientY
    }

    setHoveredPoint(point)
    setTooltipPosition({
      x: clientX - rect.left,
      y: clientY - rect.top - 10
    })
    setIsVisible(true)
  }

  const handlePointLeave = () => {
    setIsVisible(false)
    setHoveredPoint(null)
  }

  const handlePointClick = (point: ChartDataPoint) => {
    triggerHaptic.medium()
    onDataPointClick?.(point)
  }

  // Adjust tooltip position to stay within bounds
  useEffect(() => {
    if (tooltipRef.current && isVisible) {
      const tooltip = tooltipRef.current
      const rect = tooltip.getBoundingClientRect()
      
      let adjustedX = tooltipPosition.x
      let adjustedY = tooltipPosition.y

      // Keep tooltip within chart bounds
      if (adjustedX + rect.width > chartWidth) {
        adjustedX = chartWidth - rect.width - 10
      }
      if (adjustedX < 0) {
        adjustedX = 10
      }
      if (adjustedY < 0) {
        adjustedY = tooltipPosition.y + 30
      }

      setTooltipPosition({ x: adjustedX, y: adjustedY })
    }
  }, [isVisible, tooltipPosition.x, tooltipPosition.y, chartWidth])

  const renderLineChart = () => {
    if (data.length < 2) return null

    const points = data.map(d => `${scaleX(typeof d.x === 'number' ? d.x : parseFloat(d.x.toString()))},${scaleY(d.y)}`).join(' ')
    
    return (
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-blue-500"
      />
    )
  }

  const renderBarChart = () => {
    const barWidth = plotWidth / data.length * 0.6
    
    return data.map((d, index) => {
      const x = scaleX(typeof d.x === 'number' ? d.x : parseFloat(d.x.toString()))
      const y = scaleY(d.y)
      const barHeight = plotHeight - (y - padding.top)
      
      return (
        <rect
          key={index}
          x={x - barWidth / 2}
          y={y}
          width={barWidth}
          height={barHeight}
          fill={d.color || 'currentColor'}
          className="text-blue-500"
        />
      )
    })
  }

  const renderAreaChart = () => {
    if (data.length < 2) return null

    const points = data.map(d => `${scaleX(typeof d.x === 'number' ? d.x : parseFloat(d.x.toString()))},${scaleY(d.y)}`).join(' ')
    const bottomY = padding.top + plotHeight
    
    return (
      <polygon
        points={`${padding.left},${bottomY} ${points} ${padding.left + plotWidth},${bottomY}`}
        fill="currentColor"
        fillOpacity="0.2"
        className="text-blue-500"
      />
    )
  }

  const renderDataPoints = () => {
    return data.map((d, index) => {
      const x = scaleX(typeof d.x === 'number' ? d.x : parseFloat(d.x.toString()))
      const y = scaleY(d.y)
      
      return (
        <circle
          key={index}
          cx={x}
          cy={y}
          r="4"
          fill={d.color || 'currentColor'}
          className="text-blue-500 cursor-pointer hover:r-6 transition-all"
          onMouseEnter={(e) => handlePointHover(d, e)}
          onMouseLeave={handlePointLeave}
          onTouchStart={(e) => handlePointHover(d, e)}
          onTouchEnd={handlePointLeave}
          onClick={() => handlePointClick(d)}
        />
      )
    })
  }

  const renderXAxis = () => {
    const ticks = data.filter((_, index) => index % Math.ceil(data.length / 5) === 0)
    
    return ticks.map((d, index) => {
      const x = scaleX(typeof d.x === 'number' ? d.x : parseFloat(d.x.toString()))
      
      return (
        <g key={index}>
          <line
            x1={x}
            y1={padding.top + plotHeight}
            x2={x}
            y2={padding.top + plotHeight + 5}
            stroke="currentColor"
            className="text-gray-400"
          />
          <text
            x={x}
            y={padding.top + plotHeight + 20}
            textAnchor="middle"
            className="text-xs fill-gray-600 dark:fill-gray-400"
          >
            {d.label || d.x}
          </text>
        </g>
      )
    })
  }

  const renderYAxis = () => {
    const ticks = [minY, minY + (maxY - minY) * 0.25, minY + (maxY - minY) * 0.5, minY + (maxY - minY) * 0.75, maxY]
    
    return ticks.map((value, index) => {
      const y = scaleY(value)
      
      return (
        <g key={index}>
          <line
            x1={padding.left - 5}
            y1={y}
            x2={padding.left}
            y2={y}
            stroke="currentColor"
            className="text-gray-400"
          />
          <text
            x={padding.left - 10}
            y={y + 4}
            textAnchor="end"
            className="text-xs fill-gray-600 dark:fill-gray-400"
          >
            {Math.round(value)}
          </text>
        </g>
      )
    })
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Chart Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>

      {/* Chart Container */}
      <div className="p-4">
        <div 
          ref={chartRef}
          className="relative overflow-hidden"
          style={{ width: chartWidth, height: chartHeight }}
        >
          <svg
            width={chartWidth}
            height={chartHeight}
            className="w-full h-full"
          >
            {/* Grid Lines */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-gray-700" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Y Axis */}
            {renderYAxis()}
            
            {/* X Axis */}
            {renderXAxis()}
            
            {/* Chart Content */}
            {type === 'area' && renderAreaChart()}
            {type === 'line' && renderLineChart()}
            {type === 'bar' && renderBarChart()}
            
            {/* Data Points */}
            {renderDataPoints()}
          </svg>

          {/* Mobile-Optimized Tooltip */}
          <AnimatePresence>
            {isVisible && hoveredPoint && showTooltip && (
              <motion.div
                ref={tooltipRef}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute pointer-events-none z-10"
                style={{
                  left: tooltipPosition.x,
                  top: tooltipPosition.y,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                  <div className="font-medium">{hoveredPoint.label || hoveredPoint.x}</div>
                  <div className="text-gray-300 dark:text-gray-600">Value: {hoveredPoint.y}</div>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
