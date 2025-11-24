'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { UserX, Ban } from 'lucide-react'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
          Time: {label}
        </p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {payload[0].value} <span className="font-normal text-slate-500">Ejections</span>
          </p>
        </div>
      </div>
    )
  }
  return null
}

interface EjectionPatternsCardProps {
  ejectionPatternData?: Array<{ hour: string; ejections: number }>
  className?: string
}

export default function EjectionPatternsCard({ ejectionPatternData = [], className = '' }: EjectionPatternsCardProps) {
  const [mounted, setMounted] = useState(false)

  // hydration fix
  useEffect(() => {
    setMounted(true)
  }, [])

  const chartData = useMemo(() => ejectionPatternData, [ejectionPatternData])

  // Calculate total for summary
  const totalEjections = useMemo(() => 
    chartData.reduce((acc, curr) => acc + curr.ejections, 0), 
    [chartData]
  )

  if (!mounted) return null

  return (
    <div className={`w-full ${className}`}>
      {/* Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:scale-[1.005] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Ejection Patterns
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Refusals & ejections by hour
              </p>
            </div>
          </div>
          
          {/* Summary Badge */}
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {totalEjections}
            </span>
            <span className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
              <Ban className="w-3 h-3" /> Total Incidents
            </span>
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
                  dataKey="hour" 
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
                  cursor={{ stroke: '#EF4444', strokeWidth: 1, strokeDasharray: '4 4' }}
                />

                <Line 
                  type="monotone" 
                  dataKey="ejections" 
                  stroke="#EF4444" 
                  strokeWidth={3}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 4, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#EF4444' }}
                  animationDuration={2000}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

