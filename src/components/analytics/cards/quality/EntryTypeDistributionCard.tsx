'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  Sector 
} from 'recharts'
import { PieChart as PieChartIcon, FileText, CheckCircle2 } from 'lucide-react'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { color: string } }>
}

// --- Helper for Colors ---
const COLORS = {
  excellent: '#10B981', // Emerald
  fair: '#F59E0B',      // Amber
  poor: '#EF4444'       // Red
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.payload.color }} />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {data.name}
          </p>
        </div>
        <p className="text-sm font-bold text-slate-900 dark:text-white pl-4">
          {data.value.toFixed(1)}%
        </p>
      </div>
    )
  }
  return null
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      className="transition-all duration-300 ease-out"
    />
  )
}

interface EntryTypeDistributionCardProps {
  amendmentRate?: number
  retrospectiveRate?: number
  className?: string
}

export default function EntryTypeDistributionCard({ 
  amendmentRate = 0, 
  retrospectiveRate = 0, 
  className = '' 
}: EntryTypeDistributionCardProps) {
  const [mounted, setMounted] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // hydration fix
  useEffect(() => {
    setMounted(true)
  }, [])

  const data = useMemo(() => {
    const cleanRate = Math.max(0, 100 - amendmentRate - retrospectiveRate)
    return [
      { name: 'Clean Entries', value: cleanRate, color: COLORS.excellent },
      { name: 'Amended Entries', value: amendmentRate, color: COLORS.fair },
      { name: 'Retrospective', value: retrospectiveRate, color: COLORS.poor }
    ]
  }, [amendmentRate, retrospectiveRate])

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const onPieLeave = () => {
    setActiveIndex(null)
  }

  if (!mounted) return null

  return (
    <div className={`w-full ${className}`}>
      {/* Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:scale-[1.005] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Entry Distribution
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Documentation integrity breakdown
              </p>
            </div>
          </div>
          
          {/* Summary Badge */}
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {data[0].value.toFixed(1)}%
            </span>
            <span className="text-xs font-medium text-emerald-500 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Clean Rate
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 grid md:grid-cols-2 gap-6 items-center">
          
          {/* Chart Area */}
          <div className="h-[240px] w-full relative">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  {...(activeIndex !== null && { activeIndex, activeShape: renderActiveShape })}
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      strokeWidth={0}
                      className="outline-none transition-opacity duration-300"
                      style={{ 
                        opacity: activeIndex === null || activeIndex === index ? 1 : 0.3 
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <FileText className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Entries</span>
            </div>
          </div>

          {/* Legend Area */}
          <div className="flex flex-col justify-center space-y-4 pr-4">
            {data.map((item, index) => (
              <div 
                key={item.name}
                className={`group flex items-center justify-between p-3 rounded-xl transition-all duration-200 cursor-pointer ${activeIndex === index ? 'bg-slate-50 dark:bg-slate-800 scale-105 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-900" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <span className={`text-sm font-medium transition-colors ${activeIndex === index ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                  {item.value.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

