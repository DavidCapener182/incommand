'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { LineChart as LineChartIcon, TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface ChartDataPoint {
  time: string
  incidents: number
  responseTime?: number
  quality?: number
  compliance?: number
  predicted: number | null
}

interface TrendAnalysisCardProps {
  chartData: ChartDataPoint[]
  className?: string
}

// Custom Tooltip Component
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    name: string
    color: string
  }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
          Time: {label}
        </p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {entry.value} <span className="font-normal text-slate-500 text-xs ml-1">{entry.name}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export default function TrendAnalysisCard({ chartData, className = '' }: TrendAnalysisCardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate simple trend direction for the badge
  const trendDirection = useMemo(() => {
    if (chartData.length < 2) return 'stable'
    const last = chartData[chartData.length - 1]?.incidents || 0
    const first = chartData[0]?.incidents || 0
    const diff = last - first
    if (diff > 5) return 'increasing'
    if (diff < -5) return 'decreasing'
    return 'stable'
  }, [chartData])

  if (!mounted) return null

  return (
    <div className={`w-full ${className}`}>
      {/* Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:scale-[1.005] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
              <LineChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Trend Analysis
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Actual vs. Predicted Volume
              </p>
            </div>
          </div>
          
          {/* Trend Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
            trendDirection === 'increasing' ? 'bg-red-50 border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400' :
            trendDirection === 'decreasing' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-900/30 dark:text-emerald-400' :
            'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/20 dark:border-blue-900/30 dark:text-blue-400'
          }`}>
            {trendDirection === 'increasing' && <TrendingUp className="w-3.5 h-3.5" />}
            {trendDirection === 'decreasing' && <TrendingDown className="w-3.5 h-3.5" />}
            {trendDirection === 'stable' && <Activity className="w-3.5 h-3.5" />}
            <span className="capitalize">{trendDirection}</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="rgba(148, 163, 184, 0.15)" 
                />
                
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  dy={10}
                />
                
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />

                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />

                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => <span className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">{value}</span>}
                />

                {/* Actual Incidents Line */}
                <Line 
                  type="monotone" 
                  dataKey="incidents" 
                  name="Actual Incidents"
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#3B82F6' }}
                  animationDuration={2000}
                  animationEasing="ease-out"
                />

                {/* Predicted Trend Line */}
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  name="Predicted Trend"
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  animationDuration={2000}
                  animationEasing="ease-out"
                  animationBegin={500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

