'use client'

import React, { memo, useMemo, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface PerformanceChartProps {
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  type?: 'bar' | 'line' | 'pie'
  height?: number
  showLabels?: boolean
  showValues?: boolean
  animate?: boolean
  className?: string
}

const PerformanceChart = memo(function PerformanceChart({
  data,
  type = 'bar',
  height = 200,
  showLabels = true,
  showValues = true,
  animate = true,
  className = ''
}: PerformanceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  const colors = useMemo(() => [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#06B6D4', // cyan-500
  ], [])

  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data])

  const drawChart = (progress = 1) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const padding = 20
    const chartWidth = rect.width - (padding * 2)
    const chartHeight = rect.height - (padding * 2)

    if (type === 'bar') {
      const barWidth = (chartWidth / data.length) * 0.8
      const barSpacing = chartWidth / data.length

      data.forEach((item, index) => {
        const barHeight = (item.value / maxValue) * chartHeight * progress
        const x = padding + (index * barSpacing) + (barSpacing - barWidth) / 2
        const y = padding + chartHeight - barHeight

        // Draw bar
        ctx.fillStyle = item.color || colors[index % colors.length]
        ctx.fillRect(x, y, barWidth, barHeight)

        // Draw label
        if (showLabels) {
          ctx.fillStyle = '#374151'
          ctx.font = '12px system-ui'
          ctx.textAlign = 'center'
          ctx.fillText(item.label, x + barWidth / 2, rect.height - 5)
        }

        // Draw value
        if (showValues) {
          ctx.fillStyle = '#374151'
          ctx.font = 'bold 10px system-ui'
          ctx.textAlign = 'center'
          ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5)
        }
      })
    } else if (type === 'line') {
      const pointSpacing = chartWidth / (data.length - 1)

      ctx.strokeStyle = colors[0]
      ctx.lineWidth = 2
      ctx.beginPath()

      data.forEach((item, index) => {
        const x = padding + (index * pointSpacing)
        const y = padding + chartHeight - ((item.value / maxValue) * chartHeight * progress)

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        // Draw point
        ctx.fillStyle = item.color || colors[0]
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.beginPath()
      })

      ctx.stroke()

      // Draw labels
      if (showLabels) {
        ctx.fillStyle = '#374151'
        ctx.font = '12px system-ui'
        ctx.textAlign = 'center'
        data.forEach((item, index) => {
          const x = padding + (index * pointSpacing)
          ctx.fillText(item.label, x, rect.height - 5)
        })
      }
    } else if (type === 'pie') {
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const radius = Math.min(centerX, centerY) - padding

      let currentAngle = 0
      const total = data.reduce((sum, item) => sum + item.value, 0)

      data.forEach((item, index) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI * progress
        const color = item.color || colors[index % colors.length]

        // Draw slice
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
        ctx.closePath()
        ctx.fill()

        currentAngle += sliceAngle
      })
    }
  }

  useEffect(() => {
    if (animate) {
      let startTime: number
      const duration = 1000 // 1 second animation

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)
        
        drawChart(progress)

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    } else {
      drawChart(1)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [data, type, animate])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      drawChart(animate ? 1 : 1)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [animate])

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ height: `${height}px` }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ maxWidth: '100%', height: '100%' }}
      />
    </motion.div>
  )
})

export default PerformanceChart
