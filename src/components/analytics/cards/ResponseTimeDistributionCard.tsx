'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { BarChart3, Clock } from 'lucide-react'

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
          Range: {label}
        </p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {payload[0].value} <span className="font-normal text-slate-500">Requests</span>
          </p>
        </div>
      </div>
    )
  }
  return null
}

interface ResponseTimeDistributionCardProps {
  responseTimeData?: Array<{ bucket: string; count: number }>
  className?: string
}

export default function ResponseTimeDistributionCard({ responseTimeData = [], className = '' }: ResponseTimeDistributionCardProps) {
  const [mounted, setMounted] = useState(false)
  const [focusBar, setFocusBar] = useState<number | null>(null)

  // hydration fix
  useEffect(() => {
    setMounted(true)
  }, [])

  const chartData = useMemo(() => responseTimeData, [responseTimeData])

  // Calculate total for summary
  const totalRequests = useMemo(() => 
    chartData.reduce((acc, curr) => acc + curr.count, 0), 
    [chartData]
  )

  if (!mounted) return null

  return (
    <div className={`w-full ${className}`}>
      {/* Card Container with entrance animation and hover lift */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:scale-[1.005] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Response Time
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Latency distribution
              </p>
            </div>
          </div>
          
          {/* Summary Badge */}
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {totalRequests}
            </span>
            <span className="text-xs font-medium text-orange-500 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" /> Total Requests
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                layout="vertical" 
                margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
              >
                {/* Horizontal Gradient Definition */}
                <defs>
                  <linearGradient id="orangeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                    <stop offset="100%" stopColor="#FDBA74" stopOpacity={0.8} />
                  </linearGradient>
                </defs>

                <CartesianGrid 
                  strokeDasharray="3 3" 
                  horizontal={false} 
                  stroke="rgba(148, 163, 184, 0.15)" 
                />
                
                <XAxis 
                  type="number" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                
                <YAxis 
                  dataKey="bucket" 
                  type="category" 
                  width={80}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                />

                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: 'transparent' }}
                />

                <Bar 
                  dataKey="count" 
                  radius={[0, 4, 4, 0]} // Rounded only on the right end
                  barSize={32}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  onMouseEnter={(_, index) => setFocusBar(index)}
                  onMouseLeave={() => setFocusBar(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill="url(#orangeGradient)"
                      fillOpacity={focusBar === index ? 1 : (focusBar === null ? 0.9 : 0.5)}
                      className="transition-all duration-300 cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

